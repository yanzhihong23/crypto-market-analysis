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

export enum OpenTime {
  UTC0 = 'sodUtc0',
  UTC8 = 'sodUtc8',
  OPEN24H = 'open24h',
}

/**
 * @interface OkxOpenInterest
 * @member {string} instType - 产品类型
 * @member {string} instId - 产品ID
 * @member {string} oi - 持仓量，按张为单位，open interest
 * @member {string} oiCcy - 持仓量，按币为单位
 * @member {string} ts - 数据产生时间，Unix时间戳的毫秒数格式，如 1597026383085
 */
export interface OkxOpenInterest {
  instType: string
  instId: string
  oi: string
  oiCcy: string
  ts: string
}

/**
 * @interface OkxFundingRate
 * @member {string} instType - 产品类型
 * @member {string} instId - 产品ID
 * @member {string} fundingRate - 资金费率
 * @member {string} ts - 数据产生时间，Unix时间戳的毫秒数格式，如 1597026383085
 */
export interface OkxFundingRate {
  instType: string
  instId: string
  fundingRate: string
  ts: string
}

export interface OkxInstrument {
  instType: string
  instId: string
  baseCcy: string
  quoteCcy: string
}
