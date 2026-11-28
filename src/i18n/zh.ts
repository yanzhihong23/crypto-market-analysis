import type { Messages } from './en'

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
    signals: '统计',
    charts: '图表',
    theories: '理论',
    indicators: '指标',
    discipline: '纪律',
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
    what: '当一个品种有两类指标同时偏离常态时提醒：价格做了什么、成交量与主动成交方向、持仓量与强平是否跟上，以及盘口原本持有什么、开价多少。',
    tape: '底部提示条',
    desktopNotifications: '桌面通知',
    blocked: '已在浏览器设置中对本站禁用。',
    unsupported: '当前浏览器不支持通知。',
    sound: '提示音',
    testSignalSound: '异动音',
    testPriceSound: '目标价音',
    onlyWhenAway: '仅在离开时提醒',
    awayMeans: '离开指当前窗口不在最前。',
    highPriorityOnly: '仅高优异动发推送/提示音',
    highPriorityOnlyHint:
      '常规异动仍亮卡圈与提示条；仅强平、大周期突破、三类共振或底图共振时弹窗/响铃。',
    highPriorityTag: '重点',
    outcomeSummary: (count, hitRate, avgMove) =>
      `已跟踪 ${count} 条 · 15分钟延续率 ${hitRate}% · 均幅 ${avgMove}`,
    outcomeLine: (parts) => `后续表现：${parts.join(' · ')}`,
    empty: '暂无触发记录',
    recent: '最近提醒',
    hide: '隐藏最近提醒',
    openDetail: (symbol) => `查看 ${symbol} 详情`,
  },

  priceAlert: {
    action: '价格预警',
    title: (symbol) => `${symbol} 价格预警`,
    currentPrice: (price) => `当前 ${price}`,
    direction: '触发条件',
    above: '突破 ≥',
    below: '跌破 ≤',
    targetLabel: '目标价',
    targetPlaceholder: '输入目标价格',
    notePlaceholder: '备注（可选），如：前高压力、关键支撑',
    activeTitle: '监控中的价格预警',
    activeCount: (count) => `价格预警 (${count})`,
    delete: '删除预警',
    ruleShort: (above, price) => `${above ? '≥' : '≤'} ${price}`,
    triggeredHeadline: (above, price) =>
      above ? `突破目标价 ${price}` : `跌破目标价 ${price}`,
    triggeredPrice: (price) => `最新价 ${price}`,
  },

  addTicker: {
    action: '添加合约',
    noOptions: '没有匹配的永续合约',
    placeholder: '搜索币种，例如 SOL',
    group: '所属分组',
  },

  groups: {
    defaultName: '默认',
    newGroup: '新建分组',
    renameGroup: '重命名分组',
    nameLabel: '分组名称',
    namePlaceholder: '例如：加密主流、贵金属、美股合约',
    save: '保存',
    moveUp: '上移',
    moveDown: '下移',
    delete: '删除分组',
    moreActions: '分组操作',
    addToGroup: (name) => `添加合约到「${name}」`,
    emptyHint: '拖拽卡片到此分组，或点击右侧 + 添加合约',
    dropHint: '松开移入此分组',
  },

  watchlist: {
    emptyTitle: '还没有添加合约',
    emptyBody: '添加一个永续合约即可开始接收实时行情。',
  },

  toolbar: {
    controls: '显示设置',
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
    klineVolume: '量柱',
    klineVolumeHint: '在每张卡片的走势图背后画出成交量',
    compact: '简版',
    compactHint: '卡片只显示币种、涨跌幅和最新价',
    breadthUp: (count) => `${count} 涨`,
    breadthDown: (count) => `${count} 跌`,
    breadthMedian: '中位',
    breadthHint: (count) => `自选 ${count} 个品种的涨跌分布与涨跌幅中位数`,
  },

  card: {
    openCharts: '查看图表',
    pin: '置顶',
    unpin: '取消置顶',
    pinAria: '将该合约置顶',
    unpinAria: '取消该合约置顶',
    moveToGroup: '移至分组',
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
    takerFlow: (share, buying) => `主动成交 ${share} 为${buying ? '买' : '卖'}`,
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

    compression: (share) => `盘整 ${share}×`,
    compressionDetail: (share, quieterThan) =>
      `近 2 小时振幅为常态的 ${share}×，窄于近 8 小时内 ${quieterThan}% 的时段`,

    breakoutHigh: '24小时新高',
    breakoutHighDetail: '正处于24小时最高价',
    breakoutLow: '24小时新低',
    breakoutLowDetail: '正处于24小时最低价',

    rangeBreak: (days, high) => `${days}日新${high ? '高' : '低'}`,
    rangeBreakDetail: (days, high) =>
      `已突破 ${days} 日${high ? '最高价' : '最低价'}`,

    upperWick: '上影线',
    upperWickDetail: (share) => `冲高回落，上影线占 ${share}%`,
    lowerWick: '下影线',
    lowerWickDetail: (share) => `低位承接，下影线占 ${share}%`,

    strength: (excess) => `${excess} 相对大盘`,
    strengthDetail: (excess, sigmas) => `相对大盘 ${excess} · ${sigmas}`,

    volume: (multiple) => `成交量 ${multiple}×`,
    volumeDetail: (multiple, sigmas) =>
      `成交量为常态的 ${multiple}× · ${sigmas}`,

    taker: (share, buying) => `${buying ? '买' : '卖'}盘 ${share}`,
    takerDetail: (share, buying, sigmas) =>
      `主动成交 ${share} 为${buying ? '买' : '卖'} · ${sigmas}`,

    liquidation: (share, longs) => `强平${longs ? '多' : '空'} ${share}`,
    liquidationDetail: (share, longs) =>
      `5 分钟内 ${share} 的持仓量被强平，以${longs ? '多头' : '空头'}为主`,

    openInterest: (change) => `持仓 ${change} 5分钟`,
    openInterestDetail: (change, sigmas) =>
      `持仓量 5分钟 ${change} · ${sigmas}`,

    ratio: (sigmas) => `多空比 ${sigmas}`,
    ratioDetail: (deviation) => `多空比${deviation}`,

    divergence: (sigmas, eliteLonger) =>
      `大户${eliteLonger ? '偏多' : '偏空'} ${sigmas}`,
    divergenceDetail: (sigmas, eliteLonger) =>
      `大户持仓较散户异常${eliteLonger ? '偏多' : '偏空'} · ${sigmas}`,

    funding: (sigmas) => `资金费率 ${sigmas}`,
    fundingDetail: (deviation) => `资金费率${deviation}`,

    fundingShift: (moved) => `资金费率 ${moved}`,
    fundingShiftDetail: (moved) => `资金费率自上次结算以来变动 ${moved}`,

    basis: (basis) => `${basis} 相对现货`,
    basisDetail: (basis, over) => `较现货${over ? '溢价' : '折价'} ${basis}`,

    spread: (spread) => `价差 ${spread}`,
    spreadDetail: (spread, multiple) =>
      `盘口价差 ${spread}，为该品种常态的 ${multiple}×`,
  },

  backdrop: {
    title: '中长线',
    rangeLabel: '30 日区间位置',
    pending: '正在读取近 30 日数据。',
    relativeLabel: '相对 BTC',
    relativeWindow30d: '30 日',
    relativeWindow7d: '7 日',

    relativeStrength: (signed) => `${signed} 相对板块`,
    relativeStrengthDetail: (size, ahead) =>
      `扣除 BTC 后，30 日收益${ahead ? '领先' : '落后'}板块其余品种 ${size}`,

    rangePositionHigh: '接近30日高点',
    rangePositionLow: '接近30日低点',
    rangePositionDetail: (percent, high) =>
      `处于30日区间的 ${percent}%，距${high ? '高点' : '低点'}不足一成`,

    dailyCoil: (share) => `3日盘整 ${share}×`,
    dailyCoilDetail: (share, quieterThan) =>
      `近 3 日振幅为常态的 ${share}×，窄于历史上 ${quieterThan}% 的三日时段`,

    volRegime: (ratio) => `波动 ${ratio}× 月度`,
    volRegimeDetail: (ratio, expanding) =>
      `近一周振幅为近一月的 ${ratio}×，波动正在${expanding ? '放大' : '收敛'}`,

    oiCrowded: '持仓接近百日高位',
    oiEmpty: '持仓接近百日低位',
    oiPercentileDetail: (percent, crowded) =>
      crowded
        ? `近 100 日里有 ${percent}% 的日子持仓量比现在低，未平仓的仓位堆得很厚`
        : `近 100 日里只有 ${percent}% 的日子持仓量比现在低，未平仓的仓位很薄`,

    fundingCarry: (signed) => `周成本 ${signed}`,
    fundingCarryDetail: (paid, annual, longsPaying) =>
      `近一周${longsPaying ? '多头' : '空头'}累计支付 ${paid}，年化 ${annual}`,
  },

  timeframe: {
    title: '多周期',
    agreement: (agreed, of, up) =>
      `${of} 个周期中 ${agreed} 个向${up ? '上' : '下'}`,
    split: (of) => `${of} 个周期方向不一`,
    loading: '正在读取各周期…',
    position: (percent) => `处于该周期区间的 ${percent}%`,
    rangeBroken: (high) => (high ? '已突破上沿' : '已跌破下沿'),

    coil: (share) => `盘整 ${share}×`,
    coilDetail: (share, quieterThan) =>
      `振幅为常态的 ${share}×，窄于身后 ${quieterThan}% 的时段`,
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
    shortSqueeze: '空头挤仓行情',
    longLiquidation: '多头强平踩踏',
    squeezeCascade: '强平踩踏行情',
    confirmedBreakout: '放量突破确认',
    absorptionReversal: '受阻吸收反转',
    trendThrust: '顺势资金推动',
    crowdedSqueeze: '行情撞上拥挤仓位',
    other: '多项指标偏离常态',
  },

  signalLab: {
    title: '信号有效性统计',
    subtitle:
      '基于实盘 IndexedDB 样本库与离线回测数据，按剧本、单信号、底图共振和时段量化方向延续率与 MFE/MAE 盈亏比。',
    windowAll: '全部',
    window24h: '24H',
    window7d: '7D',
    window30d: '30D',
    sourceAll: '全部来源',
    sourceLive: '实盘',
    sourceBacktest: '回测',
    backfill: '补全 K 线结果',
    backfilling: '补全中…',
    importJson: '导入回测 JSON',
    exportCsv: '导出 CSV',
    exportJson: '导出 JSON',
    clear: '清空',
    backfillDone: (updated) =>
      updated > 0
        ? `已通过 5m 历史 K 线补全 ${updated} 条样本的后续表现。`
        : '所有已到期样本均已是最新状态。',
    importDone: (count) => `已导入 ${count} 条样本到统计库。`,
    importFailed: '无法解析该 JSON 文件中的样本数据。',
    emptyTitle: '暂无已记录的信号样本',
    emptyBody:
      'OKX 看板每次触发异动时会自动写入 IndexedDB，并通过历史 5m K 线精确补算 +5m / +15m / +1h / +4h 收益与 MFE/MAE（关闭页面重开也会自动补齐）。也可以先运行离线回测脚本生成 JSON 并导入查看：',
    kpiSamples: '样本总数',
    kpiEvaluated: (evaluated, perDay) =>
      `已评估 ${evaluated} 条 · ${perDay}/日`,
    kpiContinuation: '方向延续率',
    kpiDirectionalDetail: (avg, med) => `均幅 ${avg} · 中位 ${med}`,
    kpiExcursion: 'MFE / MAE 偏移比',
    kpiExcursionDetail: (mfe, mae) => `有利 ${mfe} · 不利 ${mae}`,
    kpiTierCompare: '重点 vs 常规分级',
    kpiTierLine: (label, cont, avg, count) =>
      `${label}：${cont} · ${avg}（${count} 条）`,
    chartRegimeTitle: '各剧本方向延续率（%）',
    chartDistTitle: '方向收益分布',
    chartSamples: '样本数',
    tabRegime: '按剧本',
    tabKind: '按单信号',
    tabBackdrop: '按底图共振',
    tabSession: '按交易时段',
    tabSymbol: '按品种',
    colGroup: '分组',
    colTotal: '触发数',
    colEval: '已评估',
    colCont: '延续率',
    colAvgDir: '平均方向收益',
    colMedDir: '中位收益',
    colMfe: '平均 MFE',
    colMae: '平均 MAE',
    colRatio: 'MFE/MAE',
    recentTitle: '最近样本明细',
    colTime: '时间',
    colSymbol: '品种',
    colSource: '来源',
    colRegime: '剧本与触发信号',
    colEntry: '触发价',
    colM5: '5分钟',
    colM15: '15分钟',
    colH1: '1小时',
    colH4: '4小时',
    badgeLive: '实盘',
    badgeBacktest: '回测',
    sessionAsia: '亚盘 (00–08 UTC)',
    sessionEurope: '欧盘 (08–16 UTC)',
    sessionUs: '美盘 (16–24 UTC)',
    backdropNone: '无底图共振',
    regimeOther: '其他组合',
    regimes: {
      'squeeze-cascade': '强平挤仓/踩踏',
      'confirmed-breakout': '放量突破确认',
      'absorption-reversal': '受阻吸收反转',
      'trend-thrust': '顺势资金推动',
      'crowded-squeeze': '拥挤仓位行情',
      other: '其他组合',
    },
  },
}
