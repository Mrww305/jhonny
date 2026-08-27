import React, { useMemo, useState } from "react";
import { Level, fmtMoney, fmtPrice } from "../os/data";
import { Icon } from "../os/icons";
import { useOS } from "../os/OSContext";

/* ---------------- event log ---------------- */

const LEVEL_COLOR: Record<Level, string> = {
  info: "text-cy",
  ok: "text-up",
  warn: "text-warn",
  err: "text-dn",
};

export function EventLog() {
  const { logs } = useOS();
  const [filter, setFilter] = useState<"all" | "warn" | "ok">("all");
  const shown = logs.filter((l) => (filter === "all" ? true : filter === "warn" ? l.level === "warn" || l.level === "err" : l.level === "ok"));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2.5 flex items-center gap-1.5">
        {(["all", "warn", "ok"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`border px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-widest transition-colors ${
              filter === f ? "border-cy/60 bg-cy/10 text-cy" : "border-edge text-faint hover:border-edge2 hover:text-dim"
            }`}
          >
            {f === "warn" ? "warn+err" : f === "ok" ? "fills" : "all"}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[9.5px] text-faint">
          <span className="led led-cy" style={{ width: 6, height: 6 }} /> streaming
        </span>
      </div>

      <div className="scroll-slim max-h-[430px] flex-1 space-y-1 overflow-y-auto pr-1">
        {shown.map((l) => (
          <div key={l.id} className="anim-rowin border border-edge/70 bg-deep/50 px-2.5 py-1.5">
            <div className="flex items-center gap-2 font-mono text-[9.5px]">
              <span className="num text-faint">{l.ts}</span>
              <span className={`hd font-semibold tracking-wider ${LEVEL_COLOR[l.level]}`}>{l.agent.toUpperCase()}</span>
              <span className={`ml-auto text-[8.5px] tracking-widest ${LEVEL_COLOR[l.level]}`}>● {l.level}</span>
            </div>
            <div className="mt-0.5 font-mono text-[10.5px] leading-snug text-dim">{l.msg}</div>
          </div>
        ))}
        {shown.length === 0 && <div className="px-2 py-6 text-center font-mono text-[11px] text-faint">no events match filter</div>}
      </div>
    </div>
  );
}

/* ---------------- positions ---------------- */

export function Positions() {
  const { positions, pairs, closePosition, realized } = useOS();

  const rows = positions.map((pos) => {
    const p = pairs.find((x) => x.sym === pos.sym);
    if (!p) return null;
    const dir = pos.side === "LONG" ? 1 : -1;
    const raw = (p.price - pos.entry) * pos.units * dir;
    const pnl = pos.sym.includes("JPY") ? raw / p.price : raw;
    return { pos, pair: p, pnl };
  });

  const total = rows.reduce((s, r) => s + (r?.pnl ?? 0), 0);

  return (
    <div>
      <div className="space-y-2">
        {rows.map((r) => {
          if (!r) return null;
          const { pos, pair, pnl } = r;
          return (
            <div key={pos.id} className="row-hover border border-edge bg-deep/50 p-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`border px-1.5 py-0.5 font-mono text-[9px] tracking-widest ${
                    pos.side === "LONG" ? "border-up/40 bg-up/10 text-up" : "border-dn/40 bg-dn/10 text-dn"
                  }`}
                >
                  {pos.side}
                </span>
                <span className="hd text-[13px] font-semibold tracking-wider text-ink">{pos.sym}</span>
                <span className="num text-[10px] text-faint">{pos.units.toLocaleString()} u</span>
                <button
                  onClick={() => closePosition(pos.id)}
                  title="Close position"
                  className="btn-os ml-auto flex items-center gap-1 px-2 py-1 text-[9px] text-faint"
                >
                  <Icon name="x" size={10} /> close
                </button>
              </div>
              <div className="mt-1.5 flex items-center justify-between font-mono text-[10.5px]">
                <span className="text-faint">
                  in <span className="text-dim">{fmtPrice(pair, pos.entry)}</span> · now{" "}
                  <span className="text-dim">{fmtPrice(pair, pair.price)}</span>
                </span>
                <span className={`num font-semibold ${pnl >= 0 ? "text-up" : "text-dn"}`}>
                  {pnl >= 0 ? "+" : ""}
                  {fmtMoney(pnl)}
                </span>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="border border-dashed border-edge2 px-3 py-8 text-center font-mono text-[11px] text-faint">
            book flat — awaiting risk-approved tickets
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-edge pt-3 font-mono text-[10.5px]">
        <div>
          <div className="text-faint">UNREALIZED</div>
          <div className={`num text-sm font-semibold ${total >= 0 ? "text-up" : "text-dn"}`}>{fmtMoney(total)}</div>
        </div>
        <div>
          <div className="text-faint">REALIZED (session)</div>
          <div className={`num text-sm font-semibold ${realized >= 0 ? "text-up" : "text-dn"}`}>{fmtMoney(realized)}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- risk console ---------------- */

function Bar({ label, pct, color, value }: { label: string; pct: number; color: string; value: string }) {
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[10px]">
        <span className="text-faint">{label}</span>
        <span className="num text-dim">{value}</span>
      </div>
      <div className="mt-1 h-[5px] w-full overflow-hidden bg-edge">
        <div className="h-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </div>
  );
}

export function RiskPanel() {
  const { equity, upl, positions, pairs, halted, toggleHalt } = useOS();

  const notional = useMemo(
    () => positions.reduce((s, pos) => s + pos.units * (pairs.find((p) => p.sym === pos.sym)?.price ?? 0) * (pos.sym.includes("JPY") ? 1 / 150 : 1), 0),
    [positions, pairs],
  );
  const exposure = (notional / equity) * 100;
  const dd = Math.max(0, ((100420 - equity) / 100420) * 100);
  const riskPerTrade = positions.length ? Math.min(1, 0.42 * positions.length) : 0;

  return (
    <div className="flex h-full flex-col gap-3.5">
      <div className="flex items-end justify-between">
        <div>
          <div className="overline-tag">mark-to-market equity</div>
          <div className={`num mt-1 text-2xl font-semibold ${equity >= 100000 ? "text-ink" : "text-dn"}`}>{fmtMoney(equity, 0)}</div>
        </div>
        <div className={`num text-[11px] ${upl >= 0 ? "text-up" : "text-dn"}`}>
          {upl >= 0 ? "▲" : "▼"} {fmtMoney(Math.abs(upl))} float
        </div>
      </div>

      <Bar label="GROSS EXPOSURE" pct={(exposure / 6) * 100} color={exposure > 4.5 ? "#ff5c7a" : "#57c7ff"} value={`${exposure.toFixed(2)}× equity`} />
      <Bar label="RISK PER TICKET" pct={riskPerTrade * 100} color="#31d8a4" value={`${(riskPerTrade).toFixed(2)}% cap 1.00%`} />
      <Bar label="DAILY DRAWDOWN" pct={(dd / 3) * 100} color={dd > 2 ? "#ff5c7a" : "#ffb454"} value={`${dd.toFixed(2)}% cap 3.00%`} />
      <Bar label="CORRELATION LOAD" pct={62} color="#9adcff" value="0.62 / 0.85" />

      <div className="mt-auto space-y-2 border-t border-edge pt-3">
        <div className="flex items-center justify-between font-mono text-[10px] text-faint">
          <span>open tickets</span>
          <span className="num text-dim">{positions.length}</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[10px] text-faint">
          <span>vol guard (news)</span>
          <span className="num text-warn">USD · elevated</span>
        </div>
        <button
          onClick={toggleHalt}
          className={`btn-os mt-1 flex w-full items-center justify-center gap-2 px-3 py-2.5 text-[11px] font-bold ${
            halted ? "border-up/60 bg-up/10 text-up" : "border-dn/60 bg-dn/10 text-dn hover:bg-dn/20"
          }`}
        >
          <Icon name="power" size={14} />
          {halted ? "re-arm execution" : "emergency flatten + halt"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- strategy matrix ---------------- */

export function StrategyMatrix() {
  const { strategies, toggleStrategy } = useOS();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[1.6fr_1fr_0.7fr_1.2fr_0.6fr_0.7fr_90px] items-center gap-3 border-b border-edge bg-deep/50 px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint">
          <span>strategy</span>
          <span>pairs</span>
          <span>tf</span>
          <span>win rate (30d)</span>
          <span className="text-right">PF</span>
          <span className="text-right">trades</span>
          <span className="text-right">state</span>
        </div>
        {strategies.map((s) => (
          <div key={s.id} className={`row-hover grid grid-cols-[1.6fr_1fr_0.7fr_1.2fr_0.6fr_0.7fr_90px] items-center gap-3 border-b border-edge/60 px-3 py-3 ${s.enabled ? "" : "opacity-55"}`}>
            <div>
              <div className="hd text-[13px] font-semibold tracking-wide text-ink">{s.name}</div>
              <div className="font-mono text-[9.5px] text-faint">host: agent_{s.agent}</div>
            </div>
            <div className="flex flex-wrap gap-1">
              {s.pairs.map((p) => (
                <span key={p} className="border border-edge2 bg-deep/70 px-1.5 py-0.5 font-mono text-[9.5px] text-dim">
                  {p}
                </span>
              ))}
            </div>
            <span className="num text-[11px] text-dim">{s.tf}</span>
            <div className="flex items-center gap-2">
              <div className="h-[5px] w-full max-w-[130px] overflow-hidden bg-edge">
                <div className="h-full bg-gradient-to-r from-cy/70 to-up" style={{ width: `${s.winRate}%` }} />
              </div>
              <span className="num text-[10.5px] text-dim">{s.winRate}%</span>
            </div>
            <span className="num text-right text-[11px] text-up">{s.pf.toFixed(2)}</span>
            <span className="num text-right text-[11px] text-dim">{s.trades}</span>
            <div className="text-right">
              <button
                onClick={() => toggleStrategy(s.id)}
                className={`btn-os px-2.5 py-1.5 text-[9.5px] font-semibold ${
                  s.enabled ? "border-up/50 bg-up/10 text-up" : "border-edge2 text-faint"
                }`}
              >
                {s.enabled ? "ARMED" : "OFF"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
