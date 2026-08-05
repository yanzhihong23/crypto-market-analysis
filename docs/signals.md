# Signals

What the board watches, how each reading decides it is unusual, and what has to
agree before a card is worth crossing the grid for.

中文版：[signals.zh.md](signals.zh.md) · Back to the [README](../README.md).

## The method

Every reading is measured against **its own recent history**, not against a fixed
band. "Normal" is per instrument and cannot be a constant: BTC's account ratio
lives around 2 while a small cap can sit under 1 for weeks, and a five-minute
move of one percent is a headline on the first and a quiet afternoon on the
second. One threshold would either scream on one or never fire on the other.

- **The bar is three sigma**, not the textbook two. These series trend rather
  than jitter around a fixed level, so the latest point sits far from its
  window's mean more often than a normal distribution predicts. Two sigma
  flagged 15% of the board; three flags about 3%, which is what "worth a look"
  should mean on a screen this dense.
- **A baseline needs 20 samples** and a non-zero spread. A window that never
  moved has nothing to be unusual against.
- **Readings that measure a change also carry an absolute floor.** A symbol that
  has barely moved for hours has a sigma small enough that one tick clears three
  of them. The floor is in whatever unit the change is quoted in.
- **Three readings use a fixed band instead of a baseline**, and each earns it by
  being a normalised quantity with a real zero: the basis, the liquidated share,
  and the compression test (which uses two of them). They are marked below.

## The ring

A card only draws its ring when readings from **two different families** are out
of range at once.

| Family        | Question it answers                                                 |
| ------------- | ------------------------------------------------------------------- |
| `price`       | What just happened to the quote, or what conspicuously has not.     |
| `flow`        | Whether anyone put anything behind it, and which side they were on. |
| `positioning` | What the book was holding, paying, and charging going in.           |

Two readings inside one family are usually one event described twice — a new 24h
high on a bar whose range has just expanded is a single move — so the families
deduplicate rather than accumulate.

Two exceptions:

- **Positioning counts twice within itself**, because what the crowd holds and
  what it pays to hold it are different measurements that disagree often, so
  their agreeing is an event. The two readings must come from **two different
  sources**, not merely two detectors: `ratio` and `divergence` share the crowd
  for a leg, and `funding` and `funding-shift` are one series asked two
  questions, so neither pair rings on its own.
- **`compression` never counts towards the bar.** A coil is by definition a card
  with nothing else going on, so letting it count would ring the quietest tenth
  of the board at all times. It is excluded from the count but kept in the
  reasons, so when the coil breaks the move rings the card and the two hours of
  winding up appear underneath it.

## The readings

### Price — what the quote did

| Signal        | Fires when                                                                                                            | Source                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `momentum`    | The 5m move is ≥3σ from this instrument's own 5m moves **and** ≥0.3%                                                  | Live tick buffer; baseline from 100×5m candles |
| `volatility`  | The last closed bar's range is ≥3σ above normal **and** ≥1.5× the mean range                                          | Session candles (15m)                          |
| `compression` | The last 2h ranged quieter than 90% of the 2h stretches in the series **and** ≤0.8× the middle stretch — _fixed band_ | 100×5m candles, uncut                          |
| `breakout`    | Price is at or through the 24h high or low, and the 24h range is ≥0.5% of price                                       | `tickers` feed                                 |
| `range-break` | Price is through the high or low of the last 30 closed daily bars, or failing that the last 7                         | Daily candles; see the backdrop below          |
| `rejection`   | A bar at least as wide as normal closed with ≥60% of its range as one wick                                            | Session candles (15m)                          |
| `strength`    | The move net of the board's median 5m move is ≥3σ **and** ≥0.3%                                                       | As `momentum`, minus the board median          |

`volatility` only ever reports an expansion, and `compression` only a
contraction — they are separate functions rather than one signed test because a
compression is not visible in any single bar and has to be measured over a
stretch. `compression` is also the only reading here that speaks _before_ the
event rather than during it.

`range-break` and `breakout` are the same shape with different memories, and
the longer one stands the shorter one down: a price at a monthly high is at a
daily high by construction, so carrying both would put "24h high · 30d high" in
the list where the second says everything the first does and more. They are one
family either way, so nothing about the ring turns on it.

### Flow — whether anyone was behind it

| Signal          | Fires when                                                                             | Source                                                             |
| --------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `volume`        | Bar volume is ≥3σ above normal **and** ≥1.5× the mean                                  | Session candles; the forming bar is extrapolated once ≥20% elapsed |
| `taker`         | The buy/sell split of market orders is ≥3σ from its own history **and** at least 57/43 | `taker-volume-contract`, 100×5m bars, polled every 5m              |
| `open-interest` | The 5m open interest move is ≥3σ **and** ≥0.15%                                        | `open-interest` feed, 5m buffer                                    |
| `liquidation`   | ≥0.05% of open interest was closed out by the exchange in 5m — _fixed band_            | `liquidation-orders` feed, 5m buffer                               |

`volume` says how much changed hands; `taker` says which side was crossing the
spread to make it happen. Before `taker` existed the side was being inferred
from what the price did next, which is the question rather than the answer.

`liquidation` is the only reading on the board that describes what was done _to_
people rather than what they chose. When it fires, `open-interest` drops the
inferred quadrant from its own sentence — the quadrant is a guess from two
numbers that each have other explanations, and a liquidation is the thing
itself. Below the reporting band the guess stays.

### Positioning — what the book was holding

| Signal          | Source group | Fires when                                                                          | Data                                                                  |
| --------------- | ------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `ratio`         | crowd        | The long/short account ratio is ≥3σ from its own recent range                       | `long-short-account-ratio` per coin, polled every 5m                  |
| `divergence`    | crowd        | The gap between elite positions and the crowd's accounts is ≥3σ from its own normal | Two contract-level ratio series, paired by timestamp, polled every 5m |
| `funding`       | funding      | The live funding rate is ≥3σ from its own settlement history                        | `funding-rate` feed; baseline from 100 settlements                    |
| `funding-shift` | funding      | The rate has moved ≥3σ **and** ≥1‱ since it was last charged                        | As above                                                              |
| `basis`         | basis        | The contract is ≥0.15% away from the spot index it settles against — _fixed band_   | `tickers` and `index-tickers` feeds                                   |
| `spread`        | spread       | The book is quoting ≥3σ wider than usual **and** ≥1.5× its own mean                 | Best bid/ask off the `tickers` feed, 30m rolling buffer               |

The divergence is a difference of logs, because these are ratios: a crowd at 2.0
against elites at 1.0 is the same disagreement as 1.0 against 0.5, and only in
logs does that come out as the same number. The level of the gap is per contract
and nowhere near zero — BTC sits around −0.47 and DOGE around −1.81 — so what
fires is the departure from _this contract's_ own gap.

`spread` reports a multiple rather than a sigma. A liquid book quotes exactly one
tick for hours, so nearly all of its measured variation is the mid drifting under
a fixed gap; the sigma test still gates it, but the number said out loud is what
a tick-quantised series can honestly say about itself.

## The backdrop

Every reading above answers a question about the last few minutes, and the
longest yardstick any of them is held to — bar the funding baseline — is eight
hours. That is a real blind spot: a coin three days into a slide has its own
decline built into what counts as normal for it.

A slower layer sits underneath, taken from a month and a week of daily bars and
a hundred days of open interest, refreshed hourly.

| Reading             | Says                                                                              |
| ------------------- | --------------------------------------------------------------------------------- |
| `range-position`    | Where the price sits between the month's low and high, and when it is near an end |
| `daily-coil`        | The last 3 days quieter than 90% of the 3-day stretches behind them, at ≤0.8×     |
| `vol-regime`        | The week's mean daily range against the month's, at ≥1.5× or ≤0.67×               |
| `oi-percentile`     | Open interest in the top or bottom tenth of its own 100 days                      |
| `funding-carry`     | A week's settlements summed, past ±40‱ — about 21% a year                         |
| `relative-strength` | The month's return, net of BTC **and** of the board's own excess, past ±20 points |

Two figures are reported at every level rather than only when unusual: where the
price sits in the month's range, and what it has done against BTC over the week
and the month. Both are always defined and neither has an honest threshold of
its own, so neither is a reading.

**These are not signals, and structurally cannot become one.** Each is true
continuously for days, so letting one into the ring rule would hand every
five-minute twitch a second family for free and light the whole board.
`compression` already ran into this and is held out by a list in `signals.ts`
that somebody has to maintain; the backdrop shares no type with `Signal`, so
there is nothing to remember. They are also not weighed against each other and
there is no score — `daily-coil` and a contracting `vol-regime` overlap and will
often speak together, which would matter if they were votes and does not because
they are sentences.

`range-break` is the one exception, and it earns it by being an event rather
than a state: the month's high is either being taken out or it is not.

Two of the five earn a fixed band rather than a baseline. `oi-percentile` is a
percentile by construction. `funding-carry` has no baseline available — a
hundred settlements is thirty-three days, so a series of weekly sums drawn from
it is five independent numbers — and a cost of carry as a share of notional is
already per instrument with a real zero, the way the basis is. Its band is set
where a crowded trade actually starts and not at what a calm week happens to
reach: measured over 29 instruments the whole board sat between −15.6 and
+19.2‱, median 9.1 in absolute terms, so it fires on none of them in a market
like that, deliberately.

`relative-strength` subtracts twice, and both subtractions are load-bearing.
Taking BTC out removes the one factor every instrument here moves on. Taking the
**board's own median excess** out removes the second: alts run ahead of or behind
BTC as a class for weeks, which is a fact about the market and not about any
symbol in it. Measured across 39 instruments the median excess over BTC was
−10.1 points — a symmetric band around zero would have flagged fourteen of them,
almost all laggards, and reported the alt market's drawdown as if it were news
about each one. Netted, the spread re-centres and ±20 flags 4 of 39.

This is the intraday `strength` reading at a horizon of a month, netted the same
way and for the same reason. It needs a board to have a middle, so below eight
watched symbols it stays quiet — the figure against BTC is still reported, since
only the reading claims the move is unusual. The benchmark is fetched whether or
not BTC is on the board: one that came and went with the watchlist would make the
same symbol's relative strength mean different things on different boards.

The backdrop reaches the screen as `range-break`, the second track under the
card's 24h range, the context line a fired alert carries, and the medium-term
panel on the detail dialog.

## Where each reading appears

| Surface                  | Carries                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Badge over the sparkline | The leading `price` reading: momentum, then range-break, breakout, strength, volatility, rejection, compression |
| Volume chip              | `volume`, `taker` — the taker split shows whenever it is known, not only when it fires                          |
| L/S chip                 | `ratio`, `divergence`                                                                                           |
| Funding chip             | `funding`, `funding-shift`, plus the settlement countdown near the hour                                         |
| Open interest chip       | `open-interest`, `liquidation`, plus the session flow quadrant                                                  |
| Card ring + alert list   | Every reading that is firing, ordered by family                                                                 |

`basis` and `spread` have no chip of their own. They reach the screen through the
ring and the alert list, which is deliberate: both are absent from almost every
card almost all of the time, and a fifth chip would wrap the row on every card on
the board to carry something that usually is not there.

## Cadence and cost

| Source                                                      | Cadence                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `tickers`, `open-interest`, `funding-rate`, `index-tickers` | Websocket, per instrument                                                            |
| `liquidation-orders`                                        | Websocket, **one subscription for every swap**, filtered to the watchlist on arrival |
| Candles                                                     | Polled every minute                                                                  |
| Account ratio, taker split, divergence                      | Polled every 5 minutes                                                               |
| Momentum baseline and coil                                  | Polled every 30 minutes, off one uncut 100×5m fetch                                  |
| Funding baseline and the week's carry                       | Refetched when older than 6 hours, off one 100-settlement fetch                      |
| Open interest session open                                  | Polled every 30 minutes                                                              |
| Backdrop: 300 daily candles, 100 days of open interest      | Polled hourly, first pass delayed 30s; the candles are dropped once reduced          |
| BTC's daily benchmark                                       | The same hourly walk, first and whether or not BTC is watched                        |

Statistics requests go through a limiter: one queue per path, 500ms between
requests to the same path, against an allowance of five per two seconds. It is
paced there rather than in each poller so that no caller can forget, and so a
statistics endpoint added later is paced without being told.

Candles do not go through it — that allowance is per statistics path and this is
not one of them — so the two pollers that walk the watchlist against
`/market/candles` each pace themselves one symbol at a time. The backdrop's
first pass waits half a minute rather than starting alongside the momentum
baseline's, which would double the rate on that path at a cold start. It
describes a month; it can wait.

## Known couplings

Measured, and left alone deliberately:

- **`momentum` and `strength`** share an input and a baseline, and co-fire on
  about 23% of firings. They are one family, so no ring turns on it, and
  `strength` decouples precisely when the whole board moves together and
  `momentum` stops being informative.
- **`funding` and `basis`** look like the same fact, since the funding rate is
  derived from the premium index. Measured across 29 instruments the correlation
  was −0.05: funding pins near its interest-rate floor in a calm market while the
  basis wanders on microstructure. They are treated as separate sources.
- **`spread` and `volatility`** are mechanically coupled — market makers widen
  quotes when volatility rises — and they sit in different families, so together
  they ring. There is no spread history endpoint to backtest this against, so it
  is an open question rather than a measured one.
