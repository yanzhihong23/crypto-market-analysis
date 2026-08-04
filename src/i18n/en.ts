/**
 * Every string the interface says, in English, and the shape every other
 * language is held to: `Messages` is this object's type, so a translation that
 * drops a key or takes the wrong arguments fails to compile instead of leaving
 * a blank on the board.
 *
 * Interpolation is a function per message rather than a placeholder syntax.
 * Every number here is formatted by whoever owns its unit — a percent by the
 * detector that measured it, a volume by the compact formatter — so what a
 * message needs is somewhere to put a string that is already finished. A
 * signature says which pieces and in what order, and lets a language put them
 * in a different one, which is the whole difficulty: Chinese wants the
 * direction in front of the number where English wants it behind.
 *
 * Punctuation that separates readings — the middle dot, the em dash — is not in
 * here. It is the same mark in both languages, so having it in the dictionary
 * would be two copies of one thing to keep in step.
 */
export const en = {
  language: {
    label: 'Language',
    /** Names the language being switched *to*, so it reads as the action. */
    switchTo: 'Switch to Chinese',
  },

  common: {
    /** Full width in Chinese, which is why it cannot stay in the markup. */
    colon: ': ',
    /** Stands in for a reading the feed has not sent yet. */
    missing: '-',
    loading: 'Loading…',
    cancel: 'Cancel',
    add: 'Add',
    clear: 'Clear',
    close: 'Close',
    /** MUI names the button that drops an Autocomplete's list open. */
    open: 'Open',
  },

  /**
   * One entry per page, and nothing else: `NAV_ITEMS` keys into this, so an
   * added route without a name for it will not compile.
   */
  nav: {
    // Exchange names, which are the same word everywhere.
    okx: 'OKX',
    binance: 'Binance',
    charts: 'Charts',
  },

  navMenu: {
    open: 'Open navigation',
    close: 'Close navigation',
  },

  colorScheme: {
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
  },

  feed: {
    connecting: 'Connecting',
    reconnecting: 'Reconnecting',
    live: 'Live',
    stale: (seconds: number) => `Stale ${seconds}s`,
    healthyTitle: 'Receiving live updates',
    staleTitle: 'The price feed is not currently up to date',
  },

  alerts: {
    title: 'Alerts',
    titleUnseen: (unseen: number) => `Alerts, ${unseen} new`,
    // Says what the list is a list of, so an empty one reads as nothing having
    // happened rather than as nothing working.
    what: "When two of a symbol's readings leave their usual range at once — what the price did, whether the volume, the side crossing the spread, open interest and forced closures were behind it, and what the book was already holding and charging.",
    /**
     * Sits apart from the two below it, and above them: this is the channel
     * that speaks on the page rather than off it, so the away condition that
     * closes the group must not look like it applies here too.
     */
    tape: 'Tape along the bottom',
    desktopNotifications: 'Desktop notifications',
    blocked: 'Blocked for this site in your browser settings.',
    unsupported: 'This browser does not support notifications.',
    sound: 'Sound',
    /** Gates both channels above, so it reads as a condition on them. */
    onlyWhenAway: 'Only when I am away',
    awayMeans: 'Away is this window not being the one in front.',
    empty: 'Nothing has fired yet',
    /** Names the strip along the bottom, which has no room to name itself. */
    recent: 'Recent alerts',
    hide: 'Hide recent alerts',
  },

  addTicker: {
    /** The button, its label and the dialog's title are one phrase. */
    action: 'Add ticker',
    noOptions: 'No matching perpetual',
    placeholder: 'Search a symbol, e.g. SOL',
  },

  watchlist: {
    emptyTitle: 'No tickers yet',
    emptyBody: 'Add a perpetual to start streaming prices.',
  },

  toolbar: {
    sortBy: 'Sort by',
    sortDefault: 'Default',
    sortGainers: 'Gainers',
    sortLosers: 'Losers',
    sortVolume: 'Volume',
    sortRatio: 'L/S',
    openTime: 'Open',
    // Clock references, which stay as they are in both languages.
    open24h: '24H',
    openUtc0: 'UTC+0',
    openUtc8: 'UTC+8',
  },

  card: {
    openCharts: 'Open charts',
    pin: 'Pin to front',
    unpin: 'Unpin',
    pinAria: 'Pin ticker to front',
    unpinAria: 'Unpin ticker',
    remove: 'Remove from watchlist',
    removeAria: 'Remove ticker from watchlist',
  },

  metrics: {
    quoteVolume: 'Quote Volume',
    quoteVolumeAria: 'Quote volume',
    ratio: 'L/S Ratio',
    ratioAria: 'Long/short ratio',
    funding: 'Funding Rate',
    fundingAria: 'Funding rate',
    openInterest: 'Open Interest',
    openInterestAria: 'Open interest change',
    /**
     * The session change, on a chip narrow enough to need the abbreviation —
     * which is why it stays `OI` in Chinese too.
     */
    openInterestChange: (change: string) => `OI ${change}`,
    settlesIn: (countdown: string) => `settles in ${countdown}`,
    /**
     * The side of the last five minutes of market orders, on the volume chip's
     * tooltip. Carried whenever it is known rather than only when it is
     * unusual: how much traded and who was doing it are one question, and the
     * chip already answers the first half.
     */
    takerFlow: (share: string, buying: boolean) =>
      `takers ${share} ${buying ? 'buying' : 'selling'}`,
  },

  priceRange: {
    open: (price: string) => `Open ${price}`,
    weightedAverage: (price: string) => `Weighted average ${price}`,
  },

  detail: {
    window: 'Window',
    window24h: '24H',
    window3d: '3D',
    window30d: '30D',
    empty: 'The exchange has no history for this one',
    failed: "Could not reach the exchange for this symbol's history",
    price: 'Price',
    priceNote: 'bars are coin volume',
    ratio: 'Long/short account ratio',
    ratioNote: '1 is an even crowd',
    openInterest: (symbol: string) => `Open interest, in ${symbol}`,
    funding: 'Funding rate',
    fundingNote: (settlements: number) =>
      `last ${settlements} settlements, in ‱`,
  },

  chart: {
    /** Series names in a shared tooltip, so both want to be short. */
    volume: 'Vol',
    price: 'Price',
    /**
     * The rest of the tooltip names, for the charts that carry one series
     * each. Shorter than the heading above them — the heading has room to say
     * which unit the series is counted in, and the tooltip puts that on the
     * number instead.
     */
    ratio: 'L/S ratio',
    openInterest: 'Open interest',
    funding: 'Funding',
    kline: 'Kline',
    ratioTrend: 'Long Short Account Ratio',
    openInterestHist: 'Open Interest Hist',
  },

  overview: {
    symbol: 'Symbol',
    period: 'Period',
    add: 'Add chart',
    remove: 'Remove chart',
  },

  binance: {
    sortVolume: 'Volume',
    sortChange: 'Change',
    ratio: 'Long/Short Ratio',
    high24h: '24h High',
    low24h: '24h Low',
    volumeBase: (symbol: string) => `Volume(${symbol})`,
    volumeQuote: 'Volume(USDT)',
  },

  funding: {
    /** Rounded up, so a countdown never reads zero before it has settled. */
    countdownMinutes: (minutes: number) => `${minutes}m`,
    countdownHours: (hours: number, minutes: number) => `${hours}h${minutes}m`,
  },

  signal: {
    /**
     * Magnitude only, for a detail that already carries its own direction.
     * Sigma is the same symbol in both languages.
     */
    sigmas: (sigmas: string) => `${sigmas}σ`,
    /**
     * The sign is the whole point — above means the crowd is longer, or paying
     * more, than it has been, and below means the opposite.
     */
    deviation: (sigmas: string, above: boolean) =>
      `${sigmas}σ ${above ? 'above' : 'below'}`,
    describeDeviation: (sigmas: string, above: boolean) =>
      `${sigmas}σ ${above ? 'above' : 'below'} its recent range`,

    momentum: (move: string) => `5m ${move}`,
    momentumDetail: (move: string, sigmas: string) => `5m ${move} · ${sigmas}`,

    volatility: (range: string) => `range ${range}`,
    volatilityDetail: (range: string, sigmas: string) =>
      `bar range ${range} · ${sigmas}`,

    /**
     * A multiple and a percentile rather than a sigma: a bar range cannot be
     * three sigma quiet, since the mean less three of them is below zero.
     */
    compression: (share: string) => `coiled ${share}×`,
    /** Eight hours, because that is the series the stretch is ranked within. */
    compressionDetail: (share: string, quieterThan: number) =>
      `last 2h ranging ${share}× its usual, quieter than ${quieterThan}% of the last 8h`,

    breakoutHigh: '24h high',
    breakoutHighDetail: 'at its 24h high',
    breakoutLow: '24h low',
    breakoutLowDetail: 'at its 24h low',

    upperWick: 'upper wick',
    upperWickDetail: (share: number) =>
      `rejected from the high, ${share}% wick`,
    lowerWick: 'lower wick',
    lowerWickDetail: (share: number) => `bought off the low, ${share}% wick`,

    strength: (excess: string) => `${excess} vs board`,
    strengthDetail: (excess: string, sigmas: string) =>
      `${excess} against the board · ${sigmas}`,

    volume: (multiple: string) => `${multiple}× volume`,
    volumeDetail: (multiple: string, sigmas: string) =>
      `volume ${multiple}× its usual · ${sigmas}`,

    taker: (share: string, buying: boolean) =>
      `${share} ${buying ? 'buys' : 'sells'}`,
    takerDetail: (share: string, buying: boolean, sigmas: string) =>
      `${share} of takers ${buying ? 'buying' : 'selling'} · ${sigmas}`,

    /**
     * A share of open interest, not a sigma: most windows on most instruments
     * hold no liquidation at all, so there is no history to be unusual against.
     */
    liquidation: (share: string, longs: boolean) =>
      `${share} ${longs ? 'longs' : 'shorts'} liquidated`,
    liquidationDetail: (share: string, longs: boolean) =>
      `${share} of open interest liquidated in 5m, mostly ${longs ? 'longs' : 'shorts'}`,

    openInterest: (change: string) => `OI ${change} 5m`,
    openInterestDetail: (change: string, sigmas: string) =>
      `OI ${change} in 5m · ${sigmas}`,

    ratio: (sigmas: string) => `L/S ${sigmas}`,
    ratioDetail: (deviation: string) => `L/S ${deviation}`,

    /**
     * Which way round the two are standing, not which of them is long: the gap
     * has a level of its own on every contract, and what fires is the gap
     * widening from there.
     */
    divergence: (sigmas: string, eliteLonger: boolean) =>
      `top ${eliteLonger ? 'long' : 'short'} vs crowd ${sigmas}`,
    divergenceDetail: (sigmas: string, eliteLonger: boolean) =>
      `top traders leaning ${eliteLonger ? 'longer' : 'shorter'} against the crowd than usual · ${sigmas}`,

    funding: (sigmas: string) => `funding ${sigmas}`,
    fundingDetail: (deviation: string) => `funding ${deviation}`,

    fundingShift: (moved: string) => `funding ${moved}`,
    fundingShiftDetail: (moved: string) =>
      `funding moved ${moved} since it last settled`,

    basis: (basis: string) => `${basis} vs spot`,
    basisDetail: (basis: string, over: boolean) =>
      `${basis} ${over ? 'over' : 'under'} spot`,

    spread: (spread: string) => `spread ${spread}`,
    /**
     * A multiple rather than a sigma, because a book that quotes one tick for
     * hours has no spread of its own to be a sigma of. The volume surge says it
     * the same way, and the two mean the same thing by it.
     */
    spreadDetail: (spread: string, multiple: string) =>
      `spread ${spread}, ${multiple}× what this book usually quotes`,
  },

  /**
   * What a price move and a session's open interest move say together. Each says
   * what the move is and what it is not, because the pair that shares a price
   * direction is what gets confused.
   */
  flow: {
    'longs-building': 'new longs behind the move up',
    'shorts-covering': 'shorts covering, not new longs',
    'shorts-building': 'new shorts behind the move down',
    'longs-closing': 'longs closing, not new shorts',
  },

  /** The same four quadrants over five minutes, where an exit can be forced. */
  squeeze: {
    'longs-building': 'new longs paying up',
    'short-squeeze': 'shorts squeezed out of the move',
    'shorts-building': 'new shorts pressing it down',
    'long-liquidation': 'longs liquidated into the fall',
  },

  /** The combination in words, for a notification title and the alert list. */
  headline: {
    'price+flow': 'Move with flow behind it',
    'price+positioning': 'Move into a crowded book',
    'flow+positioning': 'Flow against a crowded book',
    'price+flow+positioning': 'Move, flow and positioning at once',
    positioning: 'Positioning stretched on two readings',
    other: 'Several readings out of range',
  },
}

export type Messages = typeof en
