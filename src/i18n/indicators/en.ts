import type { IndicatorsContent } from './types'

export const indicatorsEn: IndicatorsContent = {
  title: 'Technical indicators',
  lede: 'Organised by role, not by name. Each tool gets its principle, formula, usual parameters and how to use it — the diagrams are schematics, not a trade replay.',
  tocLabel: 'Contents',

  stats: [
    { value: '5 roles', label: 'Categories' },
    { value: '10 tools', label: 'Core set' },
    { value: 'Structure first', label: 'Order of use' },
    { value: 'No double-counting', label: 'Combinations' },
  ],

  principle:
    'Indicators are different projections of the same price series. Stacking two of a kind (RSI + Stochastic) is close to counting the same evidence twice. A combination that works is trend/structure + momentum + volatility or volume, each answering a different question. Indicators confirm direction; they do not predict it.',

  fields: {
    principle: 'Principle',
    formula: 'Formula',
    params: 'Usual parameters',
    usage: 'How to use it',
    pitfalls: 'Common traps',
  },

  overview: {
    id: 'overview',
    label: 'Map',
    title: 'Pick by role, then argue about parameters',
    intro:
      'This table is the map for the page. Open a category for the tools themselves; inside a role, keep one primary tool so they do not vote twice.',
    headers: ['Role', 'What it answers', 'Usual tools', 'How not to use it'],
    rows: [
      [
        'Trend & location',
        'Bias long or short? Where is price vs its mean?',
        'MA / EMA, MACD, ADX',
        'Do not treat a MA cross as the only entry',
      ],
      [
        'Momentum',
        'Is the move still fuelled? Overheated or diverging?',
        'RSI, Stochastic',
        'Do not fade every overbought reading mid-trend',
      ],
      [
        'Volatility & channels',
        'Compressing or expanding? How wide a stop?',
        'Bollinger, ATR',
        'Do not chase a break once the bands are already wide',
      ],
      [
        'Volume',
        'Is anyone behind it? Is the break solid?',
        'Volume / OBV, VWAP',
        'Do not treat a quiet breakout as confirmation',
      ],
      [
        'Structural helpers',
        'Where do retracements and extensions land?',
        'Fibonacci',
        'Fibonacci alone is not a system',
      ],
    ],
  },

  categories: [
    {
      id: 'trend',
      label: 'Trend',
      title: 'Trend and location',
      intro:
        'First answer whether the bias is long or short. Averages locate price, MACD checks momentum alignment, ADX says how strong a trend is and never which way.',
      indicators: [
        {
          id: 'ma',
          name: 'Moving averages (MA / EMA)',
          tag: 'Trend · location',
          principle:
            'Compress a window of closes into a smooth line so you can read trend direction and where price sits relative to its mean. SMA weights evenly; EMA weights the recent side more, so it reacts faster and is noisier.',
          formula: [
            'SMA(n) = (P₁ + P₂ + … + Pₙ) / n',
            'EMAₜ = α · Pₜ + (1 − α) · EMAₜ₋₁, where α = 2 / (n + 1)',
          ],
          params:
            'Short work often uses 9/20, swings 50, longer context 200. Crypto books are liquid, so many traders lean on EMA20/50 where equity desks used daily index habits.',
          usage: [
            'Price above a rising average leans long; below a falling one leans short.',
            'A bullish stack (short above long) supports trend entries; tangled averages read as a range — fewer breakout trades.',
            'A pullback that holds the average is a common with-trend entry; wait for a decisive close through it before calling structure broken.',
            'Golden/death crosses can filter; they are a poor sole reason to click — laggy, and full of false signals in a chop.',
          ],
          pitfalls: [
            'In a range the averages cross back and forth and will stop you out both ways.',
            'Shorter lookbacks are snappier and easier to fake with a wick.',
          ],
          diagram: 'ma',
        },
        {
          id: 'macd',
          name: 'MACD',
          tag: 'Trend · momentum',
          principle:
            'The gap between two EMAs measures momentum; a signal line smooths that gap. The histogram is DIF minus DEA — the acceleration of that momentum.',
          formula: [
            'DIF = EMA(fast) − EMA(slow)',
            'DEA = EMA(signal) of DIF',
            'Histogram = DIF − DEA',
          ],
          params:
            'Classic settings are 12 / 26 / 9. Shorter sets are more sensitive — better for short work, noisier too.',
          usage: [
            'DIF and DEA above zero with a turning-up histogram lean bullish; the mirror below zero leans bearish.',
            'Price makes a new high while DIF or the histogram does not — bearish divergence; treat it as a warning that needs structure, not an automatic flip.',
            'Pair it with averages or structure: structure sets direction, MACD checks whether there is still fuel.',
          ],
          pitfalls: [
            'In a strong trend the histogram breathes in and out — do not call every shrink a reversal.',
            'Oscillating around the zero line in a range is mostly noise.',
          ],
          diagram: 'macd',
        },
        {
          id: 'adx',
          name: 'ADX (+DI / −DI)',
          tag: 'Trend strength',
          principle:
            'ADX measures how strong a trend is, not which way it points. Direction comes from comparing +DI and −DI: +DI leading leans long, −DI leading leans short.',
          formula: [
            'Compute directional movement +DM / −DM and true range TR',
            '+DI = 100 · EMA(+DM) / EMA(TR); −DI likewise',
            'DX = 100 · |+DI − −DI| / (+DI + −DI)',
            'ADX = EMA(DX)',
          ],
          params:
            'Period 14 is the usual default. Rules of thumb: ADX under 20 ≈ no clear trend, over 25 ≈ a trend is on, over 40 often already hot.',
          usage: [
            'Watch whether ADX is rising: rising means the trend is strengthening (good for trend tactics); flattening or falling means it is fading.',
            '+DI crossing above −DI while ADX rises is one reading of a bullish trend start; the reverse for bears.',
            'Use it as a filter: when ADX is low, take fewer breakouts and lean on range tactics.',
          ],
          pitfalls: [
            'A rising ADX only says “more trend” — both rallies and selloffs push it up.',
            'ADX lags; turns often arrive after part of the move is already done.',
          ],
          diagram: 'adx',
        },
      ],
    },

    {
      id: 'momentum',
      label: 'Momentum',
      title: 'Momentum oscillators',
      intro:
        'Answers whether there is still fuel and whether the move is stretched. Overbought can persist in a trend; divergence and turns out of extremes are usually more useful than the level alone.',
      indicators: [
        {
          id: 'rsi',
          name: 'RSI (Relative Strength Index)',
          tag: 'Momentum',
          principle:
            'Compares average gains to average losses over a window and maps that into 0–100. High readings mean recent upside dominated (possibly hot); low readings mean downside dominated (possibly washed out).',
          formula: [
            'RS = AvgGain(n) / AvgLoss(n)',
            'RSI = 100 − 100 / (1 + RS)',
          ],
          params:
            'Wilder’s classic n = 14; short work often uses 7 or 9. Overbought/oversold levels are commonly 70/30; strong trends may need 80/20.',
          usage: [
            'Read the 50 line: holding above leans bullish, below leans bearish.',
            'Price high, RSI not — bearish divergence; price low, RSI higher — bullish divergence. Divergence warns; it does not auto-reverse.',
            'In a trend, a pullback toward 40–50 that turns up is often more useful than waiting for a print under 30.',
            'A turn leaving the extreme zone is a better trigger than merely touching it.',
          ],
          pitfalls: [
            'In a strong trend RSI can stay overbought for a long time — shorting that will get run over.',
            'It is the same family as Stochastic; stacking both double-counts.',
          ],
          diagram: 'rsi',
        },
        {
          id: 'stochastic',
          name: 'Stochastic (KD)',
          tag: 'Momentum',
          principle:
            'Measures where the close sits inside the recent high–low range. %K is the raw reading, %D its smooth. It hugs the price range more tightly than RSI and is more sensitive to short turns.',
          formula: [
            '%K = 100 · (Close − LowestLow(n)) / (HighestHigh(n) − LowestLow(n))',
            '%D = SMA(m) of %K',
          ],
          params:
            'Common sets are (14, 3, 3) or (9, 3, 3). Overbought/oversold is often 80/20.',
          usage: [
            'A %K/%D golden cross in oversold can flag a bounce to watch; a death cross in overbought a pullback — best when it lands on structure.',
            'Pick RSI or Stochastic; if you keep both, only one gets a vote.',
            'Divergence reads like RSI, but false signals are usually more frequent, so filter harder with structure.',
          ],
          pitfalls: [
            'Works better in ranges; in trends it keeps handing you fade signals.',
            'Shorter settings twitch harder — a wick can slam %K to an extreme.',
          ],
          diagram: 'stochastic',
        },
      ],
    },

    {
      id: 'volatility',
      label: 'Volatility',
      title: 'Volatility and channels',
      intro:
        'Answers whether volatility is compressing or expanding, and how wide a stop should be. Bandwidth and ATR are rulers for risk — not oracles for direction.',
      indicators: [
        {
          id: 'bollinger',
          name: 'Bollinger Bands',
          tag: 'Volatility · channel',
          principle:
            'A moving average as the middle band, with outer bands at a multiple of standard deviation. Width is volatility; where price sits relative to the bands is stretch versus mean-reversion pressure.',
          formula: [
            'Middle = SMA(n)',
            'Upper = Middle + k · σ(n)',
            'Lower = Middle − k · σ(n)',
            'Bandwidth = (Upper − Lower) / Middle',
          ],
          params:
            'Classic n = 20, k = 2. Crypto short books sometimes use 20/2.5 or 10/1.5.',
          usage: [
            'A volume break after a squeeze often starts a trend leg; require a close that holds outside the band.',
            'Walking the upper band is a strong-trend tell — do not rush to top-tick it; the lower band mirrors that.',
            'The middle band is a common pullback reference; chasing a pierce once bandwidth is already huge is a poor trade.',
            'Compare with ATR/Keltner: Bollinger is statistical width, ATR is true range.',
          ],
          pitfalls: [
            '“Touch the band, reverse” is an expensive habit in a trend.',
            'False breaks after a squeeze are common — need volume or structure.',
          ],
          diagram: 'bollinger',
        },
        {
          id: 'atr',
          name: 'ATR (Average True Range)',
          tag: 'Volatility · risk',
          principle:
            'Measures how far a bar typically travels, including gaps in true range. It almost never gives direction, and it is the usual ruler for stop distance and position size.',
          formula: [
            'TR = max(High − Low, |High − PrevClose|, |Low − PrevClose|)',
            'ATR(n) = Wilder-smoothed mean of TR',
          ],
          params:
            '14 is common. Stops often sit at 1.5×–3× ATR; size as risk amount ÷ the price distance that multiple implies.',
          usage: [
            'Low volatility: stops can tighten a little, but not so tight that noise takes you out.',
            'Volatility spikes: cut size or pause new risk — do not keep pushing stops further away.',
            'An ATR channel (mid ± ATR multiple) is a simple trailing framework.',
            'Compare against its own history; the same number means nothing across symbols.',
          ],
          pitfalls: [
            'A rising ATR is not bullish or bearish — only louder.',
            'Fixed-point stops that ignore ATR quietly change your risk when the regime changes.',
          ],
          diagram: 'atr',
        },
      ],
    },

    {
      id: 'volume',
      label: 'Volume',
      title: 'Volume',
      intro:
        'Answers whether anyone is behind the move. Price is the outcome; volume is participation. A quiet breakout is suspect until proven otherwise.',
      indicators: [
        {
          id: 'volume',
          name: 'Volume and OBV',
          tag: 'Volume',
          principle:
            'Volume is how active the period was. OBV (On-Balance Volume) adds volume on up closes and subtracts it on down closes into a running “participation” line, so you can see whether price is backed by flow.',
          formula: [
            'Volume = traded volume in the period (contracts or notional — check the venue)',
            'OBVₜ = OBVₜ₋₁ + Volumeₜ  on an up close',
            'OBVₜ = OBVₜ₋₁ − Volumeₜ  on a down close',
            'Unchanged on a flat close',
          ],
          params:
            'Read volume relative to its own average (e.g. a 20-bar mean), not as an absolute number.',
          usage: [
            'Breaks of key levels want expanding volume; a quiet break raises the odds of a fake.',
            'In an uptrend, a quiet pullback then a loud turn higher is often healthy.',
            'Price high, volume/OBV lagging — divergence; raise the priority of cutting or standing aside.',
            'On perps, layer open interest: price up, volume up, OI up looks more like fresh money.',
          ],
          pitfalls: [
            'Volume is not comparable across venues or contract specs.',
            'A liquidation cascade prints huge volume without confirming a clean trend.',
          ],
          diagram: 'volume',
        },
        {
          id: 'vwap',
          name: 'VWAP',
          tag: 'Volume · location',
          principle:
            'The volume-weighted average price answers where the session’s average fill sits so far. Above VWAP, short-term longs hold the cost edge; below, shorts do.',
          formula: [
            'Typical = (High + Low + Close) / 3',
            'VWAP = Σ(Typical · Volume) / Σ(Volume) (session cumulative)',
          ],
          params:
            'Equities reset on the cash session; 24h crypto often resets on UTC day or the venue’s session — confirm the platform’s definition before trusting it.',
          usage: [
            'Intraday: a hold of VWAP as support/resistance then a leave is a common execution reference.',
            'Split duties with MAs: averages for multi-timeframe trend, VWAP for the day’s cost anchor.',
            'Large extensions away from VWAP mean-revert more on quiet days; trend days can live on one side.',
            'Desks use it to score execution quality — for discretionary work it is a fair-value reference, not a full system.',
          ],
          pitfalls: [
            'A wrong session boundary makes VWAP jump and the read lie.',
            'Do not replace a multi-timeframe trend stack with VWAP alone.',
          ],
          diagram: 'vwap',
        },
      ],
    },

    {
      id: 'structure',
      label: 'Structure',
      title: 'Structural helpers',
      intro:
        'Fibonacci is a ruler, not a crystal ball: it marks common retracement and extension ratios. Weight rises where those ratios land on prior highs/lows, gaps or round numbers.',
      indicators: [
        {
          id: 'fibonacci',
          name: 'Fibonacci retracement / extension',
          tag: 'Structural helper',
          principle:
            'Between a clear swing high and low, fixed ratios mark pullback and extension targets. Participants watch them, so they often coincide with liquidity — a self-fulfilling map, not mysticism.',
          formula: [
            'Retracement = High − (High − Low) · r',
            'Extension = High + (High − Low) · r   (up-swing; mirror for down)',
            'Common r: 0.236 · 0.382 · 0.5 · 0.618 · 0.786; extensions 1.0 · 1.272 · 1.618',
          ],
          params:
            'Anchor on an obvious swing, not a noisy wiggle. Overlaps across timeframes carry more weight.',
          usage: [
            'In an uptrend, watch 0.382–0.618 for a hold, then wait for momentum to agree.',
            'After a break, a hold of 0.5/0.618 can be continuation; a clean break often means that swing definition failed.',
            'Targets can be the prior high or 1.272/1.618 — but only if the R multiple clears your bar.',
            'Raise priority where Fib meets horizontal supply/demand, round numbers or session highs/lows.',
          ],
          pitfalls: [
            'Wrong swing endpoints make the whole grid wrong — structure first.',
            'Fibonacci alone has no edge; it is a location tool, not a signal system.',
          ],
          diagram: 'fibonacci',
        },
      ],
    },
  ],

  combine: {
    id: 'combine',
    label: 'Combine',
    title: 'Combine without double-counting',
    intro:
      'One recipe keeps one trend tool, one momentum tool, and one volatility or volume tool. The table is a division of labour — not a reason to add more lines.',
    headers: ['Stack', 'Who does what', 'Typical use'],
    rows: [
      [
        'EMA + RSI + volume',
        'Trend location / momentum turn / participation',
        'Pullback to EMA, RSI turning up near mid-range, volume expanding on the turn',
      ],
      [
        'MA + MACD + ATR',
        'Direction / momentum alignment / stop width',
        'Hold with the trend; trail by ATR multiple; do not flee while the histogram agrees',
      ],
      [
        'Bollinger squeeze + volume + level',
        'Compression / participation / valid break',
        'Close holds beyond a key level after a squeeze; continue on a hold of the retest',
      ],
      [
        'ADX + RSI',
        'Is there a trend / is it stretched',
        'Low ADX → fewer breakouts; high ADX → allow RSI to stay hot',
      ],
    ],
    noteTitle: 'Three hard rules',
    noteItems: [
      'An invalidation level always outranks any indicator lighting up.',
      'One primary tool per family; a second is at most a veto, never an extra vote.',
      'Name the regime (trend / range / extreme vol) before deciding whether this stack is even on.',
    ],
  },

  closing: {
    label: 'In one line',
    oneLiner:
      'No duplicate roles; structure sets direction; indicators only confirm and measure.',
    chips: [
      'Role before name',
      'Formula for understanding',
      'Calibrate per symbol',
      'Divergence warns',
      'Volatility sizes risk',
      'No volume, no chase',
    ],
    disclaimer:
      'Educational material, not investment advice. Parameters and timeframes need calibrating to what you trade; diagrams are schematics, not live replays.',
  },
}
