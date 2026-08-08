import type { TheoriesContent } from './types'

export const theoriesEn: TheoriesContent = {
  title: 'Technical analysis theories',
  lede: 'Indicators are rulers; theories are coordinate systems. Each school below is a short illustrated article: what question it answers, what it looks like on a chart, and how it lands in a plan — diagrams are geometry, not a trade replay.',
  tocLabel: 'Contents',
  labelJoin: ': ',

  stats: [
    { value: '6 schools', label: 'Core set' },
    { value: '19 figures', label: 'Schematics' },
    { value: 'Structure first', label: 'Reading order' },
    { value: 'One narrative', label: 'Selection rule' },
  ],

  principle:
    'Technical theories describe how participant behaviour projects onto price and volume — they are not formula guarantees. The same swing can be told as structure, waves or Wyckoff at once; a trading plan still names one primary narrative, with anything else at most a veto, never a second vote. Theories set direction and phase; indicators confirm and measure. In the wrong regime, neat wave counts and elaborate patterns are noise.',

  fields: {
    pitfalls: 'Common traps',
  },

  path: {
    id: 'path',
    label: 'Path',
    title: 'Read structure before joining a school',
    intro:
      'Do not start from a full Elliott or Wyckoff glossary. Follow the order below until you can see trend and volume agreement on the pane, then decide whether a finer framework earns its keep. Each school has several schematics — read with the figures, not the headings alone.',
    steps: [
      {
        title: 'Dow + market structure',
        body: 'Use swing sequences for the primary trend and phase; name HH/HL or LH/LL. Without a structural bias, patterns and wave labels have no anchor.',
      },
      {
        title: 'Volume-price',
        body: 'Ask whether breaks, pullbacks, tops and bottoms have volume agreement. A quiet leave of a key level defaults to watch-only, not an entry reason.',
      },
      {
        title: 'Candles as triggers',
        body: 'Only at locations where structure and volume already align, use engulfing or long-wick bars as timing — not as stand-alone reversal forecasts.',
      },
      {
        title: 'Wyckoff / Elliott on demand',
        body: 'Reach for Wyckoff when you need accumulation/distribution phases; for Elliott when you need numbered impulse and correction scenarios. Skip them when unused.',
      },
    ],
    toolboxTitle: 'Default narrative stack (write it into the plan)',
    toolboxItems: [
      'Primary narrative: market structure (trend / range / transition)',
      'Check: does volume-price agree with that narrative?',
      'Timing: candle confirmation at the key level',
      'Optional: Wyckoff phase or Elliott count as a scenario',
    ],
  },

  overview: {
    id: 'overview',
    label: 'Map',
    title: 'Pick by the question, then learn the jargon',
    intro:
      'This table is the map for the page. Open a school for the multi-figure write-up; for one question keep one primary frame so you do not treat “Elliott says wave five” and “structure says range” as two separate signals.',
    headers: ['Theory', 'Main question', 'Best fit', 'How not to use it'],
    rows: [
      [
        'Dow Theory',
        'Is the primary trend intact? Which phase?',
        'Bias on daily and higher',
        'Do not treat intraday noise as a trend reversal',
      ],
      [
        'Volume-price',
        'Is the move funded?',
        'Break and accumulation checks',
        'Do not treat thin volume as confirmation',
      ],
      [
        'Elliott Wave',
        'Impulse or correction? Rough targets?',
        'Scenario planning in trends',
        'Do not treat a forced count as an entry order',
      ],
      [
        'Wyckoff',
        'Accumulating, marking up, or distributing?',
        'Ranges and phase shifts',
        'Do not label every pause a full accumulation',
      ],
      [
        'Market structure',
        'Are swings bullish or bearish?',
        'Default daily chart language',
        'Do not flip bias on every noisy bar',
      ],
      [
        'Candlesticks',
        'What is the immediate auction here?',
        'Triggers at key levels',
        'Do not hunt reversals in empty space',
      ],
    ],
  },

  theories: [
    {
      id: 'dow',
      name: 'Dow Theory',
      tag: 'Trend foundation',
      lede: 'Dow is the floor under modern trend work: prices discount what is known, markets move in graded trends, and related markets plus volume should confirm. It will not hand you a precise entry, but it decides which timeframe’s direction you are allowed to claim.',
      sections: [
        {
          title: 'Three degrees: do not grab the wrong ruler',
          body: [
            'Dow splits movement into three degrees. The primary trend usually runs for months and is the layer your bias and size should match; secondary retracements last weeks and often give back a third to two-thirds of the primary swing while remaining corrections inside it; daily fluctuations are mostly noise for swing traders.',
            'The usual error is letting a daily spike veto the primary trend, or promoting a secondary pullback into a primary reversal. The plan must say which degree you claim and which degree’s break rewrites bias.',
          ],
          points: [
            {
              label: 'Primary',
              text: 'Clear HH/HL or LH/LL on the higher timeframe — default long/short direction.',
            },
            {
              label: 'Secondary',
              text: 'Against the primary, shorter in time — where pullback entries live, not instant flips.',
            },
            {
              label: 'Daily',
              text: 'Filter before you mark structure, or every wiggle becomes a swing.',
            },
          ],
          diagram: 'dow-degrees',
          caption:
            'Thick path = primary, polyline = secondary, local sawtooth = daily noise — trade only the degree you claim.',
        },
        {
          title: 'Three phases of a primary bull (or bear)',
          body: [
            'A primary advance is often told in three phases: informed accumulation, public participation, then climax and distribution. Bears mirror that: panic selling, weak rallies, despair and the hand-off into new accumulation.',
            'Phase labels are almost always clear only in hindsight. Treat them as a scenario frame: when volume, breadth and peer markets show public mania while leaders lag, raise the weight on “phase three” — but do not calendar the day distribution begins.',
          ],
          points: [
            {
              label: 'Phase one',
              text: 'Price still soft or sideways; informed money builds; narratives stay bearish.',
            },
            {
              label: 'Phase two',
              text: 'Trend is widely accepted; advances are cleanest and pullbacks most “textbook”.',
            },
            {
              label: 'Phase three',
              text: 'Good news is common knowledge; volatility rises; price and peers start to split.',
            },
          ],
          diagram: 'dow-phases',
          caption:
            'Coloured bands are teaching partitions after the fact — not tradable exact boundaries.',
        },
        {
          title: 'Confirmation and volume',
          body: [
            'Classic Dow wanted industrials and transports to confirm. In crypto: related leaders, sector breadth, spot vs perp, and price vs volume (or OBV) should broadly agree. A single contract at a new extreme while volume and peers peel off is failed confirmation — trim and tighten first, do not fade on that alone.',
            'Volume’s rule is equally plain: expansion with the primary trend and contraction against it looks healthy; the opposite is a warning. A warning is not an instant reverse — it demotes “add with the trend” in priority.',
          ],
          points: [
            {
              label: 'Confirmation holds',
              text: 'Price and peers/volume print extremes together; pullbacks quiet down.',
            },
            {
              label: 'Confirmation fails',
              text: 'Price dances alone while volume or peers lag — check for a late-stage tape.',
            },
            {
              label: 'Bridge to structure',
              text: 'Dow’s primary ≈ a clear higher-timeframe HH/HL or LH/LL sequence.',
            },
          ],
          diagram: 'dow-confirm',
          caption:
            'Price HH while volume/peers stall: confirmation fails — cut risk before calling a reversal.',
        },
      ],
      playbook: {
        title: 'Dow checklist',
        steps: [
          {
            label: 'Degree',
            text: 'Write the timeframe and trend degree you claim (primary / secondary).',
          },
          {
            label: 'Bias',
            text: 'HH/HL or LH/LL on that degree? Which swing voids it?',
          },
          {
            label: 'Confirm',
            text: 'Do peers and volume agree? If not, size down.',
          },
          {
            label: 'Execute',
            text: 'Hunt entries as secondary retracements end without breaking primary structure; daily noise does not rewrite bias.',
          },
        ],
      },
      pitfalls: [
        'Labelling every pullback “phase-three distribution”.',
        'Declaring a primary reversal on an unconfirmed break.',
        'Ignoring mutual confirmation and staring at one contract’s local wiggle.',
        'Using five-minute Dow language to run a daily position.',
      ],
      summary:
        'Dow answers which layer you stand on and which way you face; precise triggers stay with structure, volume-price and candles.',
    },
    {
      id: 'volume-price',
      name: 'Volume-price analysis',
      tag: 'Flow check',
      lede: 'Price says what happened; volume says how many agreed. Volume-price is the shared base under almost every school: breaks, springs, third waves, structural voids — without a volume story, the narrative should be demoted.',
      sections: [
        {
          title: 'Four quadrants: a shared vocabulary',
          body: [
            'Split price and volume into up/down and you get four basic reads. They are not automatic trade signals — they tag the bar or swing with a flow label, then location interprets it.',
            'Rise on rising volume: common demand-dominant picture, what you want on trend legs and real breaks. Rise on falling volume: thin fuel or reluctant sellers; near a long trend’s end or at resistance, false-break weight rises. Fall on rising volume: supply released, often with downside breaks — separate one-off panic from ongoing distribution. Fall on falling volume: selling pressure fading, common on healthy pullbacks; a long quiet grind can also mean no bid.',
          ],
          diagram: 'vp-quadrants',
          caption:
            'Quadrants are labels, not strategies: the same tag means different things at support and in empty air.',
        },
        {
          title: 'Valid breaks and retests',
          body: [
            'When you write “breakout” as an executable rule, volume-price is the easiest piece to objectify: close beyond resistance, clear expansion vs recent average volume, then a quiet retest that holds — the textbook valid break.',
            'A spike that snaps back, a break bar with flat volume, or a retest that expands straight back into the range raises false-break odds. On perps, open-interest change is a second check — not a replacement for relative volume.',
          ],
          points: [
            {
              label: 'Valid break',
              text: 'Close beyond + expansion + quiet retest that holds.',
            },
            {
              label: 'False-break smell',
              text: 'Long wick reclaim, ordinary volume, or an immediate expanding failure.',
            },
            {
              label: 'Relative volume',
              text: 'Compare to your own 20–50 bar average — not absolute size across symbols.',
            },
          ],
          diagram: 'vp-breakout',
          caption:
            'Expansion on the break, contraction on the retest: volume and structure confirm together, not a line touch alone.',
        },
        {
          title: 'Divergence: a warning, not a reverse order',
          body: [
            'Price at a higher high while volume or OBV cannot follow is a bearish-style warning; price at a lower low with shrinking volume may be exhaustion — or a liquidity drought. Always read with structural location.',
            'The safest use of divergence is: trim, tighten, stop pyramiding — not a full reverse while the trend structure is still intact. Trends can run a long way after divergence prints.',
          ],
          diagram: 'vp-divergence',
          caption:
            'Price HH, volume LH: cut risk first. Whether it reverses still depends on structure breaking.',
        },
      ],
      playbook: {
        title: 'Volume-price checklist',
        steps: [
          {
            label: 'Baseline',
            text: 'Show relative volume or an average on the pane — do not call “expansion” by feel.',
          },
          {
            label: 'Break rule',
            text: 'Entry conditions name a relative-volume hurdle; miss it and you only watch.',
          },
          {
            label: 'Pullback',
            text: 'Quiet pullbacks earn points; expansion through the pullback low voids the plan.',
          },
          {
            label: 'Divergence',
            text: 'Risk switch only — never the sole reason to open a trade.',
          },
        ],
      },
      pitfalls: [
        'Judging absolute volume without a recent average.',
        'Chasing quiet breaks as if they were mandatory.',
        'Equating divergence with an instant reversal.',
        'Ignoring location: “contraction” in empty space means little.',
      ],
      summary:
        'Volume-price answers whether anyone is coming along; without that story, structural breaks and candle triggers are demoted.',
    },
    {
      id: 'elliott',
      name: 'Elliott Wave',
      tag: 'Path narrative',
      lede: 'Elliott splits trends into a fractal “five-wave impulse + three-wave correction” and uses Fibonacci relations for retracements and extensions. It excels at scenario planning: keep a primary and an alternate count, switch when price invalidates — do not marry the labels.',
      sections: [
        {
          title: 'Impulse 1–5: rules before aesthetics',
          body: [
            'An impulse has five legs with the larger-degree trend. Common rules (variants exist; learn the trunk first): wave 2 does not retrace beyond wave 1’s start; wave 3 is often the longest and usually not the shortest impulse leg; wave 4 typically stays out of wave 1’s price territory.',
            'When counting, check rules before “does it look nice”. A count that breaks hard rules should be discarded, not rescued by ever-finer wiggles.',
          ],
          points: [
            {
              label: 'Wave 1',
              text: 'Often begins after old structure breaks; the crowd still doubts.',
            },
            {
              label: 'Wave 2',
              text: 'Deep retrace that holds the origin; volume often contracts.',
            },
            {
              label: 'Wave 3',
              text: 'Recognition flips; strongest advance; volume active.',
            },
            {
              label: 'Waves 4 / 5',
              text: 'Four is often complex; five may equal or extend, often with divergence.',
            },
          ],
          diagram: 'elliott-impulse',
          caption:
            'Satisfy “2 holds above 0, 4 stays clear of 1” before arguing about a pretty five.',
        },
        {
          title: 'Corrections A–B–C: same letters, different shapes',
          body: [
            'Corrections run against the primary trend; the basic form is three waves A–B–C. Zigzags are steeper and feel like a “real” fix; flats let B approach or exceed A’s origin and travel more sideways; complex combinations string simples together and invite over-labelling.',
            'The point of recognising a correction is to avoid calling a consolidation wave 1 of a new impulse and loading size the wrong way.',
          ],
          diagram: 'elliott-correction',
          caption:
            'Zigzag on the left, flat on the right — both A–B–C, different geometry and trade meaning.',
        },
        {
          title: 'Fibonacci: zones, not bullseyes',
          body: [
            'Waves 2 and 4 often react in the 38.2%–61.8% retracement band; waves 5 and C often use equality or a 1.618 extension as a target zone. Treat these as places where a reaction is more likely; on arrival, ask whether structure and volume are exhausting — do not hang a must-fill limit.',
            'Waves supply the narrative; Fibonacci grids supply location — the same ruler as on the indicators page, hung here on a degree hypothesis.',
          ],
          diagram: 'elliott-fib',
          caption:
            'Retracements and extensions mark bands, not ticks; invalidation still comes from structure and wave rules.',
        },
      ],
      playbook: {
        title: 'Elliott checklist',
        steps: [
          {
            label: 'Larger degree',
            text: 'Fix daily/weekly direction first, then count secondary waves on the execution timeframe.',
          },
          {
            label: 'Two counts',
            text: 'Write a primary and an alternate, each with its invalidation.',
          },
          {
            label: 'Targets',
            text: 'Fibonacci zones as take-profit scenarios — not mandatory fills.',
          },
          {
            label: 'Entries',
            text: 'Still fire from structure pullbacks + volume/candles; wave labels are not the only trigger.',
          },
        ],
      },
      pitfalls: [
        'Perfect hindsight counts and live labels that rewrite every pivot.',
        'Forcing fives by calling corrections impulses.',
        'Treating a wave target as a limit that must fill.',
        'Confident counts on several timeframes that cannot coexist.',
      ],
      summary:
        'Elliott is a scenario engine: primary + alternate + invalidation; entries still belong to structure and volume-price.',
    },
    {
      id: 'wyckoff',
      name: 'Wyckoff method',
      tag: 'Phase & intent',
      lede: 'Wyckoff reads ranges through a “composite operator”: accumulation → markup → distribution → markdown. It answers whether they are building or unloading, focusing on supply/demand tests (springs, upthrusts) and volume — not exact tops and bottoms.',
      sections: [
        {
          title: 'The full cycle: cause and effect in a loop',
          body: [
            'Wyckoff casts the tape as one repeating supply/demand play: after a decline, accumulation builds the “cause”; leaving the range into markup delivers the “effect”; a high range of distribution builds the opposite cause; markdown delivers it. The four phases chain — one cycle’s markdown often feeds the next accumulation.',
            'Ask first which phase you are in, then decide whether to trade range tests or trend pullbacks. Mis-labelling a continuation flag as a full accumulation/distribution usually means the phase was never identified. The figure below is the whole loop; the next three sections zoom accumulation, distribution and the spring.',
          ],
          points: [
            {
              label: 'Accumulation',
              text: 'Sideways building after a decline; spring and SOS often precede the leave.',
            },
            {
              label: 'Markup',
              text: 'Demand-led trend; pullbacks tend to quiet — the “effect”.',
            },
            {
              label: 'Distribution',
              text: 'High sideways unloading; upthrusts and SOW hint supply is winning.',
            },
            {
              label: 'Markdown',
              text: 'Supply-led trend until a new accumulation range forms again.',
            },
          ],
          diagram: 'wyckoff-cycle',
          caption:
            'One loop, four phases: accumulation (SC → spring → SOS) → markup → distribution (UT → SOW) → markdown. Ranges are cause; trends are effect.',
        },
        {
          title: 'Accumulation: from cause to effect',
          body: [
            'A sideways range after a decline may be accumulation. Teaching charts often show stopping action (SC), automatic rally, secondary test, a spring (false breakdown) then a sign of strength (SOS) that leaves the range into markup. Longer, better-turned ranges often precede larger trend “effects” — probabilistic, not guaranteed.',
            'Discipline: until a break and retest confirm, the range is only an accumulation hypothesis. Do not stamp every pause with a full five-phase textbook map.',
          ],
          diagram: 'wyckoff-accum',
          caption:
            'Only the leave after a spring promotes the accumulation hypothesis into a tradable markup phase.',
        },
        {
          title: 'Distribution: the mirror',
          body: [
            'High sideways after a primary advance may be distribution. Clues include preliminary supply, upthrusts (false breaks to new highs that fail), secondary supply tests, then a break into markdown. It mirrors accumulation with supply and demand swapped.',
            'Forcing “distribution” onto a with-trend flag is a common abuse — check whether the higher-timeframe trend is still intact first.',
          ],
          diagram: 'wyckoff-distrib',
          caption:
            'After a failed upthrust and a break of the range floor, the distribution hypothesis enters the execution phase.',
        },
        {
          title: 'The spring: intent on display',
          body: [
            'A spring is a false breakdown of range support: stops are run, supply is absorbed, price reclaims quickly — often with a panic expansion then demand on the reclaim. It is famous because intent shows up fast on the chart — it still needs a hold and follow-through volume.',
            'A quiet wick under support is usually noise. An upthrust is the spring’s mirror at the range ceiling.',
          ],
          points: [
            {
              label: 'Setup',
              text: 'A clear range already exists — not two arbitrary points joined by a line.',
            },
            {
              label: 'Trigger',
              text: 'False breach then reclaim back into the range or above mid.',
            },
            {
              label: 'Confirm',
              text: 'Retest is quiet and holds; otherwise the spring failed.',
            },
          ],
          diagram: 'wyckoff-spring',
          caption:
            'False break + reclaim + a volume story: a spring is a test, not an unconditional reversal signal.',
        },
      ],
      playbook: {
        title: 'Wyckoff checklist',
        steps: [
          {
            label: 'Box it',
            text: 'Only clear ranges get an accumulation/distribution hypothesis and written confirm conditions.',
          },
          {
            label: 'Wait for the test',
            text: 'Trade springs/upthrusts only near the drawn boundary.',
          },
          {
            label: 'Verify',
            text: 'After the leave, ask whether the retest is quiet and holds.',
          },
          {
            label: 'Abstain',
            text: 'Edges probe without a test or break — keep waiting; do not prepay the phase.',
          },
        ],
      },
      pitfalls: [
        'Drawing every pause as a textbook five-phase accumulation.',
        'Ignoring higher-timeframe trend and calling a bear-flag bottom accumulation.',
        'Replacing “did support hold?” with ornate letter labels.',
        'Calling a quiet wick a spring.',
      ],
      summary:
        'Wyckoff answers phase and intent; breaks and springs need volume agreement or they stay hypotheses.',
    },
    {
      id: 'structure',
      name: 'Market structure',
      tag: 'Default language',
      lede: 'State is the sequence of swing highs and lows: bullish (HH+HL), bearish (LH+LL), and transitions (BoS / ChoCH). It is the lowest common language of chart reading — other schools eventually ask whether structure changed.',
      sections: [
        {
          title: 'Trend structure: HH/HL and LH/LL',
          body: [
            'Bullish structure needs higher highs and higher lows; bearish structure mirrors that. Swing points must filter noise: timeframe decides what counts as a meaningful turn. Marking every wick on a tiny chart flips bias hourly.',
            'A with-trend breach of a prior high/low is often called BoS (break of structure) and confirms continuation; entries more often sit on the following HL/LH retest than on the tip of the break bar.',
          ],
          diagram: 'structure-trend',
          caption:
            'Clear HH/HL: bullish bias — hunt long triggers on HL retests.',
        },
        {
          title: 'Change of character: what to do after ChoCH',
          body: [
            'When price breaks a key swing against the prior trend (for example, under the last HL in a bull structure), that is ChoCH — a change-of-character warning. Bias may flip, but a new sequence is often incomplete.',
            'The usual response in transition: cut size, tighten or exit, wait for a new HH/HL or LH/LL — do not full-size reverse on the first break bar. A liquidity sweep (spike beyond then reclaim) should be tagged as a sweep, not a formal ChoCH.',
          ],
          diagram: 'structure-choch',
          caption:
            'Break of the prior HL: transition alert. Wait for a new sequence before building the reverse book.',
        },
        {
          title: 'Premium and discount: pick a half of the swing',
          body: [
            'Take a valid swing (low to high); equilibrium splits premium above from discount below. In an uptrend, pullbacks into discount fit “with the larger, against the smaller”; chasing in premium worsens payoff. Downtrends mirror that.',
            'This often overlaps Fibonacci’s midpoint, but the logic is structural balance, not mysticism. It turns entries from “click the green” into “only click in the favourable half”.',
          ],
          diagram: 'structure-value',
          caption:
            'In the same uptrend, a discount retest beats a premium chase.',
        },
      ],
      playbook: {
        title: 'Structure checklist',
        steps: [
          {
            label: 'Mark swings',
            text: 'On the execution timeframe, mark valid HH/HL or LH/LL and filter wicks.',
          },
          {
            label: 'Write bias',
            text: 'Sentence one of the plan: structural bias and the voiding swing.',
          },
          {
            label: 'Enter',
            text: 'Prefer retests; break chase needs volume and explicit plan permission.',
          },
          {
            label: 'Transition',
            text: 'After ChoCH, reduce and wait — do not prepay a full reverse trend.',
          },
        ],
      },
      pitfalls: [
        'Flipping HH/HL on a tiny timeframe until bias thrashes.',
        'Treating a liquidity sweep as a formal ChoCH.',
        'Reading only highs or only lows — half a structure.',
        'Speaking structure without drawing the invalidation, so you can “wait forever”.',
      ],
      summary:
        'Structure is the default language: bias, invalidation, retest zones; other theories translate back into it.',
    },
    {
      id: 'candlestick',
      name: 'Candlestick patterns',
      tag: 'Timing trigger',
      lede: 'Single bars and short combinations describe a brief auction: long wicks, engulfing, continuation pauses. They almost never form a system alone — only at support/resistance, structural turns or volume key levels do they act as entry, add or invalidation triggers.',
      sections: [
        {
          title: 'Reversal family: wicks and engulfing',
          body: [
            'Hammers and shooting stars emphasise long wicks — rejection below or above. Bullish/bearish engulfing emphasises a body that eats the prior bar’s body, a short-term hand-off of control. Strength is body size, wick length and whether volume agrees.',
            'A reversal pattern without location is noise. Draw the level or structural point first, then wait for the pattern — never the other way round.',
          ],
          diagram: 'candle-reversal',
          caption:
            'Hammer and engulfing earn the lesson at support; a shooting star needs resistance to be the mirror.',
        },
        {
          title: 'Continuation family: a pause inside the trend',
          body: [
            'Patterns such as the rising three methods describe a brief counter-trend cluster of small bodies inside a strong trend, then a directional bar that resumes. Reading them as reversals is a common misread.',
            'Their value is rhythm for adds or re-entries inside an existing structural trend — not a claim that the trend is over.',
          ],
          diagram: 'candle-continuation',
          caption:
            'The three small counter bars are a pause, not a reversal; the resume bar confirms continuation.',
        },
        {
          title: 'Location decides everything',
          body: [
            'The same bullish engulfing at a pre-drawn support or HL retest can be a trigger; in empty air it should be ignored. The figure locks that contrast — similarity of shape can be high while trade value is one-sided.',
            'Write invalidation ahead of time: for example, a close beyond the engulfing extreme voids the signal — you do not get “one more confirming bar”.',
          ],
          points: [
            {
              label: 'Valid trigger',
              text: 'Key level + complete pattern + non-contradictory volume, and the next bar does not erase it.',
            },
            {
              label: 'Ignore',
              text: 'Patterns in empty space, or pretty shapes against higher-timeframe structure.',
            },
            {
              label: 'Stop',
              text: 'Beyond the pattern extreme — not an arbitrary round number.',
            },
          ],
          diagram: 'candle-location',
          caption:
            'Support on the left, none on the right: the same engulfing only earns an entry discussion on the left.',
        },
      ],
      playbook: {
        title: 'Candlestick checklist',
        steps: [
          {
            label: 'Level first',
            text: 'Draw structure and key levels, then wait for patterns.',
          },
          {
            label: 'One evidence',
            text: 'Multiple patterns at one spot count once — no double scoring.',
          },
          {
            label: 'Write the void',
            text: 'Opposite close beyond the pattern extreme → exit; no “one more confirm”.',
          },
          {
            label: 'Matching degree',
            text: 'Trigger with execution-timeframe candles; do not let a lower-timeframe shape drive a higher-timeframe book.',
          },
        ],
      },
      pitfalls: [
        'Memorising dozens of names without binding them to location.',
        'Treating a tiny lower-timeframe engulfing as a higher-timeframe reversal.',
        'No invalidation rule after the pattern prints.',
        'Calling every long wick mid-trend a reversal.',
      ],
      summary:
        'Candles are triggers, not systems; if the location is wrong, a pretty pattern still does not open a trade.',
    },
  ],

  compare: {
    id: 'compare',
    label: 'Choosing',
    title: 'When schools overlap, pick deliberately',
    intro:
      'Several theories can describe the same stretch of tape. Use the tables to name a primary narrative in the plan and at most one veto.',
    tables: [
      {
        title: 'Direction: Dow vs structure vs Elliott',
        headers: ['Need', 'Better fit', 'Why'],
        rows: [
          [
            'A clear long/short bias only',
            'Market structure',
            'Few rules, executable, default daily language',
          ],
          [
            'Phase and long-horizon narrative',
            'Dow',
            'Degrees and mutual confirmation constrain big direction',
          ],
          [
            'Path and target-zone scenarios',
            'Elliott',
            'Strong at planning, expensive to maintain',
          ],
        ],
      },
      {
        title: 'Phase: Wyckoff vs volume-price vs candles',
        headers: ['Need', 'Better fit', 'Why'],
        rows: [
          [
            'Is the range building or unloading?',
            'Wyckoff',
            'Full phase and test (spring) vocabulary',
          ],
          [
            'Is this break real?',
            'Volume-price',
            'Direct hurdles you can write into conditions',
          ],
          [
            'Which bar fires the entry?',
            'Candlesticks',
            'Triggers only — they do not explain the phase',
          ],
        ],
      },
    ],
  },

  combine: {
    id: 'combine',
    label: 'With indicators',
    title: 'Theories narrate; indicators confirm',
    intro:
      'This page answers “what story is price telling?”; the indicators page answers “which rulers confirm and size risk?”. Keep the jobs apart so RSI overbought and “Elliott wave five” do not become two independent short reasons.',
    headers: ['Layer', 'Theory side', 'Indicator side', 'How they combine'],
    rows: [
      [
        'Bias',
        'Structure / Dow / Elliott primary count',
        'MA stack, ADX',
        'Theory sets long/short; indicators may agree or abstain',
      ],
      [
        'Check',
        'Volume-price, Wyckoff tests',
        'Relative volume, OBV, open interest',
        'Breaks and springs need volume agreement',
      ],
      [
        'Timing',
        'Candle triggers, structural pullbacks',
        'RSI back to mid, MACD histogram turn',
        'Oscillators only after location is right; never alone',
      ],
      [
        'Risk',
        'Structural invalidation (HL / LH break)',
        'ATR distance and size',
        'Void with structure; width with ATR',
      ],
    ],
    noteTitle: 'Combination discipline',
    noteItems: [
      'The plan names one primary theory narrative; a second theory at most says “if this appears, skip the trade”.',
      'Indicators do not upgrade into a second narrative — they have no waves or accumulation phases of their own.',
      'When price voids the narrative, change bias before you retune indicator parameters.',
    ],
  },

  related: {
    label: 'Next',
    href: '/indicators',
    text: 'Theories are the coordinate system; the concrete rulers — averages, RSI, Bollinger, ATR — and their chart readings live on the Indicators page. Recipes and sizing live on Discipline.',
    cta: 'Open technical indicators',
  },

  closing: {
    label: 'In one line',
    oneLiner:
      'Structure sets direction, volume checks it, patterns only trigger; learn many schools, keep one primary narrative in the plan.',
    chips: [
      'Structure first',
      'Volume confirms',
      'One narrative',
      'Waves are scenarios',
      'Wyckoff for phases',
      'Candles not alone',
      'Invalidate → switch',
    ],
    disclaimer:
      'Educational material, not investment advice. Theories summarise historical experience; they do not guarantee outcomes. Diagrams are schematic geometry, not live replays. Calibrate to your timeframe and the liquidity of what you trade.',
  },
}
