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
| `rejection`   | A bar at least as wide as normal closed with ≥60% of its range as one wick                                            | Session candles (15m)                          |
| `strength`    | The move net of the board's median 5m move is ≥3σ **and** ≥0.3%                                                       | As `momentum`, minus the board median          |

`volatility` only ever reports an expansion, and `compression` only a
contraction — they are separate functions rather than one signed test because a
compression is not visible in any single bar and has to be measured over a
stretch. `compression` is also the only reading here that speaks _before_ the
event rather than during it.

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

## Where each reading appears

| Surface                  | Carries                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Badge over the sparkline | The leading `price` reading: momentum, then breakout, strength, volatility, rejection, compression |
| Volume chip              | `volume`, `taker` — the taker split shows whenever it is known, not only when it fires             |
| L/S chip                 | `ratio`, `divergence`                                                                              |
| Funding chip             | `funding`, `funding-shift`, plus the settlement countdown near the hour                            |
| Open interest chip       | `open-interest`, `liquidation`, plus the session flow quadrant                                     |
| Card ring + alert list   | Every reading that is firing, ordered by family                                                    |

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
| Funding baseline                                            | Refetched when older than 6 hours                                                    |
| Open interest session open                                  | Polled every 30 minutes                                                              |

Statistics requests go through a limiter: one queue per path, 500ms between
requests to the same path, against an allowance of five per two seconds. It is
paced there rather than in each poller so that no caller can forget, and so a
statistics endpoint added later is paced without being told.

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
