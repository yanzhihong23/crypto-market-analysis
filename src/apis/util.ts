import { pathcat } from 'pathcat'

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

export const okxProxyGet = (path: string, params?: Params) =>
  get(proxyBase, path, params)
