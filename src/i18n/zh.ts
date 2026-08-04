import { Messages } from './en'

/**
 * The same interface in Chinese. Typed as `Messages` rather than inferred, so a
 * key that goes missing or an argument list that drifts is a compile error here
 * rather than a gap on the board.
 *
 * Two conventions worth knowing when editing this file. Readings keep their
 * exchange-floor names — 多空比 for the account ratio, 资金费率 for funding,
 * 持仓量 for open interest — because those are the words the same numbers carry
 * on OKX's own Chinese pages, and a board that renamed them would be harder to
 * read than one left in English. And a direction goes in front of its number
 * (`高于常态 3.2σ`) where English puts it behind (`3.2σ above`), which is why
 * these are functions and not templates with numbered slots.
 */
export const zh: Messages = {
  language: {
    label: '语言',
    switchTo: '切换到英文',
  },

  common: {
    colon: '：',
    missing: '-',
    loading: '加载中…',
    cancel: '取消',
    add: '添加',
    clear: '清空',
    close: '关闭',
    open: '展开',
  },

  nav: {
    okx: 'OKX',
    binance: 'Binance',
    charts: '图表',
  },

  navMenu: {
    open: '打开导航',
    close: '关闭导航',
  },

  colorScheme: {
    toLight: '切换到浅色模式',
    toDark: '切换到深色模式',
  },

  feed: {
    connecting: '连接中',
    reconnecting: '重连中',
    live: '实时',
    stale: (seconds) => `已滞后 ${seconds} 秒`,
    healthyTitle: '正在接收实时更新',
    staleTitle: '当前行情数据不是最新的',
  },

  alerts: {
    title: '提醒',
    titleUnseen: (unseen) => `提醒，${unseen} 条未读`,
    what: '当一个品种有两类指标同时偏离常态时提醒：价格做了什么、成交量与持仓量是否跟上，以及盘口原本持有什么。',
    desktopNotifications: '桌面通知',
    blocked: '已在浏览器设置中对本站禁用。',
    unsupported: '当前浏览器不支持通知。',
    sound: '提示音',
    onlyWhenAway: '仅在离开时提醒',
    awayMeans: '离开指当前窗口不在最前。',
    empty: '暂无触发记录',
  },

  addTicker: {
    action: '添加合约',
    noOptions: '没有匹配的永续合约',
    placeholder: '搜索币种，例如 SOL',
  },

  watchlist: {
    emptyTitle: '还没有添加合约',
    emptyBody: '添加一个永续合约即可开始接收实时行情。',
  },

  toolbar: {
    sortBy: '排序',
    sortDefault: '默认',
    sortGainers: '涨幅',
    sortLosers: '跌幅',
    sortVolume: '成交额',
    sortRatio: '多空比',
    openTime: '开盘基准',
    open24h: '24H',
    openUtc0: 'UTC+0',
    openUtc8: 'UTC+8',
  },

  card: {
    openCharts: '查看图表',
    pin: '置顶',
    unpin: '取消置顶',
    pinAria: '将该合约置顶',
    unpinAria: '取消该合约置顶',
    remove: '从自选中移除',
    removeAria: '从自选列表中移除该合约',
  },

  metrics: {
    quoteVolume: '成交额',
    quoteVolumeAria: '成交额',
    ratio: '多空比',
    ratioAria: '多空账户比',
    funding: '资金费率',
    fundingAria: '资金费率',
    openInterest: '持仓量',
    openInterestAria: '持仓量变化',
    // `OI` in either language: the chip row only fits on one line because this
    // label is this short, and the tooltip spells out 持仓量 anyway.
    openInterestChange: (change) => `OI ${change}`,
    settlesIn: (countdown) => `${countdown}后结算`,
  },

  priceRange: {
    open: (price) => `开盘 ${price}`,
    weightedAverage: (price) => `加权均价 ${price}`,
  },

  detail: {
    window: '时间窗口',
    window24h: '24H',
    window3d: '3D',
    window30d: '30D',
    empty: '交易所没有该品种的历史数据',
    failed: '无法从交易所获取该品种的历史数据',
    price: '价格',
    priceNote: '柱状为币本位成交量',
    ratio: '多空账户比',
    ratioNote: '1 表示多空持平',
    openInterest: (symbol) => `持仓量（以 ${symbol} 计）`,
    funding: '资金费率',
    fundingNote: (settlements) => `最近 ${settlements} 次结算，单位 ‱`,
  },

  chart: {
    volume: '成交量',
    price: '价格',
    ratio: '多空账户比',
    openInterest: '持仓量',
    funding: '资金费率',
    kline: 'K线',
    ratioTrend: '多空账户比',
    openInterestHist: '持仓量历史',
  },

  overview: {
    symbol: '币种',
    period: '周期',
    add: '添加图表',
    remove: '移除图表',
  },

  binance: {
    sortVolume: '成交额',
    sortChange: '涨跌幅',
    ratio: '多空比',
    high24h: '24小时最高',
    low24h: '24小时最低',
    volumeBase: (symbol) => `成交量(${symbol})`,
    volumeQuote: '成交额(USDT)',
  },

  funding: {
    countdownMinutes: (minutes) => `${minutes}分`,
    countdownHours: (hours, minutes) => `${hours}时${minutes}分`,
  },

  signal: {
    sigmas: (sigmas) => `${sigmas}σ`,
    deviation: (sigmas, above) => `${above ? '高于' : '低于'}常态 ${sigmas}σ`,
    describeDeviation: (sigmas, above) =>
      `${above ? '高于' : '低于'}近期区间 ${sigmas}σ`,

    momentum: (move) => `5分钟 ${move}`,
    momentumDetail: (move, sigmas) => `5分钟 ${move} · ${sigmas}`,

    volatility: (range) => `振幅 ${range}`,
    volatilityDetail: (range, sigmas) => `K线振幅 ${range} · ${sigmas}`,

    breakoutHigh: '24小时新高',
    breakoutHighDetail: '正处于24小时最高价',
    breakoutLow: '24小时新低',
    breakoutLowDetail: '正处于24小时最低价',

    upperWick: '上影线',
    upperWickDetail: (share) => `冲高回落，上影线占 ${share}%`,
    lowerWick: '下影线',
    lowerWickDetail: (share) => `低位承接，下影线占 ${share}%`,

    strength: (excess) => `${excess} 相对大盘`,
    strengthDetail: (excess, sigmas) => `相对大盘 ${excess} · ${sigmas}`,

    volume: (multiple) => `成交量 ${multiple}×`,
    volumeDetail: (multiple, sigmas) =>
      `成交量为常态的 ${multiple}× · ${sigmas}`,

    openInterest: (change) => `持仓 ${change} 5分钟`,
    openInterestDetail: (change, sigmas) =>
      `持仓量 5分钟 ${change} · ${sigmas}`,

    ratio: (sigmas) => `多空比 ${sigmas}`,
    ratioDetail: (deviation) => `多空比${deviation}`,

    funding: (sigmas) => `资金费率 ${sigmas}`,
    fundingDetail: (deviation) => `资金费率${deviation}`,

    fundingShift: (moved) => `资金费率 ${moved}`,
    fundingShiftDetail: (moved) => `资金费率自上次结算以来变动 ${moved}`,

    basis: (basis) => `${basis} 相对现货`,
    basisDetail: (basis, over) => `较现货${over ? '溢价' : '折价'} ${basis}`,
  },

  flow: {
    'longs-building': '新多推动上涨',
    'shorts-covering': '空头平仓，而非新多进场',
    'shorts-building': '新空推动下跌',
    'longs-closing': '多头平仓，而非新空进场',
  },

  squeeze: {
    'longs-building': '新多追高进场',
    'short-squeeze': '空头被挤出行情',
    'shorts-building': '新空压价',
    'long-liquidation': '多头在下跌中被清算',
  },

  headline: {
    'price+flow': '有资金跟随的行情',
    'price+positioning': '行情撞上拥挤的持仓',
    'flow+positioning': '资金与拥挤的持仓相悖',
    'price+flow+positioning': '行情、资金与持仓同时异动',
    positioning: '两项持仓指标同时偏离',
    other: '多项指标偏离常态',
  },
}
