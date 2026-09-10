import { createFileRoute } from "@tanstack/react-router";
import { Rotate3D, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

import { Panel, SectionLabel } from "@/components/panel";
import { useSimulation } from "@/components/simulation-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/mission")({
  head: () => ({
    meta: [
      { title: "Mission View — Predictive Virtual Camera PAT" },
      { name: "description", content: "3D mission geometry view for the predictive virtual camera PAT simulation." },
      { property: "og:title", content: "Mission View — Predictive Virtual Camera PAT" },
      { property: "og:description", content: "Inspect spacecraft geometry, line of sight, beacon direction, and gimbal orientation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissionView,
});

function MissionView() {
  const { state } = useSimulation();
  const [orbit, setOrbit] = useState({ x: 18, y: -18 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  const relative = state.target.position;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan">Physical situation model</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-fg">Mission View</h2><p className="mt-1 max-w-2xl font-mono text-[11px] text-dim">Relative geometry, optical line of sight, and gimbal orientation. Orbital mechanics are abstracted for this simulator.</p></div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-dim"><Rotate3D className="size-4 text-cyan" /> DRAG TO ORBIT · SCROLL TO ZOOM</div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <Panel title="Mission Geometry" eyebrow="3D ABSTRACTION" className="min-h-[580px]">
          <div className="relative min-h-[540px] overflow-hidden bg-void grid-bg" onPointerDown={(event) => { setDragging(true); setLastPoint({ x: event.clientX, y: event.clientY }); }} onPointerUp={() => setDragging(false)} onPointerLeave={() => setDragging(false)} onPointerMove={(event) => { if (!dragging) return; setOrbit((current) => ({ x: current.x + (event.clientY - lastPoint.y) * 0.35, y: current.y + (event.clientX - lastPoint.x) * 0.35 })); setLastPoint({ x: event.clientX, y: event.clientY }); }} onWheel={(event) => setZoom((current) => Math.min(1.45, Math.max(0.68, current - event.deltaY * 0.001)))}>
            <div className="absolute inset-0 grid place-items-center" style={{ perspective: "900px" }}>
              <div className="relative size-[310px] transition-transform duration-75" style={{ transform: `rotateX(${orbit.x}deg) rotateZ(${orbit.y}deg) scale(${zoom})`, transformStyle: "preserve-3d" }}>
                <div className="absolute left-1/2 top-1/2 h-px w-[470px] origin-left -translate-y-1/2 bg-cyan/60" style={{ transform: "rotateY(-12deg)" }} />
                <div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/20" />
                <div className="absolute left-1/2 top-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-edge2/70" />
                <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-edge/70" />
                <div className="absolute left-[16%] top-[46%] grid size-20 place-items-center border border-cyan bg-cyan/10 shadow-[0_0_30px_0_var(--color-cyan)]"><span className="font-mono text-[10px] text-cyan">OUR<br />TERMINAL</span><span className="absolute -right-7 top-1/2 h-px w-7 bg-cyan" /></div>
                <div className="absolute right-[3%] top-[21%] grid size-16 place-items-center border border-amber bg-amber/10 shadow-[0_0_24px_0_var(--color-amber)]"><span className="font-mono text-[9px] text-amber">TARGET<br />TERMINAL</span><span className="absolute -bottom-10 right-1/2 h-10 w-px bg-amber" /></div>
                <div className="absolute right-[-4%] top-[18%] size-2 rounded-full bg-amber signal-pulse" />
                <div className="absolute left-[38%] top-[41%] h-px w-32 rotate-[-18deg] bg-lime" />
                <span className="absolute left-[46%] top-[31%] font-mono text-[9px] text-lime">OPTICAL BEACON DIRECTION</span>
              </div>
            </div>
            <div className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.13em] text-dim">REFERENCE FRAME · TERMINAL A</div>
            <div className="absolute right-3 top-3 flex gap-1"><Button variant="outline" size="icon" aria-label="Zoom out" onClick={() => setZoom((current) => Math.max(0.68, current - 0.1))}><ZoomOut /></Button><Button variant="outline" size="icon" aria-label="Zoom in" onClick={() => setZoom((current) => Math.min(1.45, current + 0.1))}><ZoomIn /></Button></div>
            <div className="absolute bottom-3 left-3 font-mono text-[10px] text-dim">LOS VECTOR · ACTIVE</div><div className="absolute bottom-3 right-3 font-mono text-[10px] text-lime">BEACON TRACKING · {state.pat.targetStatus}</div>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Relative State" eyebrow="SIMULATION DATA">
            <div className="grid grid-cols-2 gap-y-3 p-3 font-mono text-[11px]"><Metric label="RELATIVE RANGE" value={`${relative.x.toFixed(1)} m`} /><Metric label="LOS AZIMUTH" value="+012.4°" /><Metric label="LOS ELEVATION" value="−003.1°" /><Metric label="TARGET RATE" value={`${state.target.angularVelocity.toFixed(3)} °/s`} /><Metric label="GIMBAL PAN" value={`${state.pat.gimbalAngle.pan.toFixed(2)}°`} /><Metric label="GIMBAL TILT" value={`${state.pat.gimbalAngle.tilt.toFixed(2)}°`} /></div>
          </Panel>
          <Panel title="Vector Legend"><div className="space-y-3 p-3 font-mono text-[10px] text-dim"><Legend color="bg-cyan" label="OUR TERMINAL / CAMERA ORIGIN" /><Legend color="bg-amber" label="TARGET TERMINAL / BEACON" /><Legend color="bg-lime" label="OPTICAL COMMUNICATION VECTOR" /><Legend color="bg-edge2" label="RELATIVE ORBITAL FRAME" /></div></Panel>
          <Panel title="Orientation"><div className="space-y-3 p-3"><div className="flex items-center justify-between font-mono text-[10px] text-dim"><span>GIMBAL BORESIGHT</span><span className="text-cyan">ALIGNED TO LOS</span></div><div className="h-1.5 overflow-hidden bg-edge"><div className="h-full bg-lime" style={{ width: `${Math.min(100, state.pat.confidence)}%` }} /></div><div className="flex justify-between font-mono text-[10px] text-dim"><span>CAMERA CONFIDENCE</span><span className="text-lime">{state.pat.confidence.toFixed(1)}%</span></div></div></Panel>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div><span className="block text-dim">{label}</span><span className="mt-1 block text-fg">{value}</span></div>; }
function Legend({ color, label }: { color: string; label: string }) { return <div className="flex items-center gap-2"><span className={`size-2 ${color}`} /><span>{label}</span></div>; }