import React, { useEffect, useRef, useState } from "react";
import { fmtPct, fmtPrice, timeStr } from "../os/data";
import { Icon } from "../os/icons";
import { useNow, useOS, useReducedMotion } from "../os/OSContext";

/* ---------------- scroll reveal ---------------- */

export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.disconnect();
          }
        });
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------------- scramble decode ---------------- */

const GLYPHS = "█▓▒░<>/=+*#";

function Scramble({ text, className = "" }: { text: string; className?: string }) {
  const [out, setOut] = useState(text);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      setOut(text);
      return;
    }
    let frame = 0;
    const total = 24;
    const iv = window.setInterval(() => {
      frame++;
      const reveal = Math.floor((frame / total) * text.length);
      setOut(
        text
          .split("")
          .map((c, i) => (i < reveal || c === " " ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(""),
      );
      if (frame >= total) {
        setOut(text);
        window.clearInterval(iv);
      }
    }, 34);
    return () => window.clearInterval(iv);
  }, [text, reduced]);
  return <span className={className}>{out}</span>;
}

/* ---------------- boot overlay ---------------- */

const BOOT_LINES = [
  "mounting agent registry ............ 6 agents",
  "linking n8n bus :5678 .............. wf_fx_ingest",
  "handshake binance testnet .......... ok (31ms)",
  "loading risk policy v2.4 ........... 1% cap / 3% dd",
  "spawning event bus ................. 48-slot ring",
];

export function BootOverlay({ done }: { done: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-bg ${done ? "boot-fade" : ""}`}
      aria-hidden={done}
    >
      <div className="w-[min(560px,92vw)]">
        <div className="overline-tag mb-3 text-cy">piphawk kernel 2.4.1 — cold start</div>
        <h1 className="hd text-4xl font-bold tracking-wide text-ink sm:text-5xl">
          <Scramble text="PIPHAWK OS" />
        </h1>
        <div className="mt-2 font-mono text-xs text-dim">multi-agent fx desk · tradingview ⇄ binance</div>
        <div className="mt-8 space-y-1.5 font-mono text-[11px] text-faint">
          {BOOT_LINES.map((l, i) => (
            <div key={l} className="boot-line flex items-center gap-2" style={{ animationDelay: `${0.12 + i * 0.16}s` }}>
              <span className="text-up">▸</span>
              <span>{l}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 h-[3px] w-full overflow-hidden bg-edge">
          <div className="boot-bar h-full bg-gradient-to-r from-cy to-up" />
        </div>
      </div>
    </div>
  );
}

/* ---------------- ticker tape ---------------- */

export function Ticker() {
  const { pairs, tick } = useOS();
  const items = [...pairs, ...pairs];
  return (
    <div className="ticker-mask relative z-10 border-b border-edge bg-deep/90">
      <div className="ticker-track gap-0 py-1.5">
        {items.map((p, i) => {
          const chg = ((p.price - p.dayOpen) / p.dayOpen) * 100;
          const up = p.price >= (p.hist[p.hist.length - 2] ?? p.price);
          return (
            <span key={`${p.sym}-${i}`} className="flex items-center gap-2 whitespace-nowrap px-5 font-mono text-[11px]">
              <span className="hd font-semibold tracking-wider text-dim">{p.sym}</span>
              <span key={`${p.sym}-${tick}`} className={`num text-ink ${up ? "tick-up" : "tick-dn"}`}>
                {fmtPrice(p, p.price)}
              </span>
              <span className={`num ${chg >= 0 ? "text-up" : "text-dn"}`}>
                {chg >= 0 ? "▲" : "▼"} {fmtPct(chg)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- header ---------------- */

export function HeaderBar() {
  const { halted, toggleHalt, agents, tick, equity } = useOS();
  const now = useNow(1000);
  const [lat, setLat] = useState(31);
  useEffect(() => {
    const iv = window.setInterval(() => setLat(Math.round(24 + Math.random() * 26)), 2200);
    return () => window.clearInterval(iv);
  }, []);
  const active = agents.filter((a) => a.status === "active").length;

  return (
    <header className="relative z-10 border-b border-edge bg-deep/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center border border-edge2 bg-panel text-cy">
            <Icon name="crosshair" size={22} strokeWidth={1.4} />
            <span className="absolute -right-1 -top-1 h-2 w-2 bg-up glow-soft" />
          </div>
          <div>
            <div className="hd text-lg font-bold leading-none tracking-widest text-ink">
              PIPHAWK<span className="text-cy">·OS</span>
            </div>
            <div className="overline-tag mt-1">multi-agent fx desk</div>
          </div>
        </div>

        <div className="hidden items-center gap-5 font-mono text-[11px] text-dim md:flex">
          <span className="flex items-center gap-2">
            <span className={`led ${halted ? "led-dn" : "led-up"}`} />
            {halted ? "DESK HALTED" : `${active}/6 AGENTS LIVE`}
          </span>
          <span className="flex items-center gap-2">
            <Icon name="sat" size={13} className="text-faint" />
            <span className="num text-ink">{timeStr(now)}</span> UTC
          </span>
          <span className="num hidden lg:inline">
            bridge <span className="text-up">{lat}ms</span>
          </span>
          <span className="num hidden xl:inline">
            ticks <span className="text-cy">{(tick * 10 + 48211).toLocaleString()}</span>
          </span>
          <span className="num hidden xl:inline">
            equity <span className={equity >= 100000 ? "text-up" : "text-dn"}>${equity.toFixed(0)}</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="num hidden border border-edge px-2 py-1 text-[10px] text-faint sm:inline">v2.4.1 · paper</span>
          <button
            onClick={toggleHalt}
            className={`btn-os flex items-center gap-2 px-4 py-2 text-xs font-semibold ${
              halted ? "border-up/60 bg-up/10 text-up" : "border-dn/50 bg-dn/5 text-dn hover:border-dn hover:text-dn"
            }`}
          >
            <Icon name="power" size={14} />
            {halted ? "Re-arm desk" : "Kill switch"}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ---------------- section heading ---------------- */

export function SectionHead({ index, title, right }: { index: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 border-b border-edge pb-3">
      <div>
        <div className="overline-tag">
          <span className="text-cy">{index}</span> // {title}
        </div>
        <h2 className="hd mt-1 text-xl font-bold tracking-wide text-ink">{title.replace("_", " ")}</h2>
      </div>
      {right}
    </div>
  );
}

/* ---------------- footer terminal ---------------- */

export function FooterTerminal() {
  const { logs, tick } = useOS();
  const bootRef = useRef(Date.now());
  const [, force] = useState(0);
  useEffect(() => {
    const iv = window.setInterval(() => force((x) => x + 1), 1000);
    return () => window.clearInterval(iv);
  }, []);
  const secs = Math.floor((Date.now() - bootRef.current) / 1000);
  const up = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <footer className="relative z-10 mt-6 border-t border-edge bg-deep/80">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-faint">
          <span className="flex items-center gap-2 text-dim">
            <Icon name="terminal" size={14} className="text-cy" />
            piphawk@desk:~$ tail -f /var/log/eventbus
            <span className="blink inline-block h-3.5 w-[7px] translate-y-[2px] bg-cy" />
          </span>
          <span className="num">
            uptime <span className="text-up">{up}</span>
          </span>
          <span className="num">
            events <span className="text-cy">{logs.length + tick * 3}</span>
          </span>
          <span className="ml-auto hidden sm:inline">
            wiring: tradingview → n8n <span className="text-cy">wf_fx_ingest</span> → agents → binance bridge · langflow graph <span className="text-warn">pending link</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
