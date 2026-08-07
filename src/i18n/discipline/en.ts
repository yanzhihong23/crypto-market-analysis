import type { DisciplineContent } from './types'

export const disciplineEn: DisciplineContent = {
  title: 'Chart reading and trading discipline',
  lede: 'A general framework for watching a board: structure sets direction, indicators confirm and filter, discipline governs size and behaviour.',
  tocLabel: 'Contents',
  labelJoin: ': ',

  stats: [
    { value: 'Structure first', label: 'Reading order' },
    { value: '1%–2%', label: 'Risk per trade (hard cap ~3%)' },
    { value: 'Two sources', label: 'Bar to entry' },
    { value: 'Flat is a position', label: 'Default state' },
  ],

  principle:
    'Indicators are different projections of the same price, and stacking more of the same kind does not raise your hit rate. A combination that works is trend/structure + momentum + volatility or volume, each answering a different question. The trap specific to perpetuals is treating leverage or margin used as "risk" — the real risk is what the account loses when the stop is hit. Crypto moves enough that a stop often needs 1%–3% of price to breathe, so the textbook "never more than 1%" tends to leave a position too small to be worth taking; fix the risk percentage instead, size back from ATR or the invalidation level, and set a separate daily loss limit (say 4%–6%) as the actual fuse.',

  sections: [
    {
      id: 'flow',
      label: 'Reading order',
      title: 'How to read the board',
      blocks: [
        {
          kind: 'steps',
          items: [
            {
              title: 'Fix the structure first',
              body: 'Daily and 4H give you trend, swing highs and lows, and the levels that matter; 15m–5m only time the entry. When the higher timeframe has no direction, the lower one is all noise.',
            },
            {
              title: 'Indicators confirm',
              body: 'Use moving averages and MACD to check you are with the trend, RSI or KD for exhaustion and divergence, Bollinger or ATR to size volatility and stop width — never to predict direction.',
            },
            {
              title: 'Volume and the book',
              body: 'Volume, VWAP and open interest answer whether anyone is behind the move. A breakout on no volume, or price up while open interest falls, is a fake until proven otherwise.',
            },
            {
              title: 'Wait for agreement',
              body: 'At least two independent kinds of evidence pointing the same way: a structural break plus volume, or a pullback to the moving average with RSI leaving oversold and the MACD histogram turning. One indicator lighting up is not enough.',
            },
          ],
        },
      ],
    },

    {
      id: 'structure',
      label: 'Price structure',
      title: 'Candles and structure',
      rule: true,
      blocks: [
        {
          kind: 'table',
          headers: ['Subject', 'What to do'],
          rows: [
            [
              'Timeframe alignment',
              'Only take trades with the higher timeframe. Against it, nothing more than a bounce or pullback scalp, at half size.',
            ],
            [
              'Levels first',
              'Prior highs and lows, round numbers, the daily and weekly open, high-volume nodes. No clear invalidation level means no trade.',
            ],
            [
              'Spotting a fake break',
              'Thin volume on the break, a long wick rejecting it, no close holding above — treat it as a fake first.',
            ],
            [
              'Expansion vs compression',
              'The first high-volume candle out of a tight range carries the most information; chasing after a violent move rarely pays.',
            ],
            [
              'Wicks and closes',
              'Read the close against the body, not the intraday extreme. A long wick is a rejection; a close that holds is acceptance.',
            ],
            [
              'Relative strength',
              'Pick the leader or the laggard within a group: what stays strong while the market is weak is the better long, and the reverse for shorts.',
            ],
          ],
        },
      ],
    },

    {
      id: 'indicators',
      label: 'Indicators',
      title: 'What each indicator actually answers',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Choose indicators by the role they play before arguing about parameters. Running two of the same kind — RSI and Stochastic, say — is close to counting the same evidence twice.',
        },
        {
          kind: 'table',
          headers: ['Role', 'Usual tools', 'How to use it / how not to'],
          rows: [
            [
              'Trend and location',
              'MA / EMA (20·50·200), Ichimoku, VWAP, ADX',
              'Price above the averages with the averages stacked bullish leans long; take the pullback that holds. Do not use a moving average cross as your only entry. ADX says how strong a trend is and never which way: under 20 read it as no trend, over 25 as one.',
            ],
            [
              'Momentum',
              'MACD, RSI, ROC, Stochastic',
              'Read direction and divergence: a new price high the oscillator does not follow means momentum is fading. Do not fight overbought readings in the middle of a trend.',
            ],
            [
              'Volatility and channels',
              'Bollinger, Keltner, ATR, Donchian',
              'A break out of narrow bands often runs; ATR sets stop width. Do not chase a push through the band once the bands are already wide.',
            ],
            [
              'Volume',
              'Volume, OBV, VWAP, volume profile',
              'A breakout needs volume to confirm; a quiet pullback is healthy. Price and volume disagreeing is a warning.',
            ],
            [
              'Structural helpers',
              'Fibonacci retracement/extension, pivots, horizontal supply and demand',
              'A retracement level carries more weight where it lands on a prior high or low. Fibonacci alone is not a system.',
            ],
            [
              'Perpetuals only (optional)',
              'Funding, long/short ratio, open interest, basis',
              'Extreme funding and crowded positioning are usually contrarian clues; price up with open interest up is what a new trend looks like.',
            ],
          ],
        },
      ],
    },

    {
      id: 'recipes',
      label: 'Recipes',
      title: 'Combinations you can use as they are',
      blocks: [
        {
          kind: 'recipes',
          items: [
            {
              title: 'Trend pullback (trending market)',
              lines: [
                {
                  label: 'Setup',
                  text: 'Price above EMA20/50 for longs, below for shorts, with the higher-timeframe MACD histogram on the same side.',
                },
                {
                  label: 'Entry',
                  // Not "out of oversold": in an uptrend a pullback to EMA20
                  // rarely takes RSI under 30, and the page says a page
                  // earlier not to fight oversold readings mid-trend.
                  text: 'A pullback into EMA20 or the Bollinger midline, RSI turning back up from the middle of its range (around 40–50) without breaking the prior low.',
                },
                {
                  label: 'Filter',
                  text: 'Volume drying up into the pullback and picking back up on the resumption; ATR normal, not blown out.',
                },
                {
                  label: 'Target',
                  text: 'The prior high, or the last leg projected from here. Check it clears 1.5R before taking it.',
                },
                {
                  label: 'Invalidation',
                  text: 'A close below the moving average being tested, or below the prior swing low.',
                },
              ],
            },
            {
              title: 'Breakout continuation (after compression)',
              lines: [
                {
                  label: 'Setup',
                  text: 'Bollinger bandwidth or ATR near recent lows — volatility compressed.',
                },
                {
                  label: 'Entry',
                  text: 'A close through the range, the Donchian channel or the prior high, on clearly expanded volume.',
                },
                {
                  label: 'Confirmation',
                  text: 'The MACD histogram flipping the way of the break, or price holding the right side of VWAP or the broken average.',
                },
                {
                  label: 'Target',
                  text: 'The height of the range projected from the break. If that is under 1.5R, let it go.',
                },
                {
                  label: 'Invalidation',
                  text: 'A long wick through the level that closes back inside, or volume dying immediately after the break.',
                },
              ],
            },
            {
              title: 'Divergence reversal (range or late trend)',
              lines: [
                {
                  label: 'Setup',
                  text: 'The higher timeframe has gone sideways or the trend has flattened — not the middle of a one-way move.',
                },
                {
                  label: 'Signal',
                  text: 'Price makes a new high or low that RSI or MACD does not follow.',
                },
                {
                  label: 'Entry',
                  text: 'Wait for structure to confirm — a short-term trendline break or a reclaimed key candle — rather than entering the moment divergence appears.',
                },
                {
                  label: 'Target',
                  text: 'The previous structural low or high, or the midline. A reversal trade does not chase a distant target.',
                },
                {
                  label: 'Caution',
                  text: 'In a strong trend divergence can print several times in a row. Small size, tight stop.',
                },
              ],
            },
            {
              title: 'Mean reversion (range-bound market)',
              lines: [
                {
                  label: 'Setup',
                  text: 'Price oscillating in a defined range, averages tangled, ADX low, no clear trend.',
                },
                {
                  label: 'Entry',
                  text: 'A touch of the Bollinger band or the range edge with RSI into overbought or oversold and a rejection candle.',
                },
                {
                  label: 'Target',
                  text: 'The midline or the opposite edge. Do not run a range playbook on the trend day that follows a break.',
                },
                {
                  label: 'Switch off',
                  text: 'The moment a close breaks the range on volume, stop thinking in reversion.',
                },
              ],
            },
          ],
        },
      ],
    },

    {
      id: 'anti-patterns',
      label: 'What not to do',
      title: 'Combinations to avoid, and what to reach for instead',
      blocks: [
        {
          kind: 'table',
          headers: ['Practice', 'Verdict', 'Better'],
          rows: [
            [
              'RSI + Stochastic + CCI together',
              'Weak: all three are momentum, closely correlated',
              'Keep one momentum reading, add trend and volume',
            ],
            [
              'Entering on a MACD cross alone',
              'Weak: it lags, and a range market prints false ones repeatedly',
              'The cross plus the right side of a key average plus a structural level',
            ],
            [
              'Treating the Bollinger bands as buy and sell points',
              'Weak: a trend walks the band for a long time',
              'Decide trend or range first, then decide whether a band touch is reversal or continuation',
            ],
            [
              'Retuning parameters every day',
              'Weak: overfitting to the last few sessions',
              'Fix a small set of parameters and filter with timeframe and structure',
            ],
            [
              'Fighting the higher timeframe with a lower one',
              'Weak: usually costs you both hit rate and payoff',
              'Higher timeframe for direction, lower one only for the entry',
            ],
          ],
        },
        {
          kind: 'note',
          title: 'A set that is enough',
          items: [
            'Main chart: EMA20 + EMA50 (or VWAP) + volume',
            'Sub chart: MACD or RSI, one of the two',
            'Volatility: ATR, for the stop',
            'Occasional: Bollinger when you need to see compression or expansion',
            'Perpetuals: open interest and funding as filters on top',
          ],
        },
      ],
    },

    {
      id: 'regime',
      label: 'Market regime',
      title: 'Regime first, then strategy, then indicators',
      rule: true,
      blocks: [
        {
          kind: 'paragraph',
          text: 'The same indicators perform very differently across regimes. Work out what kind of market you are in before deciding whether to trade trend, breakout or reversion.',
        },
        {
          kind: 'table',
          headers: ['Regime', 'How to recognise it', 'Suits', 'Avoid'],
          rows: [
            [
              'Trend',
              'Higher highs or lower lows, price holding one side of the averages, ADX elevated or bands expanding',
              'Trend pullbacks, breakout continuation, trailing stops',
              'Picking tops and bottoms, mean reversion',
            ],
            [
              'Range',
              'Clear boundaries, tangled averages, frequent fake breaks',
              'Fading the edges, small size in and out',
              'Chasing breakouts, sitting through a wide stop',
            ],
            [
              'Chop',
              'Long wicks both ways, direction reversing, volume confirming nothing',
              'Flat, or a token position',
              'Anything that needs a clean trend',
            ],
            [
              'Extreme volatility',
              'ATR spiking, liquidation cascades, spreads widening, wicks',
              'Cutting size, managing what you already hold, waiting it out',
              'Opening size, moving stops further away',
            ],
          ],
        },
      ],
    },

    {
      id: 'perp',
      label: 'Margin and funding',
      title: 'Perpetuals: margin, liquidation, funding',
      blocks: [
        {
          kind: 'rules',
          items: [
            {
              title: 'Margin mode',
              items: [
                'Isolated caps the worst case at the margin in that position — right for testing an idea and for trades you are unsure of.',
                'Cross shares the account balance and rides out more noise, but one position out of control can take the account with it. Start on isolated.',
                'Work out the liquidation price before you enter: it should sit well beyond the invalidation level, not just past the stop.',
              ],
            },
            {
              title: 'Funding',
              items: [
                'Funding is a cost of carry, not a direction signal. Extreme funding says one side is crowded, and crowded can last a long time.',
                'If the plan holds through a settlement, put the expected funding into the payoff. If it eats more R than the trade is worth, do not hold overnight.',
                'Funding, basis and the long/short ratio all extreme the same way reads as a squeeze setup, not as a reason to chase.',
              ],
            },
          ],
        },
      ],
    },

    {
      id: 'leverage',
      label: 'Leverage and symbols',
      title: 'Leverage bands and choosing what to trade',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Leverage does not set risk — risk is stop distance × position ÷ equity, as above. Leverage sets something else: how close liquidation sits to your entry. So there is only one test for choosing it. Liquidation has to be well beyond the invalidation level, with room left over for a wick. The distances below are the rough isolated case (about 1 ÷ leverage), before maintenance margin and unrealised profit, both of which bring it closer in practice.',
        },
        {
          kind: 'table',
          headers: ['Band', 'Liquidation from entry (isolated)', 'Which means'],
          rows: [
            [
              '2–5×',
              'About 20%–50%',
              'Liquidation effectively cannot come before the stop, so stop width is set purely by structure. Most trades belong here not because it is "safe" but because it takes liquidation out of the decision',
            ],
            [
              '5–10×',
              'About 10%–20%',
              'Still well outside most structural invalidations; suits short-term trades where the level was already close',
            ],
            [
              '10–20×',
              'About 5%–10%',
              'Now the same order of magnitude as a normal stop. One wick can reach liquidation before it reaches the stop — and that trade did not end in R',
            ],
            [
              '20×+',
              'Under 5%',
              'Liquidation sits inside the noise and the stop stops meaning anything: what gets closed is the position, not the plan',
            ],
          ],
        },
        {
          kind: 'table',
          headers: ['Tier', 'How to choose', 'Sizing'],
          rows: [
            [
              'Majors (BTC/ETH)',
              'Tight spreads, real depth, behaviour that repeats',
              'Fine as the default. Count correlated positions as one risk',
            ],
            [
              'Large-cap alts',
              'Move with BTC but further — higher beta: BTC does 1%, these often do 1.5%–3%',
              'Smaller than BTC. More fake breaks, so raise the bar for confirmation',
            ],
            [
              'Illiquid small caps',
              'Easy to stop-hunt, easy to wick, easy to manipulate',
              'Skip by default. If you must: isolated, tiny R, nothing held overnight',
            ],
          ],
        },
      ],
    },

    {
      id: 'execution',
      label: 'Execution and exits',
      title: 'Execution, exits and adding',
      blocks: [
        {
          kind: 'table',
          headers: ['Subject', 'What to do'],
          rows: [
            [
              'Stop order type',
              'Stop-market when it is moving fast, because getting out is the point; stop-limit is fine in good liquidity if you accept it may not fill.',
            ],
            [
              'Expect slippage',
              'On wicks, liquidation cascades and data releases the fill can be some way from the chart. Leave room for it in the size.',
            ],
            [
              'Scaling out',
              'Take 30%–50% at the first target, then move the stop to break-even or to structure — whichever is further out. Break-even usually sits much closer than the invalidation level, so moving there unconditionally hands the rest of the position to the noise. Trail the remainder by structure rather than holding it all for a perfect top.',
            ],
            [
              'Adding',
              'Pyramid only into profit, and only when the new tranche has its own invalidation. Never average down a loser — that is swapping a bigger risk for a guess.',
            ],
            [
              'Trading costs',
              'Fees are the tax you pay on every trade, and the one this page is most likely to let you forget after pricing funding and slippage: roughly 0.1% round trip taking liquidity, which against a 0.8% stop is over 12% of your R. The tighter the stop and the higher the frequency, the more it decides.',
            ],
            [
              'Minimum payoff',
              'Do the arithmetic before entering: if the stop is 1R, the target should be at least 1.5R–2R, otherwise the hit rate has to be extraordinary. Count R net — fees, funding and expected slippage come off first.',
            ],
            [
              'Expectancy',
              'Hit rate × average win − loss rate × average loss has to be positive to survive, and it has to be computed net of costs; the gross number is a lie over any length of time. Recording money instead of R hides a system that is decaying.',
            ],
          ],
        },
      ],
    },

    {
      id: 'events',
      label: 'Timing and events',
      title: 'Timing and events',
      blocks: [
        {
          kind: 'table',
          headers: ['Window', 'What to watch'],
          rows: [
            [
              'Around funding settlement',
              'Volatility tends to pick up, and when funding is extreme, watch for forced closes and fake breaks. With no clear edge, stay out for 15–30 minutes either side.',
            ],
            [
              'Macro data (CPI, FOMC)',
              'Spreads and slippage get worse and invalidation levels get swept. Cut size beforehand, or only manage what you hold.',
            ],
            [
              'Weekends and holidays',
              'Liquidity thins, fake breaks and wicks multiply. Half size, or raise the bar for entry.',
            ],
            [
              'Listings, maintenance, on-chain trouble',
              'Exchange notices, suspended deposits and withdrawals, contracts being delisted — when in doubt, open nothing.',
            ],
          ],
        },
      ],
    },

    {
      id: 'failures',
      label: 'How it goes wrong',
      title: 'The usual ways it goes wrong',
      blocks: [
        {
          kind: 'table',
          headers: ['Situation', 'Why it costs you', 'How to stop it'],
          rows: [
            [
              'Widening the stop past invalidation',
              '"A little more room" means the risk on the trade is no longer defined',
              'Fix R first, then the stop. Move the stop and you have to resize',
            ],
            [
              'Sizing up right after a big win',
              'Excitement inflates the position and one giveback costs a week',
              'The next trade after a big win goes back to standard size. No raising risk again that day',
            ],
            [
              'Switching symbols after a losing streak',
              'Revenge in a different market — no edge, just a different table',
              'A losing streak means stopping to review before deciding whether to trade on. Changing symbol does not count as a break',
            ],
            [
              'Right on direction, stopped out anyway',
              'The direction was fine but the size or leverage was not',
              'Direction and size are two decisions. Leverage serves the invalidation level, not your confidence',
            ],
            [
              'Treating open profit as realised',
              'Sizing up on unrealised gains, then falling apart on the drawdown',
              'Only a closed trade is a win. Open profit does not join the balance you size the next one from',
            ],
            [
              'Chasing a liquidation cascade',
              'Liquidation-driven moves end quickly and you take the last of it',
              'Cascades can be scalped; do not mistake one for the start of a trend',
            ],
          ],
        },
      ],
    },

    {
      id: 'vigil',
      label: 'Using Vigil',
      title: 'Working with the Vigil board (optional rules)',
      blocks: [
        {
          kind: 'paragraph',
          text: 'The board is a noise filter, not a signal generator. Written into the rules it is steadier than clicking whatever card catches your eye.',
        },
        {
          kind: 'table',
          headers: ['Rule', 'How to apply it'],
          rows: [
            [
              'Two families before a new position',
              'A price reading and a flow or positioning reading both firing is what puts a symbol on the shortlist. A single 3σ is something to watch.',
            ],
            [
              'A ring is not a market order',
              'After the ring you still wait for the level and the invalidation. Find the pullback on a lower timeframe rather than chasing the last candle.',
            ],
            [
              'Compression on its own',
              'Records that a symbol is coiling; it is not a reason to enter. Judge the move that breaks the coil.',
            ],
            [
              'Liquidations and extreme funding',
              'Filters or contrarian clues, never trend confirmation. With funding extreme, cut size or shorten the hold.',
            ],
            [
              'Watchlist breadth',
              'Strength only computes with 8 or more symbols on the board; below that relative strength is distorted, so do not size up on it.',
            ],
          ],
        },
        {
          kind: 'paragraph',
          text: 'What each reading is for. The names on the left are the ones in signals.md; on the right is where the reading belongs in a trade. Most of them are filters or timing — very few can be read as direction.',
        },
        {
          kind: 'table',
          headers: ['Reading', 'Use it as', 'Do not use it as'],
          rows: [
            [
              'momentum',
              'A nudge: this symbol just moved, worth pulling up the chart',
              'An entry — five minutes of deviation says nothing about how long it lasts',
            ],
            [
              'volatility',
              'An input to stop width: wider ranges mean smaller size',
              'Trend confirmation. It reports expansion, not direction',
            ],
            [
              'compression',
              'A watchlist: coils often precede a run, so mark the levels now',
              'A reason to enter. A coil can hold for a long time',
            ],
            [
              'breakout / range-break',
              'Structural evidence, and the trigger for the breakout recipe when volume agrees',
              'Something to chase without volume — treat it as a fake first',
            ],
            [
              'rejection',
              'Evidence for an invalidation level: the rejected end can anchor the stop',
              'A reversal on its own. One candle is not a turn',
            ],
            [
              'strength',
              'Symbol selection: when long either way, take the one still strong net of the board',
              'Anything, with fewer than 8 symbols on the watchlist',
            ],
            [
              'volume',
              'The confirming layer. Breakouts and reversals both need it to sign off',
              'A direction. Volume alone says only that it changed hands',
            ],
            [
              'taker',
              'One of the harder pieces of directional evidence: who is crossing the spread',
              'A reason to chase into a spike, where extreme readings cluster',
            ],
            [
              'open-interest',
              'Telling new money from closing: price up with open interest up is what a trend looks like',
              'A trend start when price is up and open interest is down — that is shorts covering',
            ],
            [
              'liquidation',
              'A risk switch: cut leverage and widen expected slippage during a cascade',
              'Trend confirmation, ever. Cascades end fast',
            ],
            [
              'ratio / divergence',
              'Crowding: raise the bar for confirmation, or look the other way, when one side is packed',
              'Timing. Crowding can persist for weeks',
            ],
            [
              'funding / funding-shift',
              'Cost of carry and crowding: price it into the payoff before holding through settlement',
              'A direction signal',
            ],
            [
              'basis',
              'Spot and perpetual disagreeing — at the extremes, one-sided sentiment in the contract',
              'A trade on its own. Basis converges on no schedule',
            ],
            [
              'spread',
              'The cost light: a wider spread means getting in and out costs more right now',
              'A moment to open anything new',
            ],
          ],
        },
      ],
    },

    {
      id: 'rules',
      label: 'The rules',
      title: 'Trading discipline',
      rule: true,
      blocks: [
        {
          kind: 'rules',
          items: [
            {
              title: 'Size and risk',
              items: [
                'Risk = stop distance × position ÷ equity. Not leverage, and not how much margin is tied up.',
                'On perpetuals 1%–2% per trade is normal, with a hard cap near 3%. The textbook "never more than 1%" often leaves a position too small to be worth taking.',
                'Set stop width from structure or 1.5–2×ATR — default 14 periods, on the timeframe you are executing on rather than the structural one — and size back from it. Deciding how big you want to be and then fitting a stop around it is the usual road to liquidation.',
                'Down 4%–6% on the day ends the session. That one is hard, because it is the rule that constrains money directly.',
                'Three losses in a row means stop and review, not necessarily stop trading: at a 45% hit rate roughly one in six sets of three comes out that way, so it usually says the regime moved or execution slipped rather than that the system is broken.',
                'Correlated positions on the same side (BTC+ETH) count as one risk.',
              ],
            },
            {
              title: 'Entries and exits',
              items: [
                'Write the plan first: regime, trigger, invalidation, target, size.',
                'The stop is part of the entry. No invalidation level means no trade.',
                'Move the stop to protect profit; do not put off the exit indefinitely because an indicator has not rolled over yet.',
              ],
            },
            {
              title: 'Behaviour',
              items: [
                'Never: revenge trades, averaging down, an unplanned feeling that it is going up.',
                'Never: full size into data releases, listings or maintenance windows.',
                'Flat is allowed. With no structure and no agreement, watching is not an obligation to trade.',
              ],
            },
          ],
        },
      ],
    },

    {
      id: 'pre-trade',
      label: 'Before entering',
      title: 'Checklist before you enter',
      blocks: [
        {
          kind: 'checklist',
          items: [
            {
              id: 'regime',
              label: 'Regime',
              text: 'Trend or range right now? Does the strategy match it?',
            },
            {
              id: 'timeframe',
              label: 'Higher timeframe',
              text: 'Do the daily and 4H support this direction?',
            },
            {
              id: 'structure',
              label: 'Structure and invalidation',
              text: 'Where is the level? At what price are you wrong?',
            },
            {
              id: 'agreement',
              label: 'Agreement',
              text: 'Do at least two of trend, momentum and volume point the same way?',
            },
            {
              id: 'sizing',
              label: 'Sizing',
              text: 'Have you divided the risk amount by the stop distance (ATR will do)?',
            },
            {
              id: 'liquidation',
              label: 'Liquidation price',
              text: 'Isolated or cross, does liquidation sit well beyond invalidation?',
            },
            {
              id: 'holding',
              label: 'Holding period',
              text: 'If it crosses a funding settlement, is the trade still worth the cost?',
            },
            {
              id: 'events',
              label: 'Event window',
              text: 'Anything in the next hour — data, maintenance, a volatility spike?',
            },
            {
              id: 'board',
              label: 'Board check',
              text: 'On Vigil: two signal families, or one reading of noise?',
            },
            {
              id: 'mind',
              label: 'State of mind',
              text: 'Just lost, short of sleep, elated after a win, in a hurry to make it back? Then skip it.',
            },
          ],
        },
        { kind: 'sizer' },
      ],
    },

    {
      id: 'post-trade',
      label: 'Review and journal',
      title: 'Review and journal template',
      blocks: [
        {
          kind: 'table',
          headers: ['Dimension', 'What to record'],
          rows: [
            [
              'Plan adherence',
              'In and out as planned? Any rule changed mid-trade?',
            ],
            [
              'Process quality',
              'The result is secondary; a profit that broke the rules is still a bad trade.',
            ],
            [
              'R multiple',
              'How many R did it make or lose? Counting in R shows decay that counting in money hides.',
            ],
            [
              'Redundant indicators',
              'Which confirmation did work? Which one was repeating the same thing?',
            ],
            ['Reusable', 'Can the trigger be written down as a fixed recipe?'],
            [
              'Emotion',
              'Where did fear or greed show up? How do you catch it next time?',
            ],
          ],
        },
        {
          kind: 'subTable',
          title: 'The minimum a trade should record',
          headers: ['Field', 'Example'],
          rows: [
            [
              'Symbol / side / timeframe',
              'BTCUSDT · long · 15m execution on 4H structure',
            ],
            ['Regime', 'Trend / range / chop / extreme volatility'],
            [
              'Trigger and invalidation',
              'Pullback to EMA20; stop on a close below the prior low',
            ],
            [
              'Planned R',
              '1.5% of equity at risk; 2R target, remainder trailed',
            ],
            ['Actual fills and slippage', 'Entry, exit, whether it was swept'],
            ['Result (R)', '+1.8R or −1R'],
            [
              'Discipline tag',
              'To plan / cut early / stop moved / revenge / averaged down',
            ],
            [
              'Screenshots',
              'One before and one after; review the chart, not your memory',
            ],
          ],
        },
      ],
    },
  ],

  checklist: {
    reset: 'Clear',
    progress: (done: number, total: number) => `${done} / ${total}`,
  },

  sizer: {
    title: 'Position sizer',
    intro:
      'Fix the risk, then let the stop distance give you the size. The other order round is the road to liquidation.',
    equity: 'Account equity',
    risk: 'Risk per trade %',
    entry: 'Entry price',
    stop: 'Stop price',
    riskAmount: 'Amount at risk',
    stopDistance: 'Stop distance',
    size: 'Position (base)',
    notional: 'Notional',
    leverage: 'Leverage needed',
    incomplete: 'Fill in equity, risk %, entry and stop.',
    formula:
      'Amount at risk = equity × risk%; position = amount at risk ÷ |entry − stop|; notional = position × entry; leverage needed = notional ÷ equity.',
    note: 'Leverage needed is the minimum this position requires, not a recommendation — the higher it is, the closer the stop sits and the less a wick has to do to reach it. Fees and funding are not in these numbers.',
  },

  closing: {
    label: 'In one line',
    oneLiner:
      'Structure sets direction, indicators agree or you pass; only trade a plan that has an invalidation level.',
    chips: [
      'No plan, no order',
      'No stop, no position',
      'No stacked duplicates',
      'Never average down',
      'Never revenge',
      'Name the regime first',
      'Flat is a position',
    ],
    disclaimer:
      'General trading practice, not investment advice. Parameters and timeframes need calibrating to what you trade.',
  },

  docs: {
    preferPage:
      '**Best read in the app** at [`/discipline`](/discipline), which lays this out as cards with contents navigation. This file is generated from the same source for Git and offline reading — edit the content module, not this file.',
    tocHeading: 'Contents',
    principleHeading: 'The core of it',
    statHeaders: ['Dimension', 'Guidance'],
    backLink:
      'Back to the [README](../README.md) · the board’s readings are described in [signals.md](signals.md).',
  },
}
