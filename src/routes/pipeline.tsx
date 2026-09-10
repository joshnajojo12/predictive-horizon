import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, CheckCircle2, Cpu, Radio, ScanLine, Target } from "lucide-react";

import { Panel } from "@/components/panel";
import { useSimulation } from "@/components/simulation-context";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "PAT Pipeline — Predictive Virtual Camera PAT" },
      { name: "description", content: "Technical block diagram for the predictive virtual camera assisted PAT processing chain." },
      { property: "og:title", content: "PAT Pipeline — Predictive Virtual Camera PAT" },
      { property: "og:description", content: "Inspect the simulated ephemeris-to-acquisition processing architecture." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PipelinePage,
});

const blocks = [
  ["EPHEMERIS + ATTITUDE + IMU", "Fuse propagated spacecraft state and inertial measurements into a common reference frame.", "input"],
  ["RELATIVE MOTION", "Estimate target-relative position, velocity, and angular rate in the terminal frame.", "compute"],
  ["TARGET LOS PREDICTION", "Propagate the relative state to the camera exposure time and solve the expected line of sight.", "compute"],
  ["CAMERA PROJECTION", "Project the predicted LOS through camera intrinsics into pixel coordinates.", "compute"],
  ["EXPECTED VIRTUAL IMAGE", "Render the expected beacon response and reticle geometry before the physical frame arrives.", "signal"],
  ["ACTUAL CAMERA", "Capture the current optical frame with configured noise, latency, and FOV constraints.", "sensor"],
  ["TARGET DETECTION", "Extract the beacon centroid and confidence from the actual camera image.", "sensor"],
  ["EXPECTED vs ACTUAL", "Compare predicted and detected centroids in the same pixel reference frame.", "compare"],
  ["VISUAL RESIDUAL", "Convert the pixel residual into an angular correction signal for the gimbal.", "signal"],
  ["PAN / TILT CONTROL", "Apply the command through the gimbal response model and account for delay.", "control"],
  ["ACQUIRED", "Declare acquisition when residual and confidence remain within acceptance bounds.", "success"],
  ["KEEP / GET-BACK", "Continue predictive tracking or initiate a local reacquisition around the predicted location.", "mode"],
] as const;

function PipelinePage() {
  const { state } = useSimulation();
  return <div className="space-y-3"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan">Technical architecture</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-fg">PAT Processing Pipeline</h2><p className="mt-1 font-mono text-[11px] text-dim">A replaceable processing chain for the future FastAPI / Python simulation source.</p></div><div className="font-mono text-[10px] text-dim">STATE: <span className="text-lime">{state.pat.targetStatus}</span></div></div><div className="grid gap-3 xl:grid-cols-[1fr_280px]"><Panel title="Signal Flow" eyebrow="BLOCK DIAGRAM · EXPANDABLE"><div className="p-3 sm:p-6"><div className="mx-auto max-w-2xl">{blocks.map(([title, explanation, kind], index) => <div key={title} className="flex flex-col items-center"><div className={`w-full border p-3 ${kind === "signal" ? "border-amber/60 bg-amber/5" : kind === "success" ? "border-lime/60 bg-lime/5" : "border-edge bg-panel2"}`}><div className="flex items-start gap-3"><span className="mt-0.5 grid size-6 shrink-0 place-items-center border border-edge2 text-cyan">{index < 4 ? <Cpu className="size-3" /> : index < 7 ? <ScanLine className="size-3" /> : index < 10 ? <Radio className="size-3" /> : <CheckCircle2 className="size-3" />}</span><div><h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-fg">{title}</h3><p className="mt-1 font-mono text-[10px] leading-relaxed text-dim">{explanation}</p></div></div></div>{index < blocks.length - 1 ? <ArrowDown className="my-2 size-4 text-cyan/60" /> : null}</div>)}</div></div></Panel><div className="space-y-3"><Panel title="Current Stage" eyebrow="LIVE"><div className="space-y-4 p-3"><div className="grid place-items-center border border-lime/50 bg-lime/5 py-5"><Target className="size-6 text-lime" /><span className="mt-2 font-mono text-[11px] text-lime">{state.pat.targetStatus}</span></div><div className="space-y-2 font-mono text-[10px] text-dim"><div className="flex justify-between"><span>MODE</span><span className="text-cyan">{state.pat.mode}</span></div><div className="flex justify-between"><span>CONFIDENCE</span><span className="text-lime">{state.pat.confidence.toFixed(1)}%</span></div><div className="flex justify-between"><span>RESIDUAL</span><span className="text-amber">{Math.hypot(state.pixelResidual.x, state.pixelResidual.y).toFixed(1)} px</span></div><div className="flex justify-between"><span>LATENCY</span><span className="text-fg">{state.processingLatency} ms</span></div></div></div></Panel><Panel title="Interface Contract"><div className="space-y-2 p-3 font-mono text-[10px] leading-relaxed text-dim"><p><span className="text-cyan">INPUT</span> spacecraft state, camera frame, scenario config</p><p><span className="text-amber">OUTPUT</span> predicted pixel, residual, gimbal command</p><p><span className="text-lime">CONTROL</span> start, pause, reset, scenario, mode</p><p><span className="text-fg">SOURCE</span> mock service now · Python adapter later</p></div></Panel></div></div></div>;
}