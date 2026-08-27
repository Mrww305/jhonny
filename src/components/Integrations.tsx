import React, { useRef, useState } from "react";
import { Icon, IconName } from "../os/icons";
import { useOS } from "../os/OSContext";

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);
  const copy = () => {
    try {
      navigator.clipboard?.writeText(value);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div>
      <div className="overline-tag mb-1">{label}</div>
      <div className={`field flex items-center gap-2 px-2.5 py-2 ${copied ? "copy-flash" : ""}`}>
        <span className="min-w-0 flex-1 truncate">{value}</span>
        <button onClick={copy} className="flex flex-none items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-cy transition-colors hover:text-up" title="Copy">
          <Icon name={copied ? "check" : "copy"} size={12} />
          {copied ? "ok" : "copy"}
        </button>
      </div>
    </div>
  );
}

function Chip({ children, tone = "dim" }: { children: React.ReactNode; tone?: "dim" | "cy" | "up" | "warn" }) {
  const tones: Record<string, string> = {
    dim: "border-edge2 text-dim",
    cy: "border-cy/40 text-cy",
    up: "border-up/40 text-up",
    warn: "border-warn/40 text-warn",
  };
  return <span className={`border bg-deep/70 px-1.5 py-0.5 font-mono text-[9.5px] ${tones[tone]}`}>{children}</span>;
}

const META: Record<string, { icon: IconName; accent: string }> = {
  tradingview: { icon: "pulse", accent: "#57c7ff" },
  binance: { icon: "layers", accent: "#ffb454" },
  n8n: { icon: "flow", accent: "#31d8a4" },
  langflow: { icon: "link", accent: "#9adcff" },
};

export function IntegrationDeck() {
  const { integrations, toggleIntegration } = useOS();

  return (
    <div className="space-y-2.5">
      {integrations.map((it) => {
        const meta = META[it.id];
        return (
          <div key={it.id} className={`row-hover border border-edge bg-panel/60 p-4 ${it.linked ? "" : "opacity-80"}`}>
            <div className="flex flex-wrap items-start gap-4">
              {/* identity */}
              <div className="flex w-52 flex-none items-center gap-3">
                <div className="relative flex h-10 w-10 flex-none items-center justify-center border border-edge2 bg-deep" style={{ color: meta.accent }}>
                  <Icon name={meta.icon} size={19} strokeWidth={1.5} />
                  <span className={`absolute -right-1 -top-1 led ${it.linked ? "led-up" : "led-idle"}`} style={{ width: 7, height: 7 }} />
                </div>
                <div>
                  <div className="hd text-[14px] font-bold tracking-wide text-ink">{it.name}</div>
                  <div className="overline-tag mt-0.5" style={{ color: meta.accent }}>
                    {it.tag}
                  </div>
                </div>
              </div>

              <p className="min-w-[220px] flex-1 text-[12px] leading-relaxed text-dim">{it.desc}</p>

              {/* live stats + toggle */}
              <div className="ml-auto flex items-center gap-4">
                <div className="text-right font-mono text-[10px]">
                  <div className="text-faint">LATENCY</div>
                  <div className={`num ${it.linked ? "text-up" : "text-faint"}`}>{it.linked ? `${it.latency}ms` : "—"}</div>
                </div>
                <div className="text-right font-mono text-[10px]">
                  <div className="text-faint">STATE</div>
                  <div className={it.linked ? "text-up" : "text-warn"}>{it.linked ? "LINKED" : "STANDBY"}</div>
                </div>
                <button
                  onClick={() => toggleIntegration(it.id)}
                  className={`btn-os px-3.5 py-2 text-[10px] font-bold ${it.linked ? "border-up/50 bg-up/10 text-up" : "border-edge2 text-faint hover:text-cy"}`}
                >
                  {it.linked ? "unlink" : "link bridge"}
                </button>
              </div>
            </div>

            {/* per-integration detail */}
            <div className="mt-3.5 grid gap-2.5 border-t border-edge/70 pt-3.5 md:grid-cols-2">
              {it.id === "tradingview" && (
                <>
                  <CopyField label="alert webhook (paste into TV strategy)" value="https://n8n.desk.piphawk.io/webhook/wf_fx_ingest" />
                  <div>
                    <div className="overline-tag mb-1">alert payload template</div>
                    <pre className="field overflow-x-auto whitespace-pre px-2.5 py-2 text-[10.5px] leading-relaxed text-cysoft">
{`{ "symbol": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": "{{close}}", "flow": "wf_fx_ingest" }`}
                    </pre>
                  </div>
                </>
              )}
              {it.id === "binance" && (
                <>
                  <CopyField label="bridge endpoint (signed)" value="wss://stream.binance.com:9443/ws · hmac-ed25519" />
                  <div>
                    <div className="overline-tag mb-1">venue routing</div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Chip tone="up">testnet · paper</Chip>
                      <Chip>BTCUSDT</Chip>
                      <Chip>ETHUSDT</Chip>
                      <Chip tone="warn">FX pairs → OANDA (phase 2)</Chip>
                    </div>
                  </div>
                </>
              )}
              {it.id === "n8n" && (
                <>
                  <CopyField label="n8n instance" value="https://n8n.desk.piphawk.io · wf_fx_ingest · wf_fx_news · wf_fx_handshake" />
                  <div>
                    <div className="overline-tag mb-1">active pipelines</div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-[10px] text-faint">
                      <Chip tone="cy">webhook</Chip>
                      <span>→</span>
                      <Chip tone="cy">dedupe</Chip>
                      <span>→</span>
                      <Chip tone="cy">agent bus</Chip>
                      <span>→</span>
                      <Chip tone="up">audit log</Chip>
                      <span>·</span>
                      <Chip>telegram alerts</Chip>
                    </div>
                  </div>
                </>
              )}
              {it.id === "langflow" && (
                <>
                  <CopyField label="flow endpoint" value="https://langflow.desk.piphawk.io/api/v1/run/fx_agent_graph" />
                  <div>
                    <div className="overline-tag mb-1">graph components</div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Chip tone="warn">rag: 10y tick corpus</Chip>
                      <Chip>llm scorer</Chip>
                      <Chip>sentiment head</Chip>
                      <Chip>quant critic</Chip>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
