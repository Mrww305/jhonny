import React from "react";
import { fmtPct, fmtPrice } from "../os/data";
import { Icon } from "../os/icons";
import { useOS } from "../os/OSContext";

function Spark({ hist, up }: { hist: number[]; up: boolean }) {
  const min = Math.min(...hist);
  const max = Math.max(...hist);
  const range = max - min || 1;
  const pts = hist
    .map((v, i) => `${(i / (hist.length - 1)) * 100},${30 - ((v - min) / range) * 26 - 2}`)
    .join(" ");
  const color = up ? "#31d8a4" : "#ff5c7a";
  return (
    <svg viewBox="0 0 100 30" className="h-7 w-24" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
      <polyline points={`0,30 ${pts} 100,30`} fill={`${color}14`} stroke="none" />
      <circle cx="100" cy={30 - ((hist[hist.length - 1] - min) / range) * 26 - 2} r="1.8" fill={color} />
    </svg>
  );
}

function signal(hist: number[]): "LONG" | "SHORT" | "FLAT" {
  const recent = hist.slice(-6);
  const drift = (recent[recent.length - 1] - recent[0]) / recent[0];
  if (drift > 0.0006) return "LONG";
  if (drift < -0.0006) return "SHORT";
  return "FLAT";
}

const SIG_STYLE: Record<string, string> = {
  LONG: "border-up/40 bg-up/10 text-up",
  SHORT: "border-dn/40 bg-dn/10 text-dn",
  FLAT: "border-edge2 bg-deep/60 text-faint",
};

export function MarketBoard() {
  const { pairs, selected, selectPair, tick } = useOS();
  const focus = pairs.find((p) => p.sym === selected);

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-edge bg-deep/50 px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint sm:grid-cols-[1.2fr_100px_1fr_82px_64px_70px]">
        <span>instrument</span>
        <span className="hidden sm:block">trend</span>
        <span className="text-right">last</span>
        <span className="text-right">chg</span>
        <span className="hidden text-right sm:block">bias</span>
        <span className="hidden text-right sm:block">venue</span>
      </div>

      <div className="scroll-slim max-h-[372px] overflow-y-auto">
        {pairs.map((p) => {
          const prev = p.hist[p.hist.length - 2] ?? p.price;
          const up = p.price >= prev;
          const chg = ((p.price - p.dayOpen) / p.dayOpen) * 100;
          const sig = signal(p.hist);
          const isSel = p.sym === selected;
          return (
            <button
              key={p.sym}
              onClick={() => selectPair(p.sym)}
              className={`row-hover grid w-full grid-cols-[1fr_auto] items-center gap-3 border-b border-edge/60 px-3 py-2.5 text-left sm:grid-cols-[1.2fr_100px_1fr_82px_64px_70px] ${
                isSel ? "border-l-2 border-l-cy bg-cy/5" : "border-l-2 border-l-transparent"
              }`}
            >
              <span className="min-w-0">
                <span className="hd block text-[13px] font-semibold tracking-wider text-ink">
                  {p.sym}
                  {isSel && <Icon name="target" size={11} className="ml-1.5 inline text-cy" />}
                </span>
                <span className="block truncate font-mono text-[10px] text-faint">{p.name}</span>
              </span>
              <span className="hidden sm:block">
                <Spark hist={p.hist} up={chg >= 0} />
              </span>
              <span key={`${p.sym}-${tick}`} className={`num text-right text-[13px] font-medium ${up ? "tick-up" : "tick-dn"}`}>
                {fmtPrice(p, p.price)}
              </span>
              <span className={`num text-right text-[11.5px] ${chg >= 0 ? "text-up" : "text-dn"}`}>{fmtPct(chg)}</span>
              <span className="hidden text-right sm:block">
                <span className={`inline-block border px-1.5 py-0.5 font-mono text-[9px] tracking-widest ${SIG_STYLE[sig]}`}>
                  {sig}
                </span>
              </span>
              <span className="hidden text-right font-mono text-[9.5px] uppercase tracking-wider text-faint sm:block">
                {p.venue}
              </span>
            </button>
          );
        })}
      </div>

      {focus && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-edge bg-deep/50 px-3 py-2.5 font-mono text-[10.5px] text-dim">
          <span className="hd text-[11px] font-semibold tracking-widest text-cy">{focus.sym} FOCUS</span>
          <span className="num">
            day open <span className="text-ink">{fmtPrice(focus, focus.dayOpen)}</span>
          </span>
          <span className="num">
            range{" "}
            <span className="text-ink">
              {fmtPrice(focus, Math.min(...focus.hist))} – {fmtPrice(focus, Math.max(...focus.hist))}
            </span>
          </span>
          <span className="num">
            sig <span className={signal(focus.hist) === "SHORT" ? "text-dn" : "text-up"}>{signal(focus.hist)}</span>
          </span>
          <span className="ml-auto hidden text-faint lg:inline">routed to: scout → risk → bridge</span>
        </div>
      )}
    </div>
  );
}
