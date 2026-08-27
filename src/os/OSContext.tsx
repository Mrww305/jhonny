import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Agent,
  Integration,
  Level,
  LogEntry,
  Pair,
  Position,
  Strategy,
  clamp,
  fmtPrice,
  makeLogEntry,
  pick,
  seedAgents,
  seedIntegrations,
  seedPairs,
  seedPositions,
  seedStrategies,
  timeStr,
} from "./data";

export interface OS {
  pairs: Pair[];
  agents: Agent[];
  logs: LogEntry[];
  positions: Position[];
  strategies: Strategy[];
  integrations: Integration[];
  selected: string;
  selectedNode: string | null;
  halted: boolean;
  realized: number;
  equity: number;
  upl: number;
  tick: number;
  pairBySym: (s: string) => Pair | undefined;
  selectPair: (s: string) => void;
  selectNode: (id: string | null) => void;
  toggleAgent: (id: string) => void;
  toggleHalt: () => void;
  closePosition: (id: string) => void;
  toggleStrategy: (id: string) => void;
  toggleIntegration: (id: string) => void;
  testNode: (id: string) => void;
  pushLog: (agent: string, level: Level, msg: string) => void;
}

const Ctx = createContext<OS | null>(null);

export function useOS(): OS {
  const c = useContext(Ctx);
  if (!c) throw new Error("useOS outside provider");
  return c;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

export function useNow(interval = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = window.setInterval(() => setNow(new Date()), interval);
    return () => window.clearInterval(iv);
  }, [interval]);
  return now;
}

const BASE_EQUITY = 100000;

export function OSProvider({ children }: { children: React.ReactNode }) {
  const [pairs, setPairs] = useState<Pair[]>(seedPairs);
  const [agents, setAgents] = useState<Agent[]>(seedAgents);
  const [positions, setPositions] = useState<Position[]>(seedPositions);
  const [strategies, setStrategies] = useState<Strategy[]>(seedStrategies);
  const [integrations, setIntegrations] = useState<Integration[]>(seedIntegrations);
  const [selected, setSelected] = useState("EURUSD");
  const [selectedNode, setSelectedNode] = useState<string | null>("risk");
  const [halted, setHalted] = useState(false);
  const [realized, setRealized] = useState(0);
  const [tick, setTick] = useState(0);

  const logId = useRef(100);
  const [logs, setLogs] = useState<LogEntry[]>(() => [
    { id: 3, ts: timeStr(), agent: "kernel", level: "ok", msg: "desk online — 6 agents registered, paper mode engaged" },
    { id: 2, ts: timeStr(), agent: "n8n", level: "info", msg: "webhook bridge wf_fx_ingest listening on :5678" },
    { id: 1, ts: timeStr(), agent: "exec", level: "info", msg: "Binance testnet ws connected — latency 31ms" },
  ]);

  const pairsRef = useRef(pairs);
  const agentsRef = useRef(agents);
  const haltedRef = useRef(halted);
  pairsRef.current = pairs;
  agentsRef.current = agents;
  haltedRef.current = halted;

  const pushLog = useCallback((agent: string, level: Level, msg: string) => {
    setLogs((prev) => [{ id: ++logId.current, ts: timeStr(), agent, level, msg }, ...prev].slice(0, 48));
  }, []);

  /* ---- market heartbeat ---- */
  useEffect(() => {
    const iv = window.setInterval(() => {
      setTick((t) => t + 1);
      setPairs((prev) =>
        prev.map((p) => {
          const shock = Math.random() < 0.03 ? 3 : 1;
          const next = p.price * (1 + (Math.random() - 0.5) * p.vol * 2 * shock);
          const hist = [...p.hist.slice(-41), next];
          return { ...p, price: next, hist };
        }),
      );
      if (!haltedRef.current) {
        setAgents((prev) =>
          prev.map((a) =>
            a.status === "active"
              ? { ...a, load: clamp(a.load + (Math.random() - 0.5) * 14, 8, 96), tasks: a.tasks + Math.floor(Math.random() * 4), hb: Math.round(clamp(a.hb + (Math.random() - 0.5) * 8, 18, 90)) }
              : a,
          ),
        );
      }
    }, 1400);
    return () => window.clearInterval(iv);
  }, []);

  /* ---- event bus ---- */
  useEffect(() => {
    const iv = window.setInterval(() => {
      if (haltedRef.current) {
        if (Math.random() < 0.5) pushLog("kernel", "warn", "kill switch engaged — order flow suspended, market poll continues");
        return;
      }
      const entry = makeLogEntry(pairsRef.current, agentsRef.current);
      pushLog(entry.agent, entry.level, entry.msg);
    }, 2800);
    return () => window.clearInterval(iv);
  }, [pushLog]);

  const pairBySym = useCallback((s: string) => pairs.find((p) => p.sym === s), [pairs]);

  const toggleAgent = useCallback(
    (id: string) => {
      setAgents((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const next: Agent["status"] = a.status === "paused" ? "active" : "paused";
          pushLog(a.id, next === "active" ? "ok" : "warn", `${a.name} ${next === "active" ? "resumed — reconnecting to event bus" : "suspended by operator"}`);
          return { ...a, status: next, load: next === "active" ? a.load || 20 : 0, hb: next === "active" ? 40 : 0 };
        }),
      );
    },
    [pushLog],
  );

  const toggleHalt = useCallback(() => {
    setHalted((prev) => {
      const next = !prev;
      if (next) {
        setAgents((as) => as.map((a) => (a.id === "exec" ? { ...a, status: "paused", load: 0, hb: 0 } : a)));
        pushLog("kernel", "err", "KILL SWITCH — execution suspended, open orders pulled from bridge");
      } else {
        setAgents((as) => as.map((a) => (a.id === "exec" ? { ...a, status: "active", load: 30, hb: 26 } : a)));
        pushLog("kernel", "ok", "desk re-armed — execution agent back on the bus");
      }
      return next;
    });
  }, [pushLog]);

  const upl = useMemo(
    () =>
      positions.reduce((sum, pos) => {
        const p = pairs.find((x) => x.sym === pos.sym);
        if (!p) return sum;
        const dir = pos.side === "LONG" ? 1 : -1;
        const raw = (p.price - pos.entry) * pos.units * dir;
        return sum + (pos.sym.includes("JPY") ? raw / p.price : raw);
      }, 0),
    [positions, pairs],
  );

  const closePosition = useCallback(
    (id: string) => {
      const pos = positions.find((p) => p.id === id);
      const pair = pos ? pairs.find((p) => p.sym === pos.sym) : undefined;
      if (!pos || !pair) return;
      const dir = pos.side === "LONG" ? 1 : -1;
      const raw = (pair.price - pos.entry) * pos.units * dir;
      const pnl = pos.sym.includes("JPY") ? raw / pair.price : raw;
      setRealized((r) => r + pnl);
      setPositions((prev) => prev.filter((p) => p.id !== id));
      pushLog("exec", pnl >= 0 ? "ok" : "warn", `closed ${pos.side} ${pos.sym} @ ${fmtPrice(pair, pair.price)} — realized ${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toFixed(2)}`);
    },
    [positions, pairs, pushLog],
  );

  const toggleStrategy = useCallback(
    (id: string) => {
      setStrategies((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          pushLog("scout", s.enabled ? "warn" : "ok", `strategy "${s.name}" ${s.enabled ? "disarmed" : "armed"} on ${s.pairs.join(", ")} ${s.tf}`);
          return { ...s, enabled: !s.enabled };
        }),
      );
    },
    [pushLog],
  );

  const toggleIntegration = useCallback(
    (id: string) => {
      setIntegrations((prev) =>
        prev.map((i) => {
          if (i.id !== id) return i;
          const linked = !i.linked;
          pushLog("n8n", linked ? "ok" : "warn", `${i.name} bridge ${linked ? "linked — handshake verified via n8n wf_fx_handshake" : "unlinked by operator"}`);
          return { ...i, linked, latency: linked ? Math.round(10 + Math.random() * 60) : 0 };
        }),
      );
    },
    [pushLog],
  );

  const testNode = useCallback(
    (id: string) => {
      const msgs: Record<string, string> = {
        tv: "test alert ingested — {symbol: EURUSD, action: buy} parsed in 4ms",
        newsfeed: "n8n poll fired — 3 headlines classified, 0 red-folder",
        scout: "dry-run score on " + pick(pairsRef.current).sym + " returned in 412ms",
        sentiment: "tilt vector recomputed — 10 pairs refreshed",
        risk: "ticket #4821 re-validated — 0.8% risk, within caps",
        exec: "order sandbox OK — bridge ack in 28ms",
        binance: "ping Binance testnet — pong 31ms, depth healthy",
      };
      pushLog("kernel", "info", `[${id}] ${msgs[id] ?? "node pinged"}`);
    },
    [pushLog],
  );

  const value: OS = {
    pairs,
    agents,
    logs,
    positions,
    strategies,
    integrations,
    selected,
    selectedNode,
    halted,
    realized,
    upl,
    equity: BASE_EQUITY + realized + upl,
    tick,
    pairBySym,
    selectPair: setSelected,
    selectNode: setSelectedNode,
    toggleAgent,
    toggleHalt,
    closePosition,
    toggleStrategy,
    toggleIntegration,
    testNode,
    pushLog,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
