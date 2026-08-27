import React from "react";
import { wfEdges, wfNodes } from "../os/data";
import { Icon, IconName } from "../os/icons";
import { useOS, useReducedMotion } from "../os/OSContext";

const KIND_COLOR: Record<string, string> = {
  source: "#57c7ff",
  agent: "#9adcff",
  risk: "#ffb454",
  bridge: "#31d8a4",
};

const NODE_W = 162;
const NODE_H = 58;

export function WorkflowCanvas() {
  const { agents, integrations, selectedNode, selectNode, testNode, halted } = useOS();
  const reduced = useReducedMotion();

  const nodeStatus = (id: string): { live: boolean; label: string } => {
    const agent = agents.find((a) => a.id === id);
    if (agent) {
      const eff = halted && agent.id === "exec" ? "paused" : agent.status;
      return { live: eff === "active", label: eff.toUpperCase() };
    }
    const map: Record<string, string> = { tv: "tradingview", newsfeed: "n8n", binance: "binance" };
    const integ = integrations.find((i) => i.id === map[id]);
    return { live: !!integ?.linked, label: integ?.linked ? "LINKED" : "STANDBY" };
  };

  const sel = wfNodes.find((n) => n.id === selectedNode) ?? null;
  const selStatus = sel ? nodeStatus(sel.id) : null;

  return (
    <div className="flex flex-col lg:flex-row">
      {/* canvas */}
      <div className="relative min-w-0 flex-1 overflow-hidden bg-deep/60">
        <svg viewBox="0 0 806 420" className="h-auto w-full" role="img" aria-label="Agent orchestration graph">
          {/* dotted backdrop */}
          <defs>
            <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(143,160,191,0.12)" />
            </pattern>
          </defs>
          <rect width="806" height="420" fill="url(#dots)" />

          {/* stage labels */}
          <text x="95" y="24" textAnchor="middle" fontSize="9" fill="#5b6b8c" fontFamily="IBM Plex Mono" letterSpacing="3">INGEST</text>
          <text x="297" y="24" textAnchor="middle" fontSize="9" fill="#5b6b8c" fontFamily="IBM Plex Mono" letterSpacing="3">REASON</text>
          <text x="509" y="24" textAnchor="middle" fontSize="9" fill="#5b6b8c" fontFamily="IBM Plex Mono" letterSpacing="3">GOVERN</text>
          <text x="706" y="24" textAnchor="middle" fontSize="9" fill="#5b6b8c" fontFamily="IBM Plex Mono" letterSpacing="3">EXECUTE</text>
          <line x1="192" y1="34" x2="192" y2="404" stroke="rgba(29,43,71,0.8)" strokeDasharray="2 5" />
          <line x1="404" y1="34" x2="404" y2="404" stroke="rgba(29,43,71,0.8)" strokeDasharray="2 5" />
          <line x1="606" y1="34" x2="606" y2="404" stroke="rgba(29,43,71,0.8)" strokeDasharray="2 5" />

          {/* edges */}
          {wfEdges.map((e) => (
            <g key={e.id}>
              <path d={e.d} className="wf-edge" style={{ stroke: `${e.color}55` }} />
              {!reduced && (
                <circle r="3" fill={e.color}>
                  <animateMotion dur={`${2 + (e.id.charCodeAt(1) % 3) * 0.6}s`} repeatCount="indefinite" path={e.d} />
                </circle>
              )}
            </g>
          ))}

          {/* nodes */}
          {wfNodes.map((n) => {
            const st = nodeStatus(n.id);
            const color = KIND_COLOR[n.kind];
            const active = selectedNode === n.id;
            return (
              <g
                key={n.id}
                className="wf-node"
                transform={`translate(${n.x},${n.y})`}
                onClick={() => selectNode(active ? null : n.id)}
              >
                <rect
                  className="body"
                  width={NODE_W}
                  height={NODE_H}
                  fill={active ? "rgba(17,27,46,0.98)" : "rgba(13,21,36,0.92)"}
                  stroke={active ? color : "#1d2b47"}
                  strokeWidth={active ? 1.4 : 1}
                />
                <rect width="3" height={NODE_H} fill={st.live ? color : "#27395c"} />
                <circle cx={NODE_W - 12} cy="12" r="3.2" fill={st.live ? "#31d8a4" : "#5b6b8c"}>
                  {st.live && !reduced && <animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite" />}
                </circle>
                <text x="12" y="25" fontSize="12.5" fontWeight="700" fill="#e6edf9" fontFamily="Chakra Petch">
                  {n.label}
                </text>
                <text x="12" y="41" fontSize="9" fill="#8fa0bf" fontFamily="IBM Plex Mono">
                  {n.sub}
                </text>
                <text x={NODE_W - 22} y="42" fontSize="8" fill={st.live ? "#31d8a4" : "#5b6b8c"} fontFamily="IBM Plex Mono" textAnchor="end">
                  {st.label}
                </text>
              </g>
            );
          })}
        </svg>
        {halted && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-dn/40 bg-dn/10 px-4 py-2 font-mono text-[10px] tracking-widest text-dn">
            <Icon name="power" size={12} /> KILL SWITCH ENGAGED — FLOW TO BRIDGE SUSPENDED
          </div>
        )}
      </div>

      {/* inspector */}
      <div className="w-full flex-none border-t border-edge bg-panel/50 p-4 lg:w-64 lg:border-l lg:border-t-0">
        {sel && selStatus ? (
          <div key={sel.id} className="anim-rowin">
            <div className="flex items-center justify-between">
              <span className="overline-tag" style={{ color: KIND_COLOR[sel.kind] }}>
                {sel.kind} node
              </span>
              <span className={`led ${selStatus.live ? "led-up" : "led-idle"}`} />
            </div>
            <h3 className="hd mt-1 text-lg font-bold text-ink">{sel.label}</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-dim">{sel.desc}</p>
            <div className="mt-3 border border-edge bg-deep/80 px-2.5 py-2 font-mono text-[10px] text-cy">{sel.endpoint}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px]">
              <div className="border border-edge bg-deep/60 px-2 py-1.5">
                <div className="text-faint">STATUS</div>
                <div className={selStatus.live ? "text-up" : "text-warn"}>{selStatus.label}</div>
              </div>
              <div className="border border-edge bg-deep/60 px-2 py-1.5">
                <div className="text-faint">BUS ID</div>
                <div className="text-dim">node_{sel.id}</div>
              </div>
            </div>
            <button
              onClick={() => testNode(sel.id)}
              className="btn-os mt-3 flex w-full items-center justify-center gap-2 bg-deep/60 px-3 py-2 text-[11px] font-semibold text-dim"
            >
              <Icon name="pulse" size={13} /> run test pulse
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col items-start justify-center gap-3 text-dim">
            <Icon name="flow" size={26} className="text-faint" />
            <p className="text-[12px] leading-relaxed">
              Select a node on the graph to inspect its endpoint, status and fire a test pulse down the bus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkflowLegend() {
  const items: Array<{ c: string; t: string; icon: IconName }> = [
    { c: "#57c7ff", t: "ingest", icon: "sat" },
    { c: "#9adcff", t: "reason", icon: "radar" },
    { c: "#ffb454", t: "govern", icon: "shield" },
    { c: "#31d8a4", t: "execute", icon: "bolt" },
  ];
  return (
    <div className="flex items-center gap-4 font-mono text-[10px] text-faint">
      {items.map((i) => (
        <span key={i.t} className="flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-4" style={{ background: i.c }} />
          <Icon name={i.icon} size={11} />
          {i.t}
        </span>
      ))}
    </div>
  );
}
