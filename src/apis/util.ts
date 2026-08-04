import { pathcat } from 'pathcat'

import { FetchLimiter } from '../utils/FetchLimit'

type Params = Record<string, string | number | boolean | undefined>

/**
 * OKX serves `access-control-allow-origin` on `market/` and `public/`, so those
 * go straight to the exchange and never touch our own host.
 */
const directBase = 'https://www.okx.com/api/v5'

/**
 * `rubik/` serves no CORS header, so it has to be bounced off our own origin.
 * A rewrite carries it the rest of the way — `vercel.json` in production,
 * `server.proxy` in dev — which keeps it off any serverless function.
 */
const proxyBase = '/okx'

const get = async (base: string, path: string, params?: Params) => {
  const res = await fetch(pathcat(base, path, params ?? {}))
  const data = await res.json()
  if (data.code === '0') {
    return data.data
  }
  return data
}

export const okxGet = (path: string, params?: Params) =>
  get(directBase, path, params)

/**
 * Spacing between two requests to the same statistics path. The exchange allows
 * five every two seconds there, so four is the whole of the margin — enough that
 * a slow round trip or a retry cannot tip a walk of the watchlist over the line.
 *
 * The cost is paid by a cold start and nowhere else: a symbol's series arrives
 * half a second later than it might have, on readings that are then polled every
 * five minutes. What it buys is the pass that fills a board never being the pass
 * that gets it rate limited — which is not hypothetical, a watchlist of three
 * was already drawing a 429 on the mount pass.
 */
const PROXY_INTERVAL_MS = 500

/**
 * One queue per path, because the allowance is per path. Held in a map rather
 * than declared per endpoint so that a statistics call added later is paced
 * without anyone having to remember to pace it.
 */
const limiters = new Map<string, FetchLimiter<[Params | undefined], unknown>>()

/**
 * Generic in the payload because the queue cannot be: one map holds the limiter
 * for every path, so what comes back off it is only as good as the annotation
 * the caller puts on it — which is the same trade the direct getter makes, where
 * the parsed body arrives untyped and each endpoint names its own rows.
 */
export const okxProxyGet = <T>(path: string, params?: Params): Promise<T> => {
  let limiter = limiters.get(path)
  if (!limiter) {
    limiter = new FetchLimiter(
      (queued: Params | undefined) => get(proxyBase, path, queued),
      PROXY_INTERVAL_MS,
    )
    limiters.set(path, limiter)
  }
  return limiter.fetchWithLimit(params) as Promise<T>
}
