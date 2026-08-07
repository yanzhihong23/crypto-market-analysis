# Chart reading and trading discipline

A general framework for watching a board: structure sets direction, indicators confirm and filter, discipline governs size and behaviour.

**Best read in the app** at [`/discipline`](/discipline), which lays this out as cards with contents navigation. This file is generated from the same source for Git and offline reading — edit the content module, not this file.

Back to the [README](../README.md) · the board’s readings are described in [signals.md](signals.md).

## Contents

- [The core of it](#the-core-of-it)
- [Reading order](#how-to-read-the-board)
- [Price structure](#candles-and-structure)
- [Indicators](#what-each-indicator-actually-answers)
- [Recipes](#combinations-you-can-use-as-they-are)
- [What not to do](#combinations-to-avoid-and-what-to-reach-for-instead)
- [Market regime](#regime-first-then-strategy-then-indicators)
- [Margin and funding](#perpetuals-margin-liquidation-funding)
- [Leverage and symbols](#leverage-bands-and-choosing-what-to-trade)
- [Execution and exits](#execution-exits-and-adding)
- [Timing and events](#timing-and-events)
- [How it goes wrong](#the-usual-ways-it-goes-wrong)
- [Using Vigil](#working-with-the-vigil-board-optional-rules)
- [The rules](#trading-discipline)
- [Before entering](#checklist-before-you-enter)
- [Review and journal](#review-and-journal-template)

## The core of it

| Dimension                     | Guidance           |
| ----------------------------- | ------------------ |
| Reading order                 | Structure first    |
| Risk per trade (hard cap ~3%) | 1%–2%              |
| Bar to entry                  | Two sources        |
| Default state                 | Flat is a position |

> Indicators are different projections of the same price, and stacking more of the same kind does not raise your hit rate. A combination that works is trend/structure + momentum + volatility or volume, each answering a different question. The trap specific to perpetuals is treating leverage or margin used as "risk" — the real risk is what the account loses when the stop is hit. Crypto moves enough that a stop often needs 1%–3% of price to breathe, so the textbook "never more than 1%" tends to leave a position too small to be worth taking; fix the risk percentage instead, size back from ATR or the invalidation level, and set a separate daily loss limit (say 4%–6%) as the actual fuse.

## How to read the board

### 1. Fix the structure first

Daily and 4H give you trend, swing highs and lows, and the levels that matter; 15m–5m only time the entry. When the higher timeframe has no direction, the lower one is all noise.

### 2. Indicators confirm

Use moving averages and MACD to check you are with the trend, RSI or KD for exhaustion and divergence, Bollinger or ATR to size volatility and stop width — never to predict direction.

### 3. Volume and the book

Volume, VWAP and open interest answer whether anyone is behind the move. A breakout on no volume, or price up while open interest falls, is a fake until proven otherwise.

### 4. Wait for agreement

At least two independent kinds of evidence pointing the same way: a structural break plus volume, or a pullback to the moving average with RSI leaving oversold and the MACD histogram turning. One indicator lighting up is not enough.

## Candles and structure

| Subject                  | What to do                                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Timeframe alignment      | Only take trades with the higher timeframe. Against it, nothing more than a bounce or pullback scalp, at half size.                       |
| Levels first             | Prior highs and lows, round numbers, the daily and weekly open, high-volume nodes. No clear invalidation level means no trade.            |
| Spotting a fake break    | Thin volume on the break, a long wick rejecting it, no close holding above — treat it as a fake first.                                    |
| Expansion vs compression | The first high-volume candle out of a tight range carries the most information; chasing after a violent move rarely pays.                 |
| Wicks and closes         | Read the close against the body, not the intraday extreme. A long wick is a rejection; a close that holds is acceptance.                  |
| Relative strength        | Pick the leader or the laggard within a group: what stays strong while the market is weak is the better long, and the reverse for shorts. |

## What each indicator actually answers

Choose indicators by the role they play before arguing about parameters. Running two of the same kind — RSI and Stochastic, say — is close to counting the same evidence twice.

| Role                       | Usual tools                                                           | How to use it / how not to                                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trend and location         | MA / EMA (20·50·200), Ichimoku, VWAP                                  | Price above the averages with the averages stacked bullish leans long; take the pullback that holds. Do not use a moving average cross as your only entry.          |
| Momentum                   | MACD, RSI, ROC, Stochastic                                            | Read direction and divergence: a new price high the oscillator does not follow means momentum is fading. Do not fight overbought readings in the middle of a trend. |
| Volatility and channels    | Bollinger, Keltner, ATR, Donchian                                     | A break out of narrow bands often runs; ATR sets stop width. Do not chase a push through the band once the bands are already wide.                                  |
| Volume                     | Volume, OBV, VWAP, volume profile                                     | A breakout needs volume to confirm; a quiet pullback is healthy. Price and volume disagreeing is a warning.                                                         |
| Structural helpers         | Fibonacci retracement/extension, pivots, horizontal supply and demand | A retracement level carries more weight where it lands on a prior high or low. Fibonacci alone is not a system.                                                     |
| Perpetuals only (optional) | Funding, long/short ratio, open interest, basis                       | Extreme funding and crowded positioning are usually contrarian clues; price up with open interest up is what a new trend looks like.                                |

## Combinations you can use as they are

### Trend pullback (trending market)

- **Setup**: Price above EMA20/50 for longs, below for shorts, with the higher-timeframe MACD histogram on the same side.
- **Entry**: A pullback into EMA20 or the Bollinger midline, RSI turning up out of oversold without breaking the prior low.
- **Filter**: Volume drying up into the pullback and picking back up on the resumption; ATR normal, not blown out.
- **Invalidation**: A close below the moving average being tested, or below the prior swing low.

### Breakout continuation (after compression)

- **Setup**: Bollinger bandwidth or ATR near recent lows — volatility compressed.
- **Entry**: A close through the range, the Donchian channel or the prior high, on clearly expanded volume.
- **Confirmation**: The MACD histogram flipping the way of the break, or price holding the right side of VWAP or the broken average.
- **Invalidation**: A long wick through the level that closes back inside, or volume dying immediately after the break.

### Divergence reversal (range or late trend)

- **Setup**: The higher timeframe has gone sideways or the trend has flattened — not the middle of a one-way move.
- **Signal**: Price makes a new high or low that RSI or MACD does not follow.
- **Entry**: Wait for structure to confirm — a short-term trendline break or a reclaimed key candle — rather than entering the moment divergence appears.
- **Caution**: In a strong trend divergence can print several times in a row. Small size, tight stop.

### Mean reversion (range-bound market)

- **Setup**: Price oscillating in a defined range, averages tangled, ADX low, no clear trend.
- **Entry**: A touch of the Bollinger band or the range edge with RSI into overbought or oversold and a rejection candle.
- **Target**: The midline or the opposite edge. Do not run a range playbook on the trend day that follows a break.
- **Switch off**: The moment a close breaks the range on volume, stop thinking in reversion.

## Combinations to avoid, and what to reach for instead

| Practice                                            | Verdict                                                        | Better                                                                                    |
| --------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| RSI + Stochastic + CCI together                     | Weak: all three are momentum, closely correlated               | Keep one momentum reading, add trend and volume                                           |
| Entering on a MACD cross alone                      | Weak: it lags, and a range market prints false ones repeatedly | The cross plus the right side of a key average plus a structural level                    |
| Treating the Bollinger bands as buy and sell points | Weak: a trend walks the band for a long time                   | Decide trend or range first, then decide whether a band touch is reversal or continuation |
| Retuning parameters every day                       | Weak: overfitting to the last few sessions                     | Fix a small set of parameters and filter with timeframe and structure                     |
| Fighting the higher timeframe with a lower one      | Weak: usually costs you both hit rate and payoff               | Higher timeframe for direction, lower one only for the entry                              |

### A set that is enough

- Main chart: EMA20 + EMA50 (or VWAP) + volume
- Sub chart: MACD or RSI, one of the two
- Volatility: ATR, for the stop
- Occasional: Bollinger when you need to see compression or expansion
- Perpetuals: open interest and funding as filters on top

## Regime first, then strategy, then indicators

The same indicators perform very differently across regimes. Work out what kind of market you are in before deciding whether to trade trend, breakout or reversion.

| Regime             | How to recognise it                                                                                 | Suits                                                        | Avoid                                          |
| ------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| Trend              | Higher highs or lower lows, price holding one side of the averages, ADX elevated or bands expanding | Trend pullbacks, breakout continuation, trailing stops       | Picking tops and bottoms, mean reversion       |
| Range              | Clear boundaries, tangled averages, frequent fake breaks                                            | Fading the edges, small size in and out                      | Chasing breakouts, sitting through a wide stop |
| Chop               | Long wicks both ways, direction reversing, volume confirming nothing                                | Flat, or a token position                                    | Anything that needs a clean trend              |
| Extreme volatility | ATR spiking, liquidation cascades, spreads widening, wicks                                          | Cutting size, managing what you already hold, waiting it out | Opening size, moving stops further away        |

## Perpetuals: margin, liquidation, funding

### Margin mode

- Isolated caps the worst case at the margin in that position — right for testing an idea and for trades you are unsure of.
- Cross shares the account balance and rides out more noise, but one position out of control can take the account with it. Start on isolated.
- Work out the liquidation price before you enter: it should sit well beyond the invalidation level, not just past the stop.

### Funding

- Funding is a cost of carry, not a direction signal. Extreme funding says one side is crowded, and crowded can last a long time.
- If the plan holds through a settlement, put the expected funding into the payoff. If it eats more R than the trade is worth, do not hold overnight.
- Funding, basis and the long/short ratio all extreme the same way reads as a squeeze setup, not as a reason to chase.

## Leverage bands and choosing what to trade

| Band   | Roughly for                                                  | Watch out                                                                                           |
| ------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 2–5×   | Learning, testing, wider daily and 4H structures             | Where most people should spend most of their time. Low leverage is not low risk — still size by R   |
| 5–10×  | Short-term trades on liquid majors with a close invalidation | The stop has to be mechanical; slippage and wicks eat the buffer fast                               |
| 10–20× | Little more than a bet on the next tick                      | Negative expectancy unless the stop is very close and the size very small. Off the table day to day |
| 20×+   | Casino                                                       | One noise stop-out damages the account and your head. Nothing to do with a trading system           |

| Tier                | How to choose                                       | Sizing                                                                 |
| ------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| Majors (BTC/ETH)    | Tight spreads, real depth, behaviour that repeats   | Fine as the default. Count correlated positions as one risk            |
| Large-cap alts      | Correlated to BTC but with more beta                | Smaller than BTC. More fake breaks, so raise the bar for confirmation  |
| Illiquid small caps | Easy to stop-hunt, easy to wick, easy to manipulate | Skip by default. If you must: isolated, tiny R, nothing held overnight |

## Execution, exits and adding

| Subject         | What to do                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stop order type | Stop-market when it is moving fast, because getting out is the point; stop-limit is fine in good liquidity if you accept it may not fill.                  |
| Expect slippage | On wicks, liquidation cascades and data releases the fill can be some way from the chart. Leave room for it in the size.                                   |
| Scaling out     | Take 30%–50% at the first target and move the stop to break-even; trail the rest by structure. Do not hold everything waiting for a perfect top.           |
| Adding          | Pyramid only into profit, and only when the new tranche has its own invalidation. Never average down a loser — that is swapping a bigger risk for a guess. |
| Minimum payoff  | Do the arithmetic before entering: if the stop is 1R, the target should be at least 1.5R–2R, otherwise the hit rate has to be extraordinary.               |
| Expectancy      | Hit rate × average win − loss rate × average loss has to be positive to survive. Recording money instead of R hides a system that is decaying.             |

## Timing and events

| Window                                  | What to watch                                                                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Around funding settlement               | Volatility tends to pick up, and when funding is extreme, watch for forced closes and fake breaks. With no clear edge, stay out for 15–30 minutes either side. |
| Macro data (CPI, FOMC)                  | Spreads and slippage get worse and invalidation levels get swept. Cut size beforehand, or only manage what you hold.                                           |
| Weekends and holidays                   | Liquidity thins, fake breaks and wicks multiply. Half size, or raise the bar for entry.                                                                        |
| Listings, maintenance, on-chain trouble | Exchange notices, suspended deposits and withdrawals, contracts being delisted — when in doubt, open nothing.                                                  |

## The usual ways it goes wrong

| Situation                               | Why it costs you                                                      | How to stop it                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Widening the stop past invalidation     | "A little more room" means the risk on the trade is no longer defined | Fix R first, then the stop. Move the stop and you have to resize                                  |
| Sizing up right after a big win         | Excitement inflates the position and one giveback costs a week        | The next trade after a big win goes back to standard size. No raising risk again that day         |
| Switching symbols after a losing streak | Revenge in a different market — no edge, just a different table       | A losing streak ends the session. Changing symbol does not count as a break                       |
| Right on direction, stopped out anyway  | The direction was fine but the size or leverage was not               | Direction and size are two decisions. Leverage serves the invalidation level, not your confidence |
| Treating open profit as realised        | Sizing up on unrealised gains, then falling apart on the drawdown     | Only a closed trade is a win. Open profit does not join the balance you size the next one from    |
| Chasing a liquidation cascade           | Liquidation-driven moves end quickly and you take the last of it      | Cascades can be scalped; do not mistake one for the start of a trend                              |

## Working with the Vigil board (optional rules)

The board is a noise filter, not a signal generator. Written into the rules it is steadier than clicking whatever card catches your eye.

| Rule                               | How to apply it                                                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Two families before a new position | A price reading and a flow or positioning reading both firing is what puts a symbol on the shortlist. A single 3σ is something to watch.      |
| A ring is not a market order       | After the ring you still wait for the level and the invalidation. Find the pullback on a lower timeframe rather than chasing the last candle. |
| Compression on its own             | Records that a symbol is coiling; it is not a reason to enter. Judge the move that breaks the coil.                                           |
| Liquidations and extreme funding   | Filters or contrarian clues, never trend confirmation. With funding extreme, cut size or shorten the hold.                                    |
| Watchlist breadth                  | Strength only computes with 8 or more symbols on the board; below that relative strength is distorted, so do not size up on it.               |

What each reading is for. The names on the left are the ones in signals.md; on the right is where the reading belongs in a trade. Most of them are filters or timing — very few can be read as direction.

| Reading                 | Use it as                                                                                 | Do not use it as                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| momentum                | A nudge: this symbol just moved, worth pulling up the chart                               | An entry — five minutes of deviation says nothing about how long it lasts          |
| volatility              | An input to stop width: wider ranges mean smaller size                                    | Trend confirmation. It reports expansion, not direction                            |
| compression             | A watchlist: coils often precede a run, so mark the levels now                            | A reason to enter. A coil can hold for a long time                                 |
| breakout / range-break  | Structural evidence, and the trigger for the breakout recipe when volume agrees           | Something to chase without volume — treat it as a fake first                       |
| rejection               | Evidence for an invalidation level: the rejected end can anchor the stop                  | A reversal on its own. One candle is not a turn                                    |
| strength                | Symbol selection: when long either way, take the one still strong net of the board        | Anything, with fewer than 8 symbols on the watchlist                               |
| volume                  | The confirming layer. Breakouts and reversals both need it to sign off                    | A direction. Volume alone says only that it changed hands                          |
| taker                   | One of the harder pieces of directional evidence: who is crossing the spread              | A reason to chase into a spike, where extreme readings cluster                     |
| open-interest           | Telling new money from closing: price up with open interest up is what a trend looks like | A trend start when price is up and open interest is down — that is shorts covering |
| liquidation             | A risk switch: cut leverage and widen expected slippage during a cascade                  | Trend confirmation, ever. Cascades end fast                                        |
| ratio / divergence      | Crowding: raise the bar for confirmation, or look the other way, when one side is packed  | Timing. Crowding can persist for weeks                                             |
| funding / funding-shift | Cost of carry and crowding: price it into the payoff before holding through settlement    | A direction signal                                                                 |
| basis                   | Spot and perpetual disagreeing — at the extremes, one-sided sentiment in the contract     | A trade on its own. Basis converges on no schedule                                 |
| spread                  | The cost light: a wider spread means getting in and out costs more right now              | A moment to open anything new                                                      |

## Trading discipline

### Size and risk

- Risk = stop distance × position ÷ equity. Not leverage, and not how much margin is tied up.
- On perpetuals 1%–2% per trade is normal, with a hard cap near 3%. The textbook "never more than 1%" often leaves a position too small to be worth taking.
- Set stop width from structure or 1.5–2×ATR and size back from it. Deciding how big you want to be and then fitting a stop around it is the usual road to liquidation.
- Down 4%–6% on the day, or three losses in a row, ends the session. Correlated positions on the same side (BTC+ETH) count as one risk.

### Entries and exits

- Write the plan first: regime, trigger, invalidation, target, size.
- The stop is part of the entry. No invalidation level means no trade.
- Move the stop to protect profit; do not put off the exit indefinitely because an indicator has not rolled over yet.

### Behaviour

- Never: revenge trades, averaging down, an unplanned feeling that it is going up.
- Never: full size into data releases, listings or maintenance windows.
- Flat is allowed. With no structure and no agreement, watching is not an obligation to trade.

## Checklist before you enter

- [ ] **Regime**: Trend or range right now? Does the strategy match it?
- [ ] **Higher timeframe**: Do the daily and 4H support this direction?
- [ ] **Structure and invalidation**: Where is the level? At what price are you wrong?
- [ ] **Agreement**: Do at least two of trend, momentum and volume point the same way?
- [ ] **Sizing**: Have you divided the risk amount by the stop distance (ATR will do)?
- [ ] **Liquidation price**: Isolated or cross, does liquidation sit well beyond invalidation?
- [ ] **Holding period**: If it crosses a funding settlement, is the trade still worth the cost?
- [ ] **Event window**: Anything in the next hour — data, maintenance, a volatility spike?
- [ ] **Board check**: On Vigil: two signal families, or one reading of noise?
- [ ] **State of mind**: Just lost, short of sleep, elated after a win, in a hurry to make it back? Then skip it.

### Position sizer

Fix the risk, then let the stop distance give you the size. The other order round is the road to liquidation.

```
Amount at risk = equity × risk%; position = amount at risk ÷ |entry − stop|; notional = position × entry; leverage needed = notional ÷ equity.
```

Leverage needed is the minimum this position requires, not a recommendation — the higher it is, the closer the stop sits and the less a wick has to do to reach it. Fees and funding are not in these numbers.

## Review and journal template

| Dimension            | What to record                                                                          |
| -------------------- | --------------------------------------------------------------------------------------- |
| Plan adherence       | In and out as planned? Any rule changed mid-trade?                                      |
| Process quality      | The result is secondary; a profit that broke the rules is still a bad trade.            |
| R multiple           | How many R did it make or lose? Counting in R shows decay that counting in money hides. |
| Redundant indicators | Which confirmation did work? Which one was repeating the same thing?                    |
| Reusable             | Can the trigger be written down as a fixed recipe?                                      |
| Emotion              | Where did fear or greed show up? How do you catch it next time?                         |

### The minimum a trade should record

| Field                     | Example                                                     |
| ------------------------- | ----------------------------------------------------------- |
| Symbol / side / timeframe | BTCUSDT · long · 15m execution on 4H structure              |
| Regime                    | Trend / range / chop / extreme volatility                   |
| Trigger and invalidation  | Pullback to EMA20; stop on a close below the prior low      |
| Planned R                 | 1.5% of equity at risk; 2R target, remainder trailed        |
| Actual fills and slippage | Entry, exit, whether it was swept                           |
| Result (R)                | +1.8R or −1R                                                |
| Discipline tag            | To plan / cut early / stop moved / revenge / averaged down  |
| Screenshots               | One before and one after; review the chart, not your memory |

## In one line

> Structure sets direction, indicators agree or you pass; only trade a plan that has an invalidation level.

No plan, no order · No stop, no position · No stacked duplicates · Never average down · Never revenge · Name the regime first · Flat is a position

---

General trading practice, not investment advice. Parameters and timeframes need calibrating to what you trade.
