import type { IconName } from "./icons";

export type Level = "info" | "ok" | "warn" | "err";
export type Side = "LONG" | "SHORT";
export type AgentStatus = "active" | "idle" | "paused";

export interface Pair {
  sym: string;
  name: string;
  price: number;
  dayOpen: number;
  digits: number;
  vol: number; // relative drift per tick
  venue: "FX" | "CRYPTO" | "METALS";
  hist: number[];
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  icon: IconName;
  status: AgentStatus;
  load: number;
  tasks: number;
  hb: number; // heartbeat ms
  desc: string;
}

export interface LogEntry {
  id: number;
  ts: string;
  agent: string;
  level: Level;
  msg: string;
}

export interface Position {
  id: string;
  sym: string;
  side: Side;
  entry: number;
  units: number;
  opened: string;
}

export interface Strategy {
  id: string;
  name: string;
  pairs: string[];
  tf: string;
  winRate: number;
  pf: number;
  trades: number;
  enabled: boolean;
  agent: string;
}

export interface Integration {
  id: string;
  name: string;
  tag: string;
  linked: boolean;
  latency: number;
  desc: string;
}

export interface WFNode {
  id: string;
  label: string;
  sub: string;
  kind: "source" | "agent" | "risk" | "bridge";
  x: number;
  y: number;
  desc: string;
  endpoint: string;
}

export interface WFEdge {
  id: string;
  d: string;
  color: string;
}

/* ---------------- helpers ---------------- */

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function timeStr(d = new Date()): string {
  return d.toTimeString().slice(0, 8);
}

export function fmtPrice(pair: Pick<Pair, "digits">, p: number): string {
  return p.toFixed(pair.digits);
}

export function fmtMoney(v: number, digits = 2): string {
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function fmtPct(v: number, digits = 2): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;
}

/* ---------------- seed market ---------------- */

function seedPair(
  sym: string,
  name: string,
  base: number,
  digits: number,
  vol: number,
  venue: Pair["venue"],
): Pair {
  const hist: number[] = [];
  let p = base * (1 + rand(-0.004, 0.004));
  for (let i = 0; i < 42; i++) {
    p = p * (1 + (Math.random() - 0.5) * vol * 1.6);
    hist.push(p);
  }
  const dayOpen = hist[0];
  return { sym, name, price: hist[hist.length - 1], dayOpen, digits, vol, venue, hist };
}

export function seedPairs(): Pair[] {
  return [
    seedPair("EURUSD", "Euro / US Dollar", 1.0842, 5, 0.00032, "FX"),
    seedPair("GBPUSD", "Pound / US Dollar", 1.2718, 5, 0.00036, "FX"),
    seedPair("USDJPY", "Dollar / Yen", 151.42, 3, 0.00034, "FX"),
    seedPair("GBPJPY", "Pound / Yen", 192.56, 3, 0.00046, "FX"),
    seedPair("EURJPY", "Euro / Yen", 164.18, 3, 0.00038, "FX"),
    seedPair("AUDUSD", "Aussie / US Dollar", 0.6571, 5, 0.00038, "FX"),
    seedPair("USDCAD", "Dollar / Loonie", 1.3642, 5, 0.0003, "FX"),
    seedPair("XAUUSD", "Gold Spot", 2384.5, 2, 0.0007, "METALS"),
    seedPair("BTCUSDT", "Bitcoin / Tether", 67240, 1, 0.0012, "CRYPTO"),
    seedPair("ETHUSDT", "Ether / Tether", 3245.6, 2, 0.0014, "CRYPTO"),
  ];
}

/* ---------------- agents ---------------- */

export const seedAgents: Agent[] = [
  {
    id: "scout",
    name: "Signal Scout",
    role: "Breakout & momentum hunting",
    model: "llama-3.1-70b",
    icon: "radar",
    status: "active",
    load: 62,
    tasks: 1284,
    hb: 42,
    desc: "Scans 28 FX pairs across M5–H4 for range breaks, liquidity sweeps and momentum ignition. Emits candidate signals to the Risk Manager.",
  },
  {
    id: "sentiment",
    name: "Sentiment Analyst",
    role: "Positioning & flow tilt",
    model: "finbert-fx",
    icon: "wave",
    status: "active",
    load: 41,
    tasks: 862,
    hb: 65,
    desc: "Reads COT deltas, retail broker ratios and options skew to produce a directional tilt score per pair.",
  },
  {
    id: "news",
    name: "News Monitor",
    role: "Calendar & wire watch",
    model: "n8n rss + llm",
    icon: "globe",
    status: "active",
    load: 28,
    tasks: 447,
    hb: 51,
    desc: "Guards the economic calendar and newswires. Raises volatility guards and hard-standdowns around red-folder prints.",
  },
  {
    id: "risk",
    name: "Risk Manager",
    role: "Sizing, vetoes & caps",
    model: "qwen2.5-32b",
    icon: "shield",
    status: "active",
    load: 55,
    tasks: 1930,
    hb: 38,
    desc: "Veto-wielding governor. Sizes every candidate to ≤1% equity risk, enforces correlation and daily drawdown caps.",
  },
  {
    id: "exec",
    name: "Execution Agent",
    role: "Routing & fills",
    model: "deterministic",
    icon: "bolt",
    status: "active",
    load: 34,
    tasks: 356,
    hb: 24,
    desc: "Routes approved orders through the Binance bridge with TWAP slices, slippage guards and retry logic.",
  },
  {
    id: "quant",
    name: "Quant Researcher",
    role: "Overnight backtests",
    model: "langflow rag",
    icon: "candle",
    status: "idle",
    load: 0,
    tasks: 96,
    hb: 0,
    desc: "Re-fits strategy parameters on the overnight session and proposes changes via pull-request to the strategy matrix.",
  },
];

/* ---------------- workflow graph ---------------- */

export const wfNodes: WFNode[] = [
  { id: "tv", label: "TradingView", sub: "webhook ingest", kind: "source", x: 14, y: 44, desc: "Receives alert webhooks from TradingView strategies and normalizes them into OS signal events.", endpoint: "POST /hooks/tradingview" },
  { id: "newsfeed", label: "News Wires", sub: "n8n rss poll", kind: "source", x: 14, y: 236, desc: "n8n schedule polls Reuters/Bloomberg RSS + FX calendar and fans events out to the monitor agents.", endpoint: "n8n: wf_fx_news" },
  { id: "scout", label: "Signal Scout", sub: "llama-3.1-70b", kind: "agent", x: 216, y: 140, desc: "Scores incoming chart + flow evidence and emits breakout candidates with confidence and ATR context.", endpoint: "agent://scout/score" },
  { id: "sentiment", label: "Sentiment Agent", sub: "finbert-fx", kind: "agent", x: 216, y: 330, desc: "Attaches positioning tilt and crowding metrics to each candidate before risk review.", endpoint: "agent://sentiment/tilt" },
  { id: "risk", label: "Risk Manager", sub: "veto authority", kind: "risk", x: 428, y: 236, desc: "Sizes, caps or vetoes every candidate. Nothing reaches the bridge without a signed risk ticket.", endpoint: "agent://risk/approve" },
  { id: "exec", label: "Execution Agent", sub: "order router", kind: "agent", x: 630, y: 140, desc: "Slices approved tickets and routes them to the exchange bridge with slippage and retry guards.", endpoint: "agent://exec/route" },
  { id: "binance", label: "Binance Bridge", sub: "testnet ⇄ live", kind: "bridge", x: 630, y: 330, desc: "Signed REST/WS adapter for Binance. Paper mode on testnet today, one flag away from live keys.", endpoint: "wss://stream.binance.com" },
];

export const wfEdges: WFEdge[] = [
  { id: "e1", d: "M176 73 C 210 73, 186 156, 216 158", color: "#57c7ff" },
  { id: "e2", d: "M176 265 C 210 265, 186 186, 216 172", color: "#57c7ff" },
  { id: "e3", d: "M378 169 C 408 169, 398 250, 428 254", color: "#ffb454" },
  { id: "e4", d: "M378 348 C 412 348, 396 278, 428 270", color: "#ffb454" },
  { id: "e5", d: "M590 254 C 622 250, 596 172, 630 168", color: "#31d8a4" },
  { id: "e6", d: "M700 198 L 700 330", color: "#31d8a4" },
];

/* ---------------- seeds ---------------- */

export const seedPositions: Position[] = [
  { id: "p1", sym: "EURUSD", side: "LONG", entry: 1.0821, units: 60000, opened: "07:42:11" },
  { id: "p2", sym: "USDJPY", side: "SHORT", entry: 151.86, units: 40000, opened: "08:15:47" },
  { id: "p3", sym: "XAUUSD", side: "LONG", entry: 2371.2, units: 1200, opened: "09:03:29" },
];

export const seedStrategies: Strategy[] = [
  { id: "s1", name: "London Open Range", pairs: ["EURUSD", "GBPUSD"], tf: "M15", winRate: 58, pf: 1.72, trades: 412, enabled: true, agent: "scout" },
  { id: "s2", name: "Tokyo Mean-Revert", pairs: ["USDJPY"], tf: "M5", winRate: 64, pf: 1.41, trades: 688, enabled: true, agent: "scout" },
  { id: "s3", name: "Gold Momentum Ride", pairs: ["XAUUSD"], tf: "H1", winRate: 47, pf: 2.08, trades: 154, enabled: true, agent: "scout" },
  { id: "s4", name: "Carry Sweep", pairs: ["AUDUSD", "USDCAD"], tf: "H4", winRate: 52, pf: 1.26, trades: 97, enabled: false, agent: "quant" },
];

export const seedIntegrations: Integration[] = [
  { id: "tradingview", name: "TradingView", tag: "signal source", linked: true, latency: 84, desc: "Alert webhooks from pine strategies land on the n8n ingest endpoint and become OS signal events." },
  { id: "binance", name: "Binance", tag: "execution venue", linked: true, latency: 31, desc: "Fills for the FX-proxy book (BTC, ETH) today; OANDA-routed FX pairs tagged for the live phase." },
  { id: "n8n", name: "n8n", tag: "workflow bus", linked: true, latency: 12, desc: "Owns the plumbing: webhook ingest, retries, calendar guards, Telegram desk alerts and audit trail." },
  { id: "langflow", name: "LangFlow", tag: "agent graph", linked: false, latency: 0, desc: "Visual agent graph hosting the LLM reasoning loops — scoring, sentiment and the quant RAG researcher." },
];

/* ---------------- log generator ---------------- */

export function makeLogEntry(pairs: Pair[], agents: Agent[]): { agent: string; level: Level; msg: string } {
  const active = agents.filter((a) => a.status === "active");
  const pair = pick(pairs);
  const price = fmtPrice(pair, pair.price);
  const pips = rand(4, 42).toFixed(1);
  const templates: Array<{ agent: string; level: Level; msg: string }> = [];

  const has = (id: string) => active.some((a) => a.id === id);

  if (has("scout"))
    templates.push(
      { agent: "scout", level: "info", msg: `breakout candidate ${pair.sym} @ ${price} — ATR(14) ${pips} pips, queued for risk review` },
      { agent: "scout", level: "info", msg: `${pair.sym} swept ${pair.venue === "CRYPTO" ? "stop cluster" : "asian lows"} — momentum ignition score ${rand(61, 93).toFixed(0)}/100` },
      { agent: "scout", level: "warn", msg: `${pair.sym} fakeout risk — divergence on M15, candidate downgraded to WATCH` },
    );
  if (has("sentiment"))
    templates.push(
      { agent: "sentiment", level: "info", msg: `${pair.sym} tilt ${rand(-1, 1) > 0 ? "+" : ""}${rand(-0.9, 0.9).toFixed(2)} — retail ${rand(58, 81).toFixed(0)}% ${Math.random() > 0.5 ? "long" : "short"}, contrarian edge` },
      { agent: "sentiment", level: "info", msg: `COT delta refreshed — funds ${Math.random() > 0.5 ? "adding" : "trimming"} ${pair.sym.slice(0, 3)} exposure` },
    );
  if (has("news"))
    templates.push(
      { agent: "news", level: "warn", msg: `CPI print in ${Math.floor(rand(12, 58))}m — volatility guard raised on USD pairs` },
      { agent: "news", level: "info", msg: `BoJ speaker flagged ${rand(2, 9).toFixed(1)}σ headline risk — JPY standdown armed` },
    );
  if (has("risk"))
    templates.push(
      { agent: "risk", level: "ok", msg: `size check ${pair.sym}: ${rand(0.4, 1).toFixed(2)}% equity @ ${Math.floor(rand(18, 42))} pip stop — APPROVED` },
      { agent: "risk", level: "err", msg: `VETO ${pair.sym} — correlation cap with EURUSD book exceeded, candidate rejected` },
    );
  if (has("exec"))
    templates.push(
      { agent: "exec", level: "ok", msg: `filled ${Math.random() > 0.5 ? "BUY" : "SELL"} ${pair.sym} @ ${price} via bridge — slippage ${rand(0.1, 0.9).toFixed(1)} pip` },
      { agent: "exec", level: "info", msg: `TWAP slice 3/5 complete on ${pair.sym} — VWAP ${rand(-1.2, 1.2).toFixed(1)} pips vs mid` },
    );

  if (templates.length === 0)
    return { agent: "kernel", level: "warn", msg: "all agents standing down — desk in poll-only mode" };
  return pick(templates);
}
