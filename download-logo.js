/**
 * Download Binance ticker logos into public/logos.
 *
 * Sources (in order for gaps after marketing):
 * 1. Spot marketing symbol list (pair → logo URL)
 * 2. Asset library (baseAsset → logoUrl)
 * 3. RWA / tokenized stock meta (TradFi ticker → bin.bnbstatic.com icon)
 * 4. CoinGecko search — exact symbol match only
 * 5. Financial Modeling Prep stock images (remaining TradFi / equity tickers)
 *
 * Filenames: marketing keeps spot symbols (e.g. SPCXBUSDT.png); gap fills
 * use futures symbols (e.g. DISUSDT.png) so the card resolver matches exact.
 */

import fs from 'fs'
import path from 'path'
import process from 'node:process'
import { pipeline } from 'stream/promises'

import axios from 'axios'

const logoDirectory = './public/logos'
const BNBSTATIC = 'https://bin.bnbstatic.com'
const USDT = 'USDT'
const MULTIPLIER_PREFIXES = ['1000000', '1000']

/** Futures baseAsset → FMP image-stock ticker when names differ. */
const FMP_TICKER_ALIASES = {
  BRKB: 'BRK-B',
  HK0700: '0700.HK',
  HK1810: '1810.HK',
  SKHYNIX: '000660.KS',
  SAMSUNG: '005930.KS',
  HYUNDAI: '005380.KS',
  TENCENT: '0700.HK',
  PAYP: 'PYPL',
}

if (!fs.existsSync(logoDirectory)) {
  fs.mkdirSync(logoDirectory, { recursive: true })
}

// Clash Verge local proxy — same path as Chrome (default port 7897)
const requestConfig = {
  timeout: 30000,
  proxy: { protocol: 'http', host: '127.0.0.1', port: 7897 },
}

async function getJson(url, { retries = 3, params } = {}) {
  let lastErr
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, {
        ...requestConfig,
        params,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'application/json',
          clienttype: 'web',
        },
      })
      return res.data
    } catch (err) {
      lastErr = err
      if (attempt < retries) {
        console.warn(`GET ${url} attempt ${attempt} failed, retrying...`)
        await sleep(1000 * attempt)
      }
    }
  }
  throw lastErr
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function absoluteLogoUrl(urlOrPath) {
  if (!urlOrPath) return null
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath
  const pathPart = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`
  return `${BNBSTATIC}${pathPart}`
}

function logoPath(stem) {
  return path.join(logoDirectory, `${stem}.png`)
}

function existingStems() {
  return new Set(
    fs
      .readdirSync(logoDirectory)
      .filter((f) => f.endsWith('.png'))
      .map((f) => f.slice(0, -4)),
  )
}

/** Same candidate order as src/utils/binanceLogo.ts */
function logoCandidates(symbol) {
  const upper = symbol.toUpperCase()
  const out = []
  const pushBusdt = (sym) => {
    out.push(sym)
    if (!sym.endsWith(USDT)) return
    const base = sym.slice(0, -USDT.length)
    if (base.length >= 2) out.push(`${base}B${USDT}`)
  }
  pushBusdt(upper)
  for (const prefix of MULTIPLIER_PREFIXES) {
    if (!upper.startsWith(prefix)) continue
    const rest = upper.slice(prefix.length)
    if (rest) pushBusdt(rest)
    break
  }
  return [...new Set(out)]
}

function hasLogo(stemSet, futuresSymbol) {
  return logoCandidates(futuresSymbol).some((c) => stemSet.has(c))
}

function stripMultiplier(base) {
  for (const prefix of MULTIPLIER_PREFIXES) {
    if (base.startsWith(prefix) && base.length > prefix.length) {
      return base.slice(prefix.length)
    }
  }
  return base
}

function isTradFi(s) {
  return (
    s.contractType === 'TRADIFI_PERPETUAL' ||
    [
      'EQUITY',
      'HK_EQUITY',
      'KR_EQUITY',
      'COMMODITY',
      'INDEX',
      'PREMARKET',
    ].includes(s.underlyingType)
  )
}

async function downloadLogo(stem, url, { force = false } = {}) {
  const filePath = logoPath(stem)
  if (!force && fs.existsSync(filePath)) {
    return 'skip'
  }
  const logoUrl = absoluteLogoUrl(url)
  if (!logoUrl) return 'no-url'

  const response = await axios({
    url: logoUrl,
    method: 'GET',
    responseType: 'stream',
    ...requestConfig,
    // FMP / CoinGecko may not need Binance client headers
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/*,*/*' },
  })
  await pipeline(response.data, fs.createWriteStream(filePath))
  return 'ok'
}

async function fetchFuturesUsdtPerps() {
  const data = await getJson('https://fapi.binance.com/fapi/v1/exchangeInfo')
  return (data.symbols || []).filter(
    (s) =>
      s.quoteAsset === 'USDT' &&
      s.status === 'TRADING' &&
      (s.contractType === 'PERPETUAL' ||
        s.contractType === 'TRADIFI_PERPETUAL'),
  )
}

function missingFutures(futures, stems) {
  return futures.filter((s) => !hasLogo(stems, s.symbol))
}

async function downloadFromMarketing() {
  console.log('\n[1/5] Marketing symbol list...')
  const body = await getJson(
    'https://www.binance.com/bapi/composite/v1/public/marketing/symbol/list',
  )
  const rows = body?.data
  if (!Array.isArray(rows)) {
    console.error('Marketing list empty or unexpected shape')
    return { ok: 0, skip: 0, fail: 0 }
  }

  let ok = 0
  let skip = 0
  let fail = 0
  for (const { symbol, logo } of rows) {
    if (!symbol || !logo) continue
    try {
      const status = await downloadLogo(symbol, logo)
      if (status === 'ok') {
        ok++
        console.log(`  marketing ${symbol}.png`)
      } else if (status === 'skip') skip++
    } catch (err) {
      fail++
      console.error(`  marketing ${symbol} failed:`, err.message || err)
    }
  }
  console.log(`  done ok=${ok} skip=${skip} fail=${fail} total=${rows.length}`)
  return { ok, skip, fail }
}

async function downloadFromAssetLibrary(missing) {
  console.log('\n[2/5] Asset library (baseAsset → logoUrl)...')
  const body = await getJson(
    'https://www.binance.com/bapi/asset/v2/public/asset/asset/get-all-asset',
  )
  const rows = body?.data
  if (!Array.isArray(rows)) {
    console.error('Asset list empty or unexpected shape')
    return { ok: 0, skip: 0, fail: 0 }
  }

  const byCode = new Map()
  for (const row of rows) {
    const code = row.assetCode
    const url = row.fullLogoUrl || row.logoUrl
    if (code && url) byCode.set(code, url)
  }
  console.log(`  asset codes with logo: ${byCode.size}`)

  let ok = 0
  let skip = 0
  let fail = 0
  let noMatch = 0
  for (const s of missing) {
    const base = s.baseAsset
    const codes = [base, stripMultiplier(base)]
    if (base.endsWith('X') && base.length > 1) codes.push(base.slice(0, -1))
    if (base.endsWith('2') && base.length > 1) codes.push(base.slice(0, -1))

    let url
    for (const code of [...new Set(codes)]) {
      if (byCode.has(code)) {
        url = byCode.get(code)
        break
      }
    }
    if (!url) {
      noMatch++
      continue
    }

    try {
      const status = await downloadLogo(s.symbol, url)
      if (status === 'ok') {
        ok++
        console.log(`  asset ${s.symbol}.png ← ${base}`)
      } else if (status === 'skip') skip++
    } catch (err) {
      fail++
      console.error(`  asset ${s.symbol} failed:`, err.message || err)
    }
  }
  console.log(`  done ok=${ok} skip=${skip} fail=${fail} noMatch=${noMatch}`)
  return { ok, skip, fail }
}

async function downloadFromRwa(missing) {
  console.log('\n[3/5] RWA tokenized stock meta...')
  const listBody = await getJson(
    'https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/rwa/stock/detail/list/ai',
  )
  const list = listBody?.data
  if (!Array.isArray(list)) {
    console.error('RWA list empty or unexpected shape')
    return { ok: 0, skip: 0, fail: 0 }
  }

  const byTicker = new Map()
  for (const row of list) {
    const ticker = (row.ticker || '').toUpperCase()
    if (!ticker || byTicker.has(ticker)) continue
    byTicker.set(ticker, row)
  }
  console.log(`  RWA tickers: ${byTicker.size}`)

  const tradfi = missing.filter(isTradFi)
  let ok = 0
  let skip = 0
  let fail = 0
  let noMatch = 0

  for (const s of tradfi) {
    const row = byTicker.get(s.baseAsset.toUpperCase())
    if (!row?.chainId || !row?.contractAddress) {
      noMatch++
      continue
    }

    try {
      const metaBody = await getJson(
        'https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/rwa/meta/ai',
        {
          params: {
            chainId: row.chainId,
            contractAddress: row.contractAddress,
          },
        },
      )
      const icon = metaBody?.data?.icon
      if (!icon) {
        noMatch++
        continue
      }

      const status = await downloadLogo(s.symbol, icon)
      if (status === 'ok') {
        ok++
        console.log(`  rwa ${s.symbol}.png ← ${row.ticker}`)
      } else if (status === 'skip') skip++
      await sleep(120)
    } catch (err) {
      fail++
      console.error(`  rwa ${s.symbol} failed:`, err.message || err)
      await sleep(300)
    }
  }
  console.log(`  done ok=${ok} skip=${skip} fail=${fail} noMatch=${noMatch}`)
  return { ok, skip, fail }
}

async function downloadFromCoinGecko(missing) {
  console.log('\n[4/5] CoinGecko (exact symbol match only)...')
  const coins = missing.filter((s) => s.underlyingType === 'COIN')

  let ok = 0
  let skip = 0
  let fail = 0
  let none = 0

  for (const s of coins) {
    if (fs.existsSync(logoPath(s.symbol))) {
      skip++
      continue
    }

    const query = stripMultiplier(s.baseAsset)
    try {
      const body = await getJson('https://api.coingecko.com/api/v3/search', {
        params: { query },
        retries: 2,
      })
      const hits = body?.coins || []
      // Never fall back to hits[0] — that mapped INUSDT→bitcoin, etc.
      const match = hits.find(
        (c) => (c.symbol || '').toUpperCase() === query.toUpperCase(),
      )
      const url = match?.large || match?.thumb
      if (!match || !url) {
        none++
        console.log(`  coingecko no exact match for ${s.symbol}`)
        await sleep(1200)
        continue
      }

      const status = await downloadLogo(s.symbol, url)
      if (status === 'ok') {
        ok++
        console.log(`  coingecko ${s.symbol}.png ← ${match.id}`)
      } else if (status === 'skip') skip++
      await sleep(1500)
    } catch (err) {
      fail++
      console.error(`  coingecko ${s.symbol} failed:`, err.message || err)
      await sleep(3000)
    }
  }
  console.log(`  done ok=${ok} skip=${skip} fail=${fail} none=${none}`)
  return { ok, skip, fail, none }
}

function isEquityLike(s) {
  return ['EQUITY', 'HK_EQUITY', 'KR_EQUITY'].includes(s.underlyingType)
}

async function downloadFromFmp(missing) {
  console.log('\n[5/5] FMP stock images (remaining equity TradFi)...')
  // Commodities / indices often collide with equity tickers on FMP (e.g. CL).
  const equities = missing.filter(isEquityLike)

  let ok = 0
  let skip = 0
  let fail = 0
  let none = 0

  for (const s of equities) {
    if (fs.existsSync(logoPath(s.symbol))) {
      skip++
      continue
    }

    const base = s.baseAsset.toUpperCase()
    const tickers = [
      FMP_TICKER_ALIASES[base],
      base,
      base.replace(/USDT$/, ''),
    ].filter(Boolean)

    let downloaded = false
    for (const ticker of [...new Set(tickers)]) {
      const url = `https://financialmodelingprep.com/image-stock/${encodeURIComponent(ticker)}.png`
      try {
        const status = await downloadLogo(s.symbol, url)
        if (status === 'ok') {
          ok++
          downloaded = true
          console.log(`  fmp ${s.symbol}.png ← ${ticker}`)
          break
        }
        if (status === 'skip') {
          skip++
          downloaded = true
          break
        }
      } catch {
        // try next ticker alias
      }
    }
    if (!downloaded) {
      none++
      console.log(`  fmp no image for ${s.symbol}`)
    }
    await sleep(80)
  }
  console.log(`  done ok=${ok} skip=${skip} fail=${fail} none=${none}`)
  return { ok, skip, fail, none }
}

async function main() {
  console.log('Logo download →', path.resolve(logoDirectory))

  await downloadFromMarketing()

  const futures = await fetchFuturesUsdtPerps()
  let stems = existingStems()
  let missing = missingFutures(futures, stems)
  console.log(
    `\nFutures USDT perps: ${futures.length}; still missing after marketing: ${missing.length}`,
  )

  await downloadFromAssetLibrary(missing)
  stems = existingStems()
  missing = missingFutures(futures, stems)
  console.log(`Still missing after assets: ${missing.length}`)

  await downloadFromRwa(missing)
  stems = existingStems()
  missing = missingFutures(futures, stems)
  console.log(`Still missing after RWA: ${missing.length}`)

  await downloadFromCoinGecko(missing)
  stems = existingStems()
  missing = missingFutures(futures, stems)
  console.log(`Still missing after CoinGecko: ${missing.length}`)

  await downloadFromFmp(missing)
  stems = existingStems()
  missing = missingFutures(futures, stems)

  console.log('\n=== Summary ===')
  console.log(`Local logos: ${stems.size}`)
  console.log(`Futures still without resolvable logo: ${missing.length}`)
  if (missing.length) {
    const byType = missing.reduce((acc, s) => {
      const t = s.underlyingType || s.contractType || '?'
      acc[t] = (acc[t] || 0) + 1
      return acc
    }, {})
    console.log('By underlyingType:', byType)
    console.log(
      'Examples:',
      missing
        .slice(0, 40)
        .map((s) => s.symbol)
        .join(', '),
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
