# PIPHAWK OS

**A multi-agent forex trading desk — live in the browser, wired for TradingView and Binance through n8n and LangFlow.**

`v2.4.1 · paper mode · 6 agents · 10 instruments`

PIPHAWK OS is a trading-desk operating surface for a multi-agent FX system. It renders the whole decision pipeline as a living console: signal agents reason over market data, a veto-wielding risk manager governs every ticket, and an execution agent routes approved orders toward a Binance bridge — with the plumbing (webhooks, retries, calendar guards, audit trail) owned by n8n, and the LLM reasoning loops hosted as a LangFlow graph.

Everything on screen is simulated with realistic tick behavior today. Every endpoint, payload shape and workflow name on the desk matches the integration playbook below, so going live is wiring — not redesign.

---

## What you get

- **Boot sequence** — cold-start kernel with scramble-decode title and subsystem checks.
- **Live ticker tape** — 10 instruments (FX, metals, crypto) streaming with tick-flash pricing.
- **Agent roster** — 6 specialized agents with load, heartbeat, task counters, and suspend/resume controls.
- **Orchestration canvas** — the full pipeline graph (ingest → reason → govern → execute) with animated signal flow and a node inspector that fires test pulses down the bus.
- **Event bus** — a streaming 48-slot ring buffer of agent activity, filterable by severity.
- **Market board** — sparkline trends, momentum bias, venue tagging, and pair focus.
- **Paper book** — open positions with live mark-to-market P/L and one-click close.
- **Risk console** — exposure, per-ticket risk, daily drawdown and correlation load vs. hard caps, plus an emergency kill switch.
- **Integration deck** — TradingView / Binance / n8n / LangFlow link states, latency, copy-ready endpoints and payload templates.
- **Strategy matrix** — armed strategies with win rate, profit factor and host agent.
- **Ambient chrome** — layered grid + noise + scanline atmosphere, scroll reveals, and full `prefers-reduced-motion` fallbacks.

---

## Architecture

```
                        ┌─────────────┐        ┌──────────────────────────┐
   TradingView ────────▶│  n8n bus    │───────▶│      PIPHAWK OS          │
   (alert webhooks)     │  :5678      │        │                          │
                        │             │        │  Signal Scout ─┐         │
   News wires ─────────▶│ wf_fx_ingest│        │  Sentiment   ──┼─▶ Risk  │──▶ approved
   (RSS poll schedule)  │ wf_fx_news  │        │  News Monitor ─┘  Manager│    tickets
                        │ wf_fx_      │        │        ▲                 │       │
                        │  handshake  │        │  LangFlow graph          │       ▼
                        └─────────────┘        │  (LLM scoring, RAG)      │  Execution
                                 │             └──────────────────────────┘  Agent
                                 │                        ▲                    │
                                 │                        │ research PRs       ▼
                                 │                 Quant Researcher      Binance bridge
                                 │                                        (testnet ⇄ live)
                                 └──────────── audit trail · telegram desk alerts
```

**The rule of the desk:** nothing reaches the bridge without a signed risk ticket. The Risk Manager enforces ≤1% equity risk per trade, correlation caps, and a 3% daily drawdown halt.

### The agent fleet

| Agent | Role | Model | Authority |
|---|---|---|---|
| Signal Scout | Breakout & momentum hunting across 28 pairs, M5–H4 | llama-3.1-70b | Emits candidates |
| Sentiment Analyst | COT deltas, retail ratios, options skew → tilt score | finbert-fx | Enriches candidates |
| News Monitor | Economic calendar & wire watch, vol guards | n8n RSS + LLM | Standdowns |
| Risk Manager | Sizing, vetoes, correlation & drawdown caps | qwen2.5-32b | **Veto authority** |
| Execution Agent | TWAP slicing, slippage guards, retries | deterministic | Routes to bridge |
| Quant Researcher | Overnight re-fits, proposes strategy changes | LangFlow RAG | Pull-requests only |

---

## Quick start

```bash
npm install
npm run dev        # local dev server on :3000
npm run build      # production bundle → dist/
npm run typecheck  # strict TS check
```

Node 18+, no environment variables required for the simulated desk.

### Project structure

```
├── index.html               # shell — non-blocking font loading, boot placeholder
├── src/
│   ├── main.tsx             # entry
│   ├── App.tsx              # desk composition + error boundary
│   ├── index.css            # design system: palette, type, panels, keyframes
│   ├── os/
│   │   ├── data.ts          # types, seeds, workflow graph, log generator, formatters
│   │   ├── icons.tsx        # hand-drawn inline SVG icon set
│   │   └── OSContext.tsx    # OS kernel: market sim, event bus, desk actions
│   └── components/
│       ├── Chrome.tsx       # boot overlay, ticker, header, reveals, footer terminal
│       ├── Agents.tsx       # agent roster
│       ├── Workflow.tsx     # orchestration canvas + node inspector
│       ├── Market.tsx       # market board + sparklines
│       ├── Ops.tsx          # event log, paper book, risk console, strategy matrix
│       └── Integrations.tsx # TradingView / Binance / n8n / LangFlow deck
└── README.md
```

---

## Integration playbook — going live

The simulated desk already speaks the real protocol shapes. Wire it up in this order.

### 1 · n8n — the bus (do this first)

n8n owns all plumbing: ingest, dedupe, retries, calendar guards, alerts, audit.

1. Self-host n8n (`docker run -it -p 5678:5678 n8nio/n8n`) and expose it over HTTPS.
2. Create **`wf_fx_ingest`**: `Webhook` → `Switch` (validate `symbol`/`action`) → `Dedupe` (5 min window) → `HTTP Request` to the OS agent bus (`POST /api/signals`) → `Postgres` audit row → `Telegram` desk alert.
3. Create **`wf_fx_news`**: `Schedule Trigger` (60 s) → `RSS Read` (Reuters, Bloomberg, FX calendar) → `HTTP Request` to LangFlow classification endpoint → conditional `HTTP Request` for vol-guard events.
4. Create **`wf_fx_handshake`**: `Webhook` → HMAC verify → link-state response. Used by the integration deck's *link bridge* buttons.

### 2 · TradingView — signal source

1. In your Pine strategy, open **Alerts → Create → Webhook URL** and paste the ingest endpoint shown in the deck:
   ```
   https://n8n.desk.piphawk.io/webhook/wf_fx_ingest
   ```
2. Use the payload template (copy-ready in the deck):
   ```json
   { "symbol": "{{ticker}}",
     "action": "{{strategy.order.action}}",
     "price": "{{close}}", "flow": "wf_fx_ingest" }
   ```
3. One alert per strategy; the n8n dedupe node absorbs duplicate fires.

### 3 · Binance — execution venue

1. Start on **testnet** (`testnet.binance.vision`) — the bridge ships paper-keyed.
2. The Execution Agent sends HMAC-signed REST orders and subscribes to `wss://stream.binance.com:9443/ws` for fills.
3. Routing today: BTCUSDT / ETHUSDT directly; FX pairs proxy through the paper book, with OANDA routing tagged for phase 2.
4. Slippage guard (0.1–0.9 pip), TWAP slicing (5 slices) and retry logic live in the execution agent, not the exchange adapter.

### 4 · LangFlow — agent graph

1. Host the **`fx_agent_graph`** flow (components listed in the deck: RAG corpus → LLM scorer → sentiment head → quant critic).
2. Point the flow endpoint at `https://langflow.desk.piphawk.io/api/v1/run/fx_agent_graph`.
3. n8n calls the graph for scoring/classification; the Quant Researcher submits parameter changes as pull-requests to the strategy matrix — never directly to the book.

### 5 · End-to-end smoke test

Use the orchestration canvas inspector: select any node and hit **run test pulse**. Each pulse corresponds to a real probe you can replay against the live stack (`[tv]` webhook parse, `[risk]` ticket re-validation, `[binance]` testnet ping).

---

## Paper mode → live mode checklist

The kill switch and risk caps are the only things that stand between the desk and real money. Do not skip steps.

- [ ] 30 days on Binance testnet with the live signal path (no manual overrides)
- [ ] `wf_fx_ingest` dedupe + validation tested against duplicate/replayed alerts
- [ ] Kill switch exercised against the live bridge (orders pull in <1 s)
- [ ] 3% daily drawdown halt verified end-to-end
- [ ] Live API keys in a secrets manager — never in client code; the browser desk talks to *your* gateway, never to exchange keys
- [ ] Position size caps re-validated by the Risk Manager on the live book

> **This project is an interface and simulation, not financial advice.** Trading leveraged FX is high-risk. Nothing here is a recommendation to trade, and paper-mode behavior is no guarantee of live performance.

---

## Configuration

| Variable (gateway side) | Purpose | Default |
|---|---|---|
| `N8N_WEBHOOK_BASE` | Public webhook base for `wf_fx_*` flows | `https://n8n.desk.piphawk.io` |
| `BINANCE_API_KEY` / `BINANCE_API_SECRET` | Bridge signing (server-side only) | testnet |
| `LANGFLOW_BASE_URL` | Agent graph host | `https://langflow.desk.piphawk.io` |
| `RISK_PER_TRADE_CAP` | Max equity risk per ticket | `1.00%` |
| `DAILY_DD_HALT` | Drawdown circuit breaker | `3.00%` |

The browser bundle ships with **zero secrets** — all of the above lives on the n8n/gateway tier.

---

## Design notes

- **Type system** — Chakra Petch (display) × IBM Plex Sans (body) × IBM Plex Mono (numerals/terminal), tabular figures throughout.
- **Palette** — deep navy ink with signal cyan, mint fills, rose draws, amber governance. Semantic color carries meaning: every hue tells you something about the desk.
- **Motion** — animated pipeline flow, tick-flash pricing, scramble decode, scanline sweep — all disabled cleanly under `prefers-reduced-motion`.
- **Resilience** — non-blocking font loading, in-root boot placeholder, and a React error boundary that renders a visible kernel-fault panel instead of a blank screen.

---

## Roadmap

- WebSocket replacement of the tick simulator (real feed behind the same `Pair` contract)
- Backtest runner panel fed by the Quant Researcher's overnight jobs
- Multi-desk view (one OS, several books) with cross-book correlation governance
- Replay mode: scrub the event bus like a tape

---

## License

MIT — use it, fork it, wire it up. The risk manager's veto is non-negotiable.
