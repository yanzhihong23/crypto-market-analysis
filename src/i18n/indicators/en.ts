import type { IndicatorsContent } from './types'

export const indicatorsEn: IndicatorsContent = {
  title: 'Technical indicators',
  lede: 'Organised by role, not by name. Each tool gets its principle, formula, usual parameters, chart readings and the regimes where it earns its keep — the diagrams are schematics, not a trade replay.',
  tocLabel: 'Contents',
  labelJoin: ': ',

  stats: [
    { value: '5 roles', label: 'Categories' },
    { value: '10 tools', label: 'Core set' },
    { value: 'Structure first', label: 'Order of use' },
    { value: 'No double-counting', label: 'Combinations' },
  ],

  principle:
    'Indicators are different projections of the same price series. Stacking two of a kind (RSI + Stochastic) is close to counting the same evidence twice. A combination that works is trend/structure + momentum + volatility or volume, each answering a different question. Indicators confirm direction; they do not predict it. In the wrong regime, even a correct reading is noise.',

  fields: {
    principle: 'Principle',
    formula: 'Formula',
    params: 'Usual parameters',
    signals: 'Chart readings',
    regime: 'When it applies',
    usage: 'How to use it',
    pitfalls: 'Common traps',
  },

  overview: {
    id: 'overview',
    label: 'Map',
    title: 'Pick by role, then argue about parameters',
    intro:
      'This table is the map for the page. Open a category for the tools themselves; inside a role, keep one primary tool so they do not vote twice. The same tool reads differently in a trend and in a range — that is what each card’s “When it applies” section is for.',
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
        'First answer whether the bias is long or short. Averages give location and slope, MACD checks whether momentum agrees, ADX says how strong a trend is and never which way. Split the jobs — do not ask all three to find the entry.',
      indicators: [
        {
          id: 'ma',
          name: 'Moving averages (MA / EMA)',
          tag: 'Trend · location',
          principle:
            'Compress a window of closes into a smooth line so you can read trend direction and where price sits relative to its mean. SMA weights every bar evenly — slower turns, fewer fakes. EMA weights the recent side more (α = 2/(n+1)) — earlier turns, easier to yank with a wick. An SMA(20) is not an EMA(20); swapping the type is changing the parameter. Do not mix them in a backtest and pretend they are the same rule.',
          formula: [
            'SMA(n) = (P₁ + P₂ + … + Pₙ) / n',
            'EMAₜ = α · Pₜ + (1 − α) · EMAₜ₋₁, α = 2 / (n + 1)',
            'Slope: EMAₜ − EMAₜ₋ₖ > 0 → recent climb (k often 1–3)',
          ],
          params:
            'Short work often uses EMA9/20, swings EMA50, longer context SMA/EMA200. Crypto perps are liquid and noisy, so many books use EMA20 as short cost and EMA50 as the swing anchor, rather than equity-desk daily 50/200 crossover lore. Match the period to the chart you are on: EMA200 on 15m is roughly two days of average price, not “the long term”.',
          signals: [
            {
              label: 'Bullish regime',
              text: 'Price above a rising average; short average above long (bullish stack).',
            },
            {
              label: 'Bearish regime',
              text: 'Price below a falling average; short below long.',
            },
            {
              label: 'Pullback hold',
              text: 'With-trend dip tags the average and the close holds — wicks through are fine; read the close, not the print.',
            },
            {
              label: 'Stack breaks',
              text: 'A decisive close through the average, or short and long tangled flat → downgrade the trend story and the size with it.',
            },
            {
              label: 'Golden / death cross',
              text: 'Filter or bonus only, never the sole trigger; in a range crosses fake repeatedly.',
            },
          ],
          regime:
            'Trend: primary tool — location and pullbacks. Range: when averages tangle, de-weight crosses and trade the boundaries instead. Extreme vol: ATR and structure first; averages will be pierced by long wicks over and over.',
          usage: [
            'Fix the higher-timeframe average’s direction, then hunt same-way pullbacks on the lower one; if the higher TF is flat, lower-TF crosses are mostly noise.',
            'Pre-write invalidation for a pullback entry: close through the average or through the prior swing — not “a little more room”.',
            'Keep two or three averages: one for execution (e.g. 20), one for swing (e.g. 50), optionally one for context (e.g. 200). More than that double-counts.',
            'When price is stretched far from the average (measure in ATR), chasing is worse than waiting for mean reversion or a new shelf; the average will catch up, but you have already paid the risk.',
          ],
          pitfalls: [
            'Treating every cross in a range as a regime change.',
            'Shorter lookbacks twitch harder and fake with wicks; lengthening after getting faked then misses real pullbacks.',
            'Treating the average as a magnet price “must” return to — strong trends can walk it for a long time.',
            'Mixing SMA and EMA, or periods, while keeping the same verbal rules.',
          ],
          diagram: 'ma',
        },
        {
          id: 'macd',
          name: 'MACD',
          tag: 'Trend · momentum',
          principle:
            'The gap between a fast and a slow EMA (DIF) measures momentum; the signal line (DEA) smooths DIF; the histogram is DIF − DEA — the acceleration of that momentum. Expanding bars mean fuel is adding; shrinking bars mean it is fading. Above zero leans bullish momentum, below leans bearish. It adds a “force” layer that a raw average cross lacks, and it is still a lagging transform of price — not a prophecy on its own.',
          formula: [
            'DIF = EMA(fast) − EMA(slow)',
            'DEA = EMA(signal) of DIF',
            'Histogram = DIF − DEA',
            'Zero line: DIF > 0 bullish-momentum zone; DIF < 0 bearish',
          ],
          params:
            'Classic 12 / 26 / 9 (born on daily charts). On 5m–15m you can shorten (e.g. 8/17/9) for snappiness; false signals rise with it. Fix the execution timeframe before retuning, so one symbol does not carry three live parameter sets.',
          signals: [
            {
              label: 'Momentum agrees',
              text: 'DIF and DEA on the same side of zero, histogram flipping with the structure’s direction.',
            },
            {
              label: 'Expanding hist',
              text: 'Friendly for holding with the trend — fuel is still adding; no need to flat on every shallow dip.',
            },
            {
              label: 'Shrinking streak',
              text: 'Fuel-fade warning; trim or tighten the trail, wait for structure before calling a flip.',
            },
            {
              label: 'Divergence',
              text: 'Price high/low not matched by DIF or the histogram → exhaustion warning; needs a level or a break.',
            },
            {
              label: 'Zero chop',
              text: 'DIF whipping across zero → range behaviour; cut MACD’s entry weight.',
            },
          ],
          regime:
            'Trend: hold on one side of zero and watch whether the histogram agrees. Range: crosses and zero flips spam — veto only, or switch it off. Turns: divergence matters, but price structure still has to take over.',
          usage: [
            'Split jobs: structure/averages set direction; MACD answers whether there is still fuel. When they disagree, trust structure.',
            'Divergence needs at least two clear swings; a single “almost higher high” does not count — better if it lands on resistance/support.',
            'Histogram colour flips can size you in or out, but in strong trends the hist breathes — require a short streak or price behaviour with it.',
            'Pick MACD or RSI as the momentum primary; MACD leans trend-momentum, RSI leans range location.',
          ],
          pitfalls: [
            'Entering on a DIF/DEA cross while ignoring zero and structure.',
            'Calling every shrink a reversal mid-trend.',
            'Waiting for MACD to align on every timeframe — filters the trade to death, often after the move has run.',
            'Expecting “independent confirmation” from MACD built on the same fast/slow lengths as your averages.',
          ],
          diagram: 'macd',
        },
        {
          id: 'adx',
          name: 'ADX (+DI / −DI)',
          tag: 'Trend strength',
          principle:
            'ADX answers how trendy the market is, not which way. +DI / −DI come from directional movement: upside dominance lifts +DI, downside lifts −DI; ADX is the smoothed gap between them. So ADX rising from 15 to 35 can be a melt-up or a washout — always read it with +DI/−DI or with structure.',
          formula: [
            '+DM = max(Highₜ − Highₜ₋₁, 0) (only if it beats the down move)',
            '−DM = max(Lowₜ₋₁ − Lowₜ, 0) (symmetric rule)',
            'TR = max(High−Low, |High−PrevClose|, |Low−PrevClose|)',
            '+DI = 100 · Smooth(+DM) / Smooth(TR); −DI likewise',
            'DX = 100 · |+DI − −DI| / (+DI + −DI); ADX = Smooth(DX)',
          ],
          params:
            'Period 14 is the usual default. Thresholds need per-symbol calibration: ADX under 20 often ≈ no trend, over 25 ≈ a trend is on, over 40 often already hot — continuation and reversal both get violent. Thresholds are not physical constants; read the symbol’s own ADX distribution.',
          signals: [
            {
              label: 'Trend on',
              text: 'ADX turning up from a low base while +DI crosses above −DI (or the reverse) → turn trend tactics on.',
            },
            {
              label: 'Trend accelerating',
              text: 'ADX still rising with structure → hold with it; fewer fade attempts.',
            },
            {
              label: 'Trend fading',
              text: 'ADX flattening or rolling over → trend premium drops; tighten targets or switch to range.',
            },
            {
              label: 'No trend',
              text: 'ADX stuck below threshold with +DI/−DI tangled → de-weight breakouts; raise boundary fades.',
            },
          ],
          regime:
            'Built to switch tactics: high ADX → trend/pullback; low ADX → mean reversion or flat. Do not use ADX itself to pick entries.',
          usage: [
            'Ask ADX “is there a trend?”, then +DI/−DI “which side?”, then let averages/structure execute.',
            'ADX rising while price chops often means energy is building — respect fake breaks; wait for a close outside the range.',
            'Cross-check with Bollinger width: both speak to regime, so treat them as related, not two independent votes.',
            'On perps in extremes ADX can spike fast; the spike is not a reason to add — it is a reason to resize stops to the new volatility.',
          ],
          pitfalls: [
            'Going long because ADX is rising — the most common misread of direction.',
            'Hard-coding absolute thresholds across every symbol and timeframe.',
            'ADX lags: by the time it confirms, part of the move is often done — filter, do not use it to grab the first bar.',
            'Reading ADX like an oscillator with overbought/oversold meaning — it has none.',
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
        'Answers whether there is still fuel and whether the move is stretched. Overbought/oversold can persist for a long time in a trend; what usually pays is divergence, turns leaving the extreme zone, and the mid-line bias (RSI 50). Pick RSI or Stochastic — not both as votes.',
      indicators: [
        {
          id: 'rsi',
          name: 'RSI (Relative Strength Index)',
          tag: 'Momentum',
          principle:
            'Compares average gains to average losses over a window and maps that into 0–100. It measures which side dominated recently — not “overbought must fall”. Wilder’s original smooth for AvgGain/AvgLoss differs slightly from a plain SMA, so RSI(14) can disagree by a point or two across platforms — trust the pane you trade from when thresholds matter.',
          formula: [
            'Change = Closeₜ − Closeₜ₋₁',
            'Gain = max(Change, 0); Loss = max(−Change, 0)',
            'AvgGain / AvgLoss: Wilder smooth (seed with SMA, then recurse)',
            'RS = AvgGain / AvgLoss; RSI = 100 − 100 / (1 + RS)',
          ],
          params:
            'Classic n = 14; short work 7/9 is snappier. Default 70/30; strong trends may need 80/20, or drop absolutes and watch exits from the recent 20-bar extreme. Shortening the period amplifies noise — change how you read it before you change n.',
          signals: [
            {
              label: 'Mid-line bias',
              text: 'RSI holding above 50 → bullish environment; below → bearish. A second regime filter beside averages.',
            },
            {
              label: 'Trend pullback',
              text: 'In an uptrend, RSI dipping to 40–50 then turning up often tracks real pullbacks better than waiting under 30.',
            },
            {
              label: 'Leave the extreme',
              text: 'Crossing back up from oversold (or down from overbought) is a better trigger than merely tagging 30/70.',
            },
            {
              label: 'Divergence',
              text: 'Price high without RSI / price low with higher RSI → exhaustion warning; wait for structure or a rejecting bar.',
            },
            {
              label: 'Persistence',
              text: 'RSI stuck in overbought/oversold in a strong trend is strength, not a reason to fade.',
            },
          ],
          regime:
            'Trend: use the mid-line and pullback zones; allow persistence; fewer fades. Range: extremes and divergence work better. News/liquidation wicks: RSI spikes — wait for the close.',
          usage: [
            'Name the regime before applying RSI rules: the same “short 70” is a trap in a trend and a strategy in a range.',
            'Define swings for divergence: two clear price pivots and two RSI pivots; skip fuzzy ones.',
            'Pair with volume: divergence plus a quiet new high is a louder warning than divergence alone.',
            'Hidden divergence (e.g. higher price lows with lower RSI lows) is mostly a with-trend continuation read — master regular divergence first.',
          ],
          pitfalls: [
            'Fading every overbought print in a trend.',
            'Running RSI + Stochastic + CCI as triple confirmation — momentum counted thrice.',
            'Automating absolute thresholds across platforms with slightly different RSI maths.',
            'Treating divergence as a guaranteed reversal — it can print several times while price keeps going.',
          ],
          diagram: 'rsi',
        },
        {
          id: 'stochastic',
          name: 'Stochastic (KD)',
          tag: 'Momentum',
          principle:
            'Measures where the close sits inside the last n bars’ high–low range: near the high → %K high, near the low → %K low. %D smooths %K for crosses and noise control. It hugs the price channel more tightly than RSI, so short turns show up earlier — and so do fakes. Slow Stochastic smooths %K once more: steadier, laggier.',
          formula: [
            '%K = 100 · (Close − LowestLow(n)) / (HighestHigh(n) − LowestLow(n))',
            '%D = SMA(m) of %K',
            'Slow: SMA raw %K once, then %D (often 3,3)',
            'If the window has no range, the reading is undefined; software usually carries the prior value',
          ],
          params:
            'Common (14, 3, 3) or snappier (9, 3, 3). Overbought/oversold often 80/20 (more extreme than RSI’s 70/30 because Stochastic pins the rails more easily). Keep 80/20 for range tactics; if you insist on using it in a trend, treat crosses as “pullback starting”, not “regime flip”.',
          signals: [
            {
              label: 'Oversold cross',
              text: '%K through %D up inside oversold → bounce to watch; best on support/an average.',
            },
            {
              label: 'Overbought cross',
              text: '%K through %D down inside overbought → pullback to watch; in a trend, trim only.',
            },
            {
              label: 'Mid-line cross',
              text: 'Through 50 can flip a short bias; thin value on its own.',
            },
            {
              label: 'Divergence',
              text: 'Same idea as RSI, noisier — demand structure or ignore it.',
            },
          ],
          regime:
            'Range: home field — edges plus extreme crosses. Trend: de-weight; at most a helper that a pullback is done, never the main fade. Spike regimes: %K will pin 0/100 repeatedly — pause cross strategies.',
          usage: [
            'Pick against RSI: smoother regime bias → RSI; snappier short turns → Stochastic.',
            'Only arm crosses near pre-marked prices (range edge, Fib confluence, session high/low).',
            'Do not run Fast and Slow together; choose one and write it into the plan.',
            'On perps, the cross can be the execution trigger while higher-TF structure still owns direction.',
          ],
          pitfalls: [
            'Fading every overbought death cross in a trend.',
            'Tiny lookbacks that pin on a wick and reverse — fees and slippage eat the edge.',
            'Adding size because RSI and Stochastic both lit — still one family of evidence.',
            'Trading extremes while the window is flat and the denominator is near zero.',
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
        'Answers whether volatility is compressing or expanding, and how wide a stop should be. Bollinger draws volatility as a channel; ATR collapses it into a ruler. Neither is hired to call direction; both are better at sizing and filtering timing than at “predicting” the break.',
      indicators: [
        {
          id: 'bollinger',
          name: 'Bollinger Bands',
          tag: 'Volatility · channel',
          principle:
            'The middle band is an average (usually SMA); the outer bands sit at ± k standard deviations. Bandwidth is the volatility regime: narrow = squeeze, wide = expansion. Where price sits relative to the bands is stretch versus recent volatility — mean-reversion pressure only inside a mean-reversion frame. In a trend frame, walking the upper band is normal strength.',
          formula: [
            'Mid = SMA(n)',
            'σ(n) = stdev of closes over n',
            'Upper = Mid + k · σ; Lower = Mid − k · σ',
            'Bandwidth = (Upper − Lower) / Mid',
            '%B = (Close − Lower) / (Upper − Lower)  (0 at lower, 1 at upper)',
          ],
          params:
            'Classic n = 20, k = 2 (≈95% coverage under a normal assumption the market does not obey — do not mythologise the number). Crypto short books sometimes use k = 2.5 to cut meaningless pierces. Too-short n makes bandwidth twitch; too-long n starves squeeze signals — fix n, then tune k.',
          signals: [
            {
              label: 'Squeeze',
              text: 'Bandwidth at a recent low → compression; raise breakout priority; direction still from structure and volume.',
            },
            {
              label: 'Close outside',
              text: 'Close holds beyond the upper (or lower) band with volume → candidate trend leg; retest of mid/band that holds can continue.',
            },
            {
              label: 'Walking the band',
              text: 'Repeated tags of the upper band in an advance = strength; do not rush to top-tick; mirror on the lower band.',
            },
            {
              label: 'Chase when wide',
              text: 'Bandwidth already high and still chasing the pierce → payoff usually worse; prefer a return toward mid.',
            },
            {
              label: '%B back inside',
              text: 'A pierce that closes back inside quickly → fake-break weight rises.',
            },
          ],
          regime:
            'Post-squeeze trend starts: Bollinger earns its keep. One-way trends: walk the band and pull mid — not fade touches. Wide ranges: bands as soft edges, still respect false pierces.',
          usage: [
            'After a squeeze, mark structure first and act on a close beyond it; “bandwidth low” has no direction.',
            'Mid often overlaps EMA20’s job — pick one pullback line.',
            'Cross-check ATR: Bollinger is statistical width, ATR is true range; both extreme means the vol regime changed and size must be recomputed.',
            'Use %B as a location meter: bullish trends prefer pullbacks that hold %B above 0.5 rather than waiting for 0.',
          ],
          pitfalls: [
            '“Touch the band, reverse” — one of the expensive habits in a trend.',
            'Full size on the first pierce after a squeeze without close or volume.',
            'Treating k = 2 as mathematical truth despite fat tails.',
            'Counting bandwidth, ATR and ADX as three independent vol votes.',
          ],
          diagram: 'bollinger',
        },
        {
          id: 'atr',
          name: 'ATR (Average True Range)',
          tag: 'Volatility · risk',
          principle:
            'True range TR takes the largest of the bar’s high–low, the gap from the prior close to the high, and the gap to the low — so gaps count. ATR smooths TR. It almost never gives direction and directly answers risk: stops must clear noise, and size must scale with volatility. Under a fixed account risk %, if ATR doubles, size should roughly halve.',
          formula: [
            'TR = max(High − Low, |High − PrevClose|, |Low − PrevClose|)',
            'ATR(n) = Wilder-smoothed TR (same smooth family as RSI)',
            'Stop distance ≈ k · ATR; size = risk amount / stop distance',
            'ATR% = ATR / Close, for cross-price comparison',
          ],
          params:
            '14 is common and should match the execution timeframe (trade 15m → use 15m ATR, not daily ATR for a 15m stop). k often 1.5–3: too tight gets noise-stopped; too wide forces size so small the trade is pointless. Prefer ATR% or its own percentile over raw price points for thresholds.',
          signals: [
            {
              label: 'Vol rising',
              text: 'ATR or ATR% into a high percentile of itself → cut size, widen stops, or pause new risk.',
            },
            {
              label: 'Vol falling',
              text: 'ATR rolling over → normal size can return; do not instantly reuse the old tight stop on new structure.',
            },
            {
              label: 'Stop ruler',
              text: 'Beyond structural invalidation, add a k·ATR buffer so stops are not glued to obvious round numbers.',
            },
            {
              label: 'Trail frame',
              text: 'After entry, trail off close ± k·ATR or an ATR channel — rules written before the trade.',
            },
          ],
          regime:
            'Every regime needs it as a risk ruler. Trend: trailing stops. Range: keep stops from living on the far side of the box. Extremes: when ATR spikes, cut leverage and notional — do not “conviction add”.',
          usage: [
            'Order checklist: mark invalidation → take the larger of that distance and k·ATR → size from risk amount.',
            'When switching symbols, read ATR% before asking “can I trade this”: too quiet and the same risk % forces an awkward notional; too loud and the reverse.',
            'ATR jumps around news — recompute assumptions after the event.',
            'Same logic as the discipline page’s sizer: risk is a % of equity, not margin used.',
          ],
          pitfalls: [
            'Reading a rising ATR as bullish or bearish.',
            'Fixed-point stops while vol changes — silently changing risk.',
            'Using a higher-TF ATR to pad lower-TF noise, or the reverse.',
            'ATR-only stops that ignore structure — parked where nothing is invalid yet, or beyond where it already is.',
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
        'Answers whether anyone is behind the move. Price is the outcome; volume is participation. A quiet breakout is suspect. On perps, layer open interest: price and volume up with OI up looks like fresh money; price up with OI down looks more like short covering.',
      indicators: [
        {
          id: 'volume',
          name: 'Volume and OBV',
          tag: 'Volume',
          principle:
            'Volume is how active the period was (contracts or notional — check the venue). OBV adds volume on up closes and subtracts it on down closes into a running participation integral, so you can see whether price is backed by flow. OBV is hypersensitive to close direction: one false green close books the whole bar’s volume as positive — read it with structure, do not worship the line.',
          formula: [
            'Volume = period volume (perps: contracts or USDT notional; do not cross-venue compare)',
            'OBVₜ = OBVₜ₋₁ + Volumeₜ  when Close > Closeₜ₋₁',
            'OBVₜ = OBVₜ₋₁ − Volumeₜ  when Close < Closeₜ₋₁',
            'Flat close: OBV unchanged',
            'Relative volume = Volume / SMA(Volume, n), n often 20',
          ],
          params:
            'Read multiples of its own average, not absolute prints. A rough breakout watch is ≥ 1.5×–2× average volume, calibrated to the symbol’s own distribution. OBV has no period; you can smooth it, but that is still the same volume evidence.',
          signals: [
            {
              label: 'Loud break',
              text: 'Price leaves a key level with relative volume clearly expanded → break credibility rises.',
            },
            {
              label: 'Quiet break',
              text: 'Leaves the level on limp volume → fake weight rises; half size or wait for a retest.',
            },
            {
              label: 'Healthy pullback',
              text: 'Trend dip on quiet volume, turn on expanding volume → healthy participation.',
            },
            {
              label: 'Price–volume divergence',
              text: 'Price high while volume/OBV softens → trim or raise the confirmation bar.',
            },
            {
              label: 'Price up + OI up',
              text: 'On perps, more like fresh longs; price up + OI down is more like short covering (limited fuel).',
            },
          ],
          regime:
            'Breaks and trend starts: volume matters most. Aimless grind: sparse signals — do not force them. Liquidation cascades: huge volume is clearing, not “trend fuel” — wait for the pulse to pass.',
          usage: [
            'Break checklist: structural leave + closing confirmation + relative expansion; missing one downgrades to watch-only.',
            'OBV making highs while price has not yet often flags accumulation — price still has to break; no early champagne.',
            'Never compare absolute volume across venues or contract multipliers; pin one data source per symbol.',
            'Taker buy/sell is a harder microstructure layer than raw volume; this page stays on the general participation frame.',
          ],
          pitfalls: [
            'Calling a quiet break valid because the candle “looks good”.',
            'Reading liquidation prints as trend fuel.',
            'Counting OBV, volume bars and funding as three independent confirms.',
            'Ignoring session seams in aggregated multi-venue volume.',
          ],
          diagram: 'volume',
        },
        {
          id: 'vwap',
          name: 'VWAP',
          tag: 'Volume · location',
          principle:
            'The volume-weighted average price answers where the session’s average fill sits so far. Above VWAP, short-term longs hold the cost edge; below, shorts do. It is an execution and intraday location tool, not a multi-timeframe trend system. However you slice the session is how VWAP jumps — a wrong boundary makes the whole line lie.',
          formula: [
            'Typical = (High + Low + Close) / 3   (some variants use Close or other HLC mixes)',
            'VWAP = Σ(Typical · Volume) / Σ(Volume)  (session cumulative)',
            'Running variance can build σ bands: VWAP ± k · σ_vwap',
            'On session reset, numerator and denominator clear — the line jumps',
          ],
          params:
            'Cash equities reset on the trading day. 24h crypto often resets at UTC midnight or the venue’s “daily” boundary; some panes offer weekly or anchored VWAP from a chosen event. Confirm the platform’s definition first. σ bands often use k = 1–2; large extensions mean-revert on quiet days and can walk the band on trend days.',
          signals: [
            {
              label: 'Pullback hold',
              text: 'On a trend day, a hold of VWAP then a leave is a common with-trend execution.',
            },
            {
              label: 'Lose / reclaim',
              text: 'Close through VWAP without reclaim → intraday bias softens; mirror to the upside.',
            },
            {
              label: 'Stretched',
              text: 'Price far from VWAP (or outside σ bands) → mean reversion more likely on quiet days; trend days can extend — do not fade on autopilot.',
            },
            {
              label: 'Session open',
              text: 'Few samples after reset → VWAP is unstable; keep triggers coarse early on.',
            },
          ],
          regime:
            'Intraday execution and trend-day pullbacks: home field. Multi-day swings: anchored VWAP or switch to averages. Quiet two-way days: VWAP as a mean-reversion axis works better.',
          usage: [
            'Split jobs with MAs: EMA for multi-TF bias, VWAP for “today’s cost”. Do not make both the swing anchor.',
            'The first pullback to VWAP after a break is a common window to judge whether the break was real.',
            'Record the session boundary you use; changing venue or chart without re-checking breaks live vs backtest.',
            'Desks score execution with VWAP; for discretionary work it is a fair-value reference — not scripture.',
          ],
          pitfalls: [
            'Trading “above VWAP = long” on a mis-set session boundary.',
            'Replacing daily/weekly structure with VWAP.',
            'Fading every extension on a trend day.',
            'Treating the first 30 minutes’ unstable VWAP as precise support.',
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
        'Fibonacci is a ruler, not a crystal ball: it marks common retracement and extension ratios. It works because enough people watch it — liquidity tends to cluster nearby. Weight rises where it overlaps prior highs/lows, round numbers, session extremes or supply/demand; alone it has no edge.',
      indicators: [
        {
          id: 'fibonacci',
          name: 'Fibonacci retracement / extension',
          tag: 'Structural helper',
          principle:
            'Between a clear swing high and low, fixed ratios mark pullback supports/resistances and extension targets. The ratios come from the Fibonacci sequence’s limit; in trading what matters is the “crowded grid” effect. Wrong endpoints shift the whole lattice — so the first job is an objective swing, not drawing the net and hunting a story afterward.',
          formula: [
            'Range = |High − Low|',
            'Retracement after an up swing: Level = High − Range · r',
            'Retracement after a down swing: Level = Low + Range · r',
            'Extension (up): Level = High + Range · r; mirror for down',
            'Common r: 0.236 · 0.382 · 0.5 · 0.618 · 0.786',
            'Common extensions: 1.0 · 1.272 · 1.618 · 2.0',
          ],
          params:
            'Anchor only on obvious swings: higher-TF legs beat noisy wiggles. Show the full set if you like; trade the 0.382–0.618 band and 1.272/1.618 hardest. Raise weight when grids overlap across timeframes (e.g. 4H 0.618 ≈ a 15m prior high).',
          signals: [
            {
              label: 'Trend pullback zone',
              text: 'Uptrend holds 0.382–0.618 then momentum agrees → with-trend candidate.',
            },
            {
              label: 'Deep warning',
              text: 'Through 0.786 while still “it will come back” → the swing definition often failed; redraw or change the bias.',
            },
            {
              label: 'Break retest',
              text: 'After a break, a hold of 0.5/0.618 → continuation; a closing break → fake weight rises.',
            },
            {
              label: 'Extension targets',
              text: '1.272 / 1.618 as trim or target references — only if the R multiple clears your bar.',
            },
            {
              label: 'Confluence uprank',
              text: 'Fib landing with horizontal supply/demand, round numbers, VWAP/averages → priority over an isolated ratio.',
            },
          ],
          regime:
            'Clear swings in trends and swings: useful. Chaotic wicks with no structure: do not draw. Range boxes: the box edges usually outrank Fib; Fib only subdivides inside.',
          usage: [
            'Fix the drawing rule: two extremes in the same sense — do not switch between wick and close day to day or the grid drifts.',
            'Entry still wants momentum or price behaviour; Fib answers “where to look”, not “click now”.',
            'Stops beyond structural invalidation — not glued to the face of 0.618, where sweeps then continuation are common.',
            'When an extension fights a prior high/low, the existing structure wins.',
          ],
          pitfalls: [
            'Gridding noisy wiggles and being surprised it “fits”.',
            'No discipline on wick vs close endpoints, so levels are redrawn constantly.',
            'Worshipping 0.618 without confluence or confirmation.',
            'Shooting for 1.618 without a risk/reward check.',
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
      'One recipe keeps one trend tool, one momentum tool, and one volatility or volume tool. The table is a division of labour — not “more lines, more safety”. When the regime is wrong, shut the whole stack down instead of adding another line to rescue it.',
    headers: ['Stack', 'Who does what', 'Typical use'],
    rows: [
      [
        'EMA + RSI + volume',
        'Trend location / momentum turn / participation',
        'Pullback to EMA, RSI turning up near mid-range, volume expanding; invalidate on a close through EMA or the prior low',
      ],
      [
        'MA + MACD + ATR',
        'Direction / momentum alignment / stop width',
        'Hold with the trend; trail by ATR multiple; do not flat on a shallow dip while the histogram still agrees',
      ],
      [
        'Bollinger squeeze + volume + level',
        'Compression / participation / valid break',
        'Close holds beyond a key level after a squeeze; continue on a hold of the retest; fakes show as quiet pierces that close back inside',
      ],
      [
        'ADX + RSI',
        'Is there a trend / is it stretched',
        'Low ADX → fewer breakouts, trade edges; high ADX → allow RSI to stay hot and use pullback rules',
      ],
      [
        'VWAP + volume + structure',
        'Intraday cost / participation / key level',
        'Trend-day pullback to VWAP that leaves on volume; fix the session boundary first',
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
      'Readings follow regime',
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
