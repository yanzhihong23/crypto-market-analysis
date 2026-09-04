/**
 * @interface OkxTicker
 * @member {string} instType - 产品类型
 * @member {string} instId - 产品ID
 * @member {string} last - 最新成交价
 * @member {string} lastSz - 最新成交的数量
 * @member {string} askPx - 卖一价
 * @member {string} askSz - 卖一价对应的量
 * @member {string} bidPx - 买一价
 * @member {string} bidSz - 买一价对应的数量
 * @member {string} open24h - 24小时开盘价
 * @member {string} high24h - 24小时最高价
 * @member {string} low24h - 24小时最低价
 * @member {string} volCcy24h - 24小时成交量，以币为单位
 * @member {string} vol24h - 24小时成交量，以张为单位
 * @member {string} sodUtc0 - UTC 0 时开盘价
 * @member {string} sodUtc8 - UTC+8 时开盘价
 * @member {string} ts - 数据产生时间，Unix时间戳的毫秒数格式，如 1597026383085
 */
export interface OkxTicker {
  instType: string
  instId: string
  last: string
  lastSz: string
  askPx: string
  askSz: string
  bidPx: string
  bidSz: string
  open24h: string
  high24h: string
  low24h: string
  volCcy24h: string
  vol24h: string
  sodUtc0: string
  sodUtc8: string
  ts: string
}

export interface OkxTickerFormatted extends OkxTicker {
  dif: string
  percent: string
  vol: string
  color: string
  /**
   * The open the change is measured from: whichever of the three the toolbar
   * has selected. Carried here so a card reading the change does not have to
   * subscribe to the toolbar to find out which one it was.
   */
  open: string
  /** Direction of the last tick against the one before it, filled in by the store. */
  isUp?: boolean
}

export enum OkxChannel {
  TICKERS = 'tickers',
  OPEN_INTEREST = 'open-interest',
  FUNDING_RATE = 'funding-rate',
  /**
   * Keyed by the underlying index rather than by the contract, so its messages
   * arrive under `BTC-USDT` while everything else on this socket arrives under
   * `BTC-USDT-SWAP`.
   */
  INDEX_TICKERS = 'index-tickers',
  /**
   * Every swap on the exchange, on one subscription. The odd one out on this
   * socket in two ways: it is subscribed once for the whole board rather than
   * per instrument, and its messages carry no `instId` on the arg — which
   * instrument each liquidation belongs to is inside the payload, because one
   * message can carry several.
   */
  LIQUIDATION_ORDERS = 'liquidation-orders',
}

export enum OpenTime {
  UTC0 = 'sodUtc0',
  UTC8 = 'sodUtc8',
  OPEN24H = 'open24h',
}

export enum SortBy {
  RATIO = 'ratio',
  VOLUME = 'volume',
  /**
   * Biggest 24h gainers first. The stored value stays `percent` from when this
   * was the only change sort, so a selection already in localStorage survives
   * the split into gainers and losers.
   */
  GAINERS = 'percent',
  LOSERS = 'losers',
  /** The order the tickers were added in, which is the one the user chose. */
  DEFAULT = 'default',
}

export enum Period {
  MINUTE_5 = '5m',
  MINUTE_15 = '15m',
  MINUTE_30 = '30m',
  HOUR_1 = '1H',
  HOUR_4 = '4H',
  HOUR_6 = '6H',
  HOUR_12 = '12H',
  DAY_1 = '1D',
  /**
   * The same day, cut at midnight UTC instead of at midnight Hong Kong, which
   * is where the exchange puts the boundary for every bar of six hours and up
   * unless it is asked otherwise.
   *
   * Both are here because the choice is not a preference: a bar this size is
   * read either as one of a run — where all that matters is that they are the
   * same length — or as *today*, in which case where the day starts decides
   * what is in it and what is still forming. `dailyStatsOf` reads it the second
   * way and is the one caller that wants this.
   */
  DAY_1_UTC = '1Dutc',
}

/**
 * @interface OkxOpenInterest
 * @member {string} instType - 产品类型
 * @member {string} instId - 产品ID
 * @member {string} oi - 持仓量，按张为单位，open interest
 * @member {string} oiCcy - 持仓量，按币为单位
 * @member {string} oiUsd - 持仓量，按美元为单位
 * @member {string} ts - 数据产生时间，Unix时间戳的毫秒数格式，如 1597026383085
 */
export interface OkxOpenInterest {
  instType: string
  instId: string
  oi: string
  oiCcy: string
  oiUsd: string
  ts: string
}

/**
 * @interface OkxIndexTicker
 * @member {string} instId - 指数，如 BTC-USDT
 * @member {string} idxPx - 最新指数价格
 * @member {string} ts - 数据产生时间，Unix时间戳的毫秒数格式
 */
export interface OkxIndexTicker {
  instId: string
  idxPx: string
  ts: string
}

/**
 * One position closed out by the exchange.
 *
 * @interface OkxLiquidationDetail
 * @member {string} posSide - 被强平的持仓方向，long 或 short
 * @member {string} side - 强平单的方向，buy 或 sell，与 posSide 相反
 * @member {string} sz - 强平数量，按张为单位，与持仓量同一单位
 * @member {string} bkPx - 破产价格
 * @member {string} ts - 强平发生时间，Unix时间戳的毫秒数格式
 */
export interface OkxLiquidationDetail {
  posSide: 'long' | 'short'
  side: string
  sz: string
  bkPx: string
  ts: string
}

/**
 * @interface OkxLiquidationOrder
 * @member {string} instId - 产品ID，在这个频道里只在消息体内出现
 * @member {OkxLiquidationDetail[]} details - 这一条消息携带的全部强平
 */
export interface OkxLiquidationOrder {
  instType: string
  instId: string
  details: OkxLiquidationDetail[]
}

/**
 * @interface OkxFundingRate
 * @member {string} instType - 产品类型
 * @member {string} instId - 产品ID
 * @member {string} fundingRate - 资金费率
 * @member {string} fundingTime - 下次结算时间，Unix时间戳的毫秒数格式
 * @member {string} ts - 数据产生时间，Unix时间戳的毫秒数格式，如 1597026383085
 */
export interface OkxFundingRate {
  instType: string
  instId: string
  fundingRate: string
  fundingTime: string
  ts: string
}

/**
 * @interface OkxInstrument
 * @member {string} instType - 产品类型
 * @member {string} instId - 产品ID
 * @member {string} baseCcy - 基础币种
 * @member {string} quoteCcy - 计价币种
 * @member {string} settleCcy - 结算币种
 * @member {string} ctVal - 合约面值
 */
export interface OkxInstrument {
  instType: string
  instId: string
  baseCcy: string
  quoteCcy: string
  settleCcy: string
  ctVal: string
}

/**
 * @interface OkxKline
 * @member {string} ts - 数据产生时间，Unix时间戳的毫秒数格式，如 1597026383085
 * @member {string} o - 开盘价
 * @member {string} h - 最高价
 * @member {string} l - 最低价
 * @member {string} c - 收盘价
 * @member {string} vol - 成交量，按张为单位
 * @member {string} volCcy - 成交量，按币为单位
 * @member {string} volCcyQuote - 成交量，按计价货币为单位，如 USDT/USD
 * @member {string} confirm - 数据确认状态
 */
export type OkxKline = [
  ts: string,
  o: string,
  h: string,
  l: string,
  c: string,
  vol: string,
  volCcy: string,
  volCcyQuote: string,
  confirm: '0' | '1',
]
