import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Crosshair, FlaskConical, Orbit, Workflow } from "lucide-react";
import type { ReactNode } from "react";

import { useSimulation } from "@/components/simulation-context";

const navItems = [
  { label: "Acquisition", to: "/", icon: Crosshair, exact: true },
  { label: "Mission View", to: "/mission", icon: Orbit },
  { label: "Experiment Lab", to: "/experiments", icon: FlaskConical },
  { label: "Pipeline", to: "/pipeline", icon: Workflow },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useSimulation();
  const pathname = useRouterState({ select: (router) => router.location.pathname });

  return (
    <div className="min-h-screen bg-void text-fg font-sans antialiased">
      <header className="mx-auto flex max-w-[1680px] items-center justify-between border-b border-edge px-4 py-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md bg-panel2 text-cyan ring-1 ring-edge2">
            <span className="font-mono text-sm font-semibold">P·V</span>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-fg sm:text-lg">Predictive Virtual Camera Assisted PAT</h1>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-dim sm:text-[11px]">From Blind Search to Predictive Acquisition</p>
          </div>
        </div>
        <div className="hidden items-center gap-5 font-mono text-[10px] lg:flex lg:text-[11px]">
          <span className="text-dim">SIH26169</span>
          <span className="text-dim">FSOC PAT SIM v0.4</span>
          <span className="flex items-center gap-2 text-lime"><span className="size-1.5 rounded-full bg-lime signal-pulse" /> {state.running ? "SIM RUNNING" : "SIM PAUSED"}</span>
          <span className="text-cyan">{state.displayTime}</span>
        </div>
        <div className="flex items-center gap-2 text-cyan lg:hidden"><Activity className="size-4" /><span className="font-mono text-[10px]">{state.pat.targetStatus}</span></div>
      </header>

      <div className="mx-auto flex max-w-[1680px] gap-3 px-3 py-3 lg:gap-4 lg:px-6 lg:py-4">
        <aside className="w-12 shrink-0 lg:w-48">
          <nav className="sticky top-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link key={item.to} to={item.to} className={`group flex items-center gap-3 rounded-md px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors lg:text-[11px] ${active ? "bg-cyan/10 text-cyan ring-1 ring-cyan/30" : "text-dim hover:bg-panel2 hover:text-fg"}`}>
                  <Icon className="size-4 shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
            <div className="mt-5 hidden border-t border-edge px-3 pt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-dim lg:block">
              Sim Clock
              <span className="mt-1 block text-sm tracking-normal text-fg">T+00:04:21.2</span>
              <span className="mt-3 block text-[9px] leading-relaxed text-dim">PREDICT<br />LOOK<br />COMPARE<br />CORRECT<br />ACQUIRE</span>
            </div>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <footer className="mx-auto flex max-w-[1680px] flex-col gap-2 border-t border-edge px-6 py-3 font-mono text-[9px] uppercase tracking-[0.08em] text-dim sm:flex-row sm:items-center sm:justify-between">
        <span>Simulation data — no real telemetry or performance claims</span>
        <span className="text-cyan/70">Predict → Look → Compare → Correct → Acquire → Track → Reacquire</span>
      </footer>
    </div>
  );
}