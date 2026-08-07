# Vigil

**Perpetuals, watched.** A live board for perpetual futures — prices, positioning
and the readings that say when one of them has left its usual range.

The market has no bell, so the board is built to be left open: a card rings only
when two independent kinds of reading disagree with normal at the same time, and
an alert fires on the edge rather than on the state.

## Documentation

- **[Signals](docs/signals.md)** — what each of the sixteen readings measures,
  when it fires, and what has to agree before a card claims its ring.
  ([中文](docs/signals.zh.md))
- **[Trading discipline](docs/trading-discipline.md)** — chart-reading workflow,
  indicator combinations, and risk rules. Prefer the in-app page at `/discipline`.
  ([中文](docs/trading-discipline.zh.md))

## Running it

Node 24 and pnpm; both are pinned in `package.json`.

```bash
pnpm install
```

```bash
pnpm dev
```

No environment variables are needed — every source is a public exchange
endpoint.

| Script         | Does                                                          |
| -------------- | ------------------------------------------------------------- |
| `pnpm dev`     | Vite dev server, with the proxy the statistics endpoints need |
| `pnpm build`   | Typecheck, then build                                         |
| `pnpm preview` | Serve the build                                               |
| `pnpm lint`    | ESLint with `--fix`                                           |
| `pnpm docs`    | Reprint `docs/trading-discipline*.md` from the page's content |

Commits run Prettier and ESLint over the staged files, and the message is
checked against conventional-commit rules.

## What is on it

| Page          |                                                                   |
| ------------- | ----------------------------------------------------------------- |
| `/`           | OKX perpetuals — the watchlist, its signals and per-symbol charts |
| `/binance`    | Binance perpetuals                                                |
| `/charts`     | Symbol overview charts                                            |
| `/discipline` | Chart-reading tips and trading discipline                         |

The interface is available in English and Chinese, switched from the top bar.

## How the data arrives

Prices, open interest, funding rates, the spot index and exchange liquidations
all stream over one OKX websocket. Liquidations are the odd one out: a single
subscription carries every swap on the exchange and is filtered to the watchlist
on arrival, since the channel offers no per-instrument form.

Everything else is polled. Candles once a minute; the account ratio, the taker
split and the elite-versus-crowd gap every five minutes; the slower baselines
every half hour. The exchange's statistics endpoints serve no CORS header, so
they are bounced off this app's own origin — `vercel.json` in production and the
Vite proxy in development — and paced by a limiter, one queue per path.

[docs/signals.md](docs/signals.md) has the cadence table and the reasoning behind
each threshold.

## Stack

React 19 · TypeScript · Vite · MUI · Zustand · Recharts · react-router
