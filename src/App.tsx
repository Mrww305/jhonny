import React, { Component, useEffect, useState } from "react";
import { AgentRoster } from "./components/Agents";
import { BootOverlay, FooterTerminal, HeaderBar, Reveal, SectionHead, Ticker } from "./components/Chrome";
import { IntegrationDeck } from "./components/Integrations";
import { MarketBoard } from "./components/Market";
import { EventLog, Positions, RiskPanel, StrategyMatrix } from "./components/Ops";
import { WorkflowCanvas, WorkflowLegend } from "./components/Workflow";
import { OSProvider, useOS, useReducedMotion } from "./os/OSContext";
import { Icon } from "./os/icons";

function Desk() {
  const reduced = useReducedMotion();
  const { halted, positions } = useOS();
  const [bootDone, setBootDone] = useState(false);
  const [bootGone, setBootGone] = useState(false);

  useEffect(() => {
    if (reduced) {
      setBootDone(true);
      setBootGone(true);
      return;
    }
    const t1 = window.setTimeout(() => setBootDone(true), 1900);
    const t2 = window.setTimeout(() => setBootGone(true), 2500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reduced]);

  return (
    <div className="relative min-h-screen">
      {/* ambient layers */}
      <div className="bg-grid" />
      <div className="bg-noise" />
      <div className="scanline" />

      {!bootGone && <BootOverlay done={bootDone} />}

      <Ticker />
      <HeaderBar />

      <main className="relative z-10 mx-auto max-w-[1600px] px-4 pb-2 pt-6 sm:px-6">
        {/* status strip */}
        <Reveal>
          <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 border border-edge bg-panel/50 px-4 py-3">
            <div className="hd text-[15px] font-bold tracking-wide text-ink">
              Desk status:{" "}
              {halted ? (
                <span className="text-dn">HALTED — execution locked</span>
              ) : (
                <span className="text-up">RUNNING — paper mode</span>
              )}
            </div>
            <p className="min-w-[260px] flex-1 font-mono text-[11px] leading-relaxed text-faint">
              signals in from <span className="text-cy">TradingView</span>, governed by the agent council, routed to{" "}
              <span className="text-warn">Binance</span> through the <span className="text-up">n8n</span> bus —{" "}
              <span className="text-cysoft">LangFlow</span> graph one link away.
            </p>
            <div className="flex items-center gap-2 font-mono text-[10px] text-faint">
              <Icon name="shield" size={12} className="text-warn" />
              policy v2.4 · 1% risk cap · 3% dd halt
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-12 gap-4">
          {/* 01 — roster */}
          <Reveal className="col-span-12 lg:col-span-6 xl:col-span-3" delay={0}>
            <section className="panel panel-corner h-full p-4">
              <SectionHead index="01" title="AGENT ROSTER" />
              <AgentRoster />
            </section>
          </Reveal>

          {/* 02 — orchestration */}
          <Reveal className="col-span-12 xl:col-span-6" delay={80}>
            <section className="panel panel-corner h-full p-4">
              <SectionHead index="02" title="ORCHESTRATION CANVAS" right={<WorkflowLegend />} />
              <WorkflowCanvas />
            </section>
          </Reveal>

          {/* 03 — event bus */}
          <Reveal className="col-span-12 lg:col-span-6 xl:col-span-3" delay={160}>
            <section className="panel panel-corner h-full p-4">
              <SectionHead
                index="03"
                title="EVENT BUS"
                right={
                  <span className="num flex items-center gap-1.5 font-mono text-[10px] text-faint">
                    <span className="led led-up" style={{ width: 6, height: 6 }} /> live
                  </span>
                }
              />
              <EventLog />
            </section>
          </Reveal>

          {/* 04 — market board */}
          <Reveal className="col-span-12 lg:col-span-7 xl:col-span-6" delay={0}>
            <section className="panel panel-corner p-4">
              <SectionHead
                index="04"
                title="MARKET BOARD"
                right={
                  <span className="flex items-center gap-1.5 font-mono text-[9.5px] text-faint">
                    <span className="border border-edge2 px-1.5 py-0.5">FX</span>
                    <span className="border border-edge2 px-1.5 py-0.5">METALS</span>
                    <span className="border border-edge2 px-1.5 py-0.5">CRYPTO</span>
                  </span>
                }
              />
              <MarketBoard />
            </section>
          </Reveal>

          {/* 05 — positions */}
          <Reveal className="col-span-12 lg:col-span-5 xl:col-span-3" delay={80}>
            <section className="panel panel-corner h-full p-4">
              <SectionHead
                index="05"
                title="PAPER BOOK"
                right={<span className="num font-mono text-[10px] text-faint">{positions.length} open</span>}
              />
              <Positions />
            </section>
          </Reveal>

          {/* 06 — risk */}
          <Reveal className="col-span-12 xl:col-span-3" delay={160}>
            <section className="panel panel-corner h-full p-4">
              <SectionHead index="06" title="RISK CONSOLE" />
              <RiskPanel />
            </section>
          </Reveal>

          {/* 07 — integration deck */}
          <Reveal className="col-span-12" delay={0}>
            <section className="panel panel-corner p-4">
              <SectionHead
                index="07"
                title="INTEGRATION DECK"
                right={
                  <span className="font-mono text-[10px] text-faint">
                    wiring: <span className="text-cy">tradingview</span> → <span className="text-up">n8n</span> →{" "}
                    <span className="text-cysoft">agents</span> → <span className="text-warn">binance</span>
                  </span>
                }
              />
              <IntegrationDeck />
            </section>
          </Reveal>

          {/* 08 — strategies */}
          <Reveal className="col-span-12" delay={0}>
            <section className="panel panel-corner p-4">
              <SectionHead
                index="08"
                title="STRATEGY MATRIX"
                right={
                  <span className="font-mono text-[10px] text-faint">
                    armed by <span className="text-cy">agent_scout</span> · vetted by <span className="text-warn">agent_risk</span>
                  </span>
                }
              />
              <StrategyMatrix />
            </section>
          </Reveal>
        </div>
      </main>

      <FooterTerminal />
    </div>
  );
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("PIPHAWK OS render fault:", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: "#070b13", color: "#e6edf9", fontFamily: "IBM Plex Mono, monospace", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 640, border: "1px solid #ff5c7a", padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#ff5c7a", textTransform: "uppercase", marginBottom: 8 }}>kernel fault — render exception caught</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, fontFamily: "Chakra Petch, sans-serif" }}>PIPHAWK OS halted by error boundary</div>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "#8fa0bf", border: "1px solid #1d2b47", padding: 12, background: "#0a101c" }}>
              {String(this.state.error?.message ?? this.state.error)}
              {"\n\n"}
              {String(this.state.error?.stack ?? "")}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: 16, border: "1px solid #31d8a4", color: "#31d8a4", background: "transparent", padding: "10px 18px", cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "inherit", fontSize: 12 }}
            >
              reboot desk
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <OSProvider>
        <Desk />
      </OSProvider>
    </ErrorBoundary>
  );
}
