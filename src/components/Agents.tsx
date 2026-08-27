import React from "react";
import { Icon } from "../os/icons";
import { useOS } from "../os/OSContext";

const STATUS_META: Record<string, { led: string; label: string; color: string }> = {
  active: { led: "led-up", label: "LIVE", color: "text-up" },
  paused: { led: "led-warn", label: "PAUSED", color: "text-warn" },
  idle: { led: "led-idle", label: "IDLE", color: "text-faint" },
};

export function AgentRoster() {
  const { agents, toggleAgent, halted } = useOS();

  return (
    <div className="space-y-2.5">
      {agents.map((a, i) => {
        const effective = halted && a.id === "exec" ? "paused" : a.status;
        const m = STATUS_META[effective];
        return (
          <button
            key={a.id}
            onClick={() => toggleAgent(a.id)}
            title={a.desc}
            className="row-hover group block w-full border border-edge bg-panel/60 p-3 text-left"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 flex-none items-center justify-center border border-edge2 bg-deep ${
                  effective === "active" ? "text-cy" : "text-faint"
                }`}
              >
                <Icon name={a.icon} size={18} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="hd truncate text-[13px] font-semibold tracking-wide text-ink">{a.name}</span>
                  <span className={`flex items-center gap-1.5 font-mono text-[9.5px] tracking-widest ${m.color}`}>
                    <span className={`led ${m.led}`} style={{ width: 6, height: 6 }} />
                    {m.label}
                  </span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[10px] text-faint">
                  {a.role} · <span className="text-dim">{a.model}</span>
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-3">
              <div className="h-[3px] flex-1 overflow-hidden bg-edge">
                <div
                  className={`h-full transition-all duration-700 ${
                    effective === "active" ? "bg-gradient-to-r from-cy/70 to-up" : "bg-edge2"
                  }`}
                  style={{ width: `${a.load}%` }}
                />
              </div>
              <span className="num w-9 text-right text-[10px] text-dim">{a.load}%</span>
              <span className="num w-14 text-right text-[10px] text-faint">hb {a.hb}ms</span>
            </div>

            <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-faint">
              <span className="num">
                tasks <span className="text-dim">{a.tasks.toLocaleString()}</span>
              </span>
              <span
                className={`flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                  a.status === "paused" ? "text-up" : "text-warn"
                }`}
              >
                <Icon name={a.status === "paused" ? "play" : "pause"} size={11} />
                {a.status === "paused" ? "resume" : "suspend"}
              </span>
            </div>
          </button>
        );
      })}
      <p className="px-1 pt-1 font-mono text-[10px] leading-relaxed text-faint">
        click an agent to suspend / resume it on the bus. the risk manager holds veto authority over every ticket.
      </p>
    </div>
  );
}
