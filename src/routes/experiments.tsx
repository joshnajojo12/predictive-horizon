import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Play, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Panel, SectionLabel } from "@/components/panel";
import { useSimulation } from "@/components/simulation-context";
import { Button } from "@/components/ui/button";
import { defaultScenarioConfig, scenarioOptions, type ScenarioConfig } from "@/lib/simulation";

export const Route = createFileRoute("/experiments")({
  head: () => ({
    meta: [
      { title: "Experiment Lab — Predictive Virtual Camera PAT" },
      { name: "description", content: "Configure disturbances and compare baseline and proposed PAT simulation results." },
      { property: "og:title", content: "Experiment Lab — Predictive Virtual Camera PAT" },
      { property: "og:description", content: "Run simulation experiments across pointing, ephemeris, attitude, vibration, noise, and delay conditions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExperimentLab,
});

function ExperimentLab() {
  const { state, runExperiment } = useSimulation();
  const [config, setConfig] = useState<ScenarioConfig>(defaultScenarioConfig);
  const update = (key: keyof ScenarioConfig, value: number) => setConfig((current) => ({ ...current, [key]: value }));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan">Parameter sweep and method comparison</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-fg">Experiment Lab</h2><p className="mt-1 font-mono text-[11px] text-dim">Configure a test case, then run the baseline spiral search against predictive acquisition.</p></div><div className="flex items-center gap-2 font-mono text-[10px] text-amber"><FlaskConical className="size-4" /> SIMULATION DATA</div></div>
      <div className="grid gap-3 xl:grid-cols-[360px_1fr]">
        <Panel title="Experiment Configuration" eyebrow="INPUTS">
          <div className="space-y-4 p-3">
            <div><SectionLabel>Scenario</SectionLabel><div className="mt-2 grid grid-cols-2 gap-1.5">{scenarioOptions.map((scenario) => <button key={scenario} type="button" onClick={() => undefined} className={`border px-2 py-2 text-left font-mono text-[9px] uppercase tracking-[0.05em] transition-colors ${state.scenario === scenario ? "border-cyan bg-cyan/10 text-cyan" : "border-edge text-dim hover:border-edge2 hover:text-fg"}`}>{scenario}</button>)}</div></div>
            <Parameter label="Initial Pointing Error" value={config.initialPointingError} min={0} max={5} step={0.1} suffix="°" onChange={(value) => update("initialPointingError", value)} />
            <Parameter label="Target Angular Velocity" value={config.targetAngularVelocity} min={0} max={0.2} step={0.001} suffix="°/s" onChange={(value) => update("targetAngularVelocity", value)} />
            <Parameter label="Ephemeris Error" value={config.ephemerisError} min={0} max={1} step={0.01} suffix="m" onChange={(value) => update("ephemerisError", value)} />
            <Parameter label="Attitude Error" value={config.attitudeError} min={0} max={1} step={0.01} suffix="°" onChange={(value) => update("attitudeError", value)} />
            <Parameter label="Vibration Amplitude" value={config.vibrationAmplitude} min={0} max={1} step={0.01} suffix="°" onChange={(value) => update("vibrationAmplitude", value)} />
            <Parameter label="Vibration Frequency" value={config.vibrationFrequency} min={0} max={40} step={1} suffix="Hz" onChange={(value) => update("vibrationFrequency", value)} />
            <Parameter label="Camera Noise" value={config.cameraNoise} min={0} max={0.5} step={0.01} suffix="σ" onChange={(value) => update("cameraNoise", value)} />
            <Parameter label="Gimbal Delay" value={config.gimbalDelay} min={0} max={80} step={1} suffix="ms" onChange={(value) => update("gimbalDelay", value)} />
            <div className="grid grid-cols-3 gap-1.5 pt-2"><Button size="sm" onClick={() => runExperiment("BASELINE")}><Play />Baseline</Button><Button size="sm" variant="outline" onClick={() => runExperiment("PROPOSED")}><Play />Proposed</Button><Button size="sm" variant="outline" onClick={() => runExperiment("COMPARISON")}><Play />Compare</Button></div>
            <Button variant="ghost" size="sm" className="w-full text-dim" onClick={() => setConfig(defaultScenarioConfig)}><RotateCcw />Reset parameters</Button>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Comparison Matrix" eyebrow="PLACEHOLDER VALUES · SIMULATION DATA" action={<span className="font-mono text-[10px] text-lime">UPDATED LIVE</span>}>
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] font-mono text-[11px]"><thead className="border-b border-edge text-[10px] uppercase tracking-[0.1em] text-dim"><tr><th className="px-3 py-2 text-left font-normal">Metric</th><th className="px-3 py-2 text-right font-normal">Baseline</th><th className="px-3 py-2 text-right font-normal text-cyan">Proposed</th></tr></thead><tbody>{[["Acquisition Time", "2.84 s", `${state.experimentResults[1]?.acquisitionTime.toFixed(2) ?? "0.41"} s`], ["Reacquisition Time", "1.62 s", `${state.experimentResults[1]?.reacquisitionTime.toFixed(2) ?? "0.31"} s`], ["Number of Movements", "47", "6"], ["Frames Before Acquisition", "312", "49"], ["Tracking RMSE", "0.0041°", "0.0014°"], ["Maximum Pointing Error", "3.20°", "0.62°"], ["Lock Retention", "88%", "97%"]].map(([metric, baseline, proposed]) => <tr key={metric} className="border-b border-edge/60"><td className="px-3 py-2.5 text-dim">{metric}</td><td className="px-3 py-2.5 text-right text-fg">{baseline}</td><td className="px-3 py-2.5 text-right text-cyan">{proposed}</td></tr>)}</tbody></table></div>
          </Panel>
          <div className="grid gap-3 md:grid-cols-2"><ChartPanel title="Acquisition Time vs Initial Pointing Error" tone="cyan" points="4,90 22,84 40,76 58,62 76,47 94,33" /><ChartPanel title="Reacquisition Time vs Disturbance" tone="amber" points="4,30 22,37 40,44 58,58 76,66 94,84" /><ChartPanel title="Tracking Error vs Time" tone="lime" points="4,25 16,40 28,32 40,57 54,48 68,70 82,63 94,78" /><ChartPanel title="Baseline vs Proposed" tone="cyan" points="4,74 22,66 40,58 58,46 76,39 94,28" /></div>
        </div>
      </div>
    </div>
  );
}

function Parameter({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) { return <label className="block"><div className="mb-1 flex items-center justify-between font-mono text-[10px] text-dim"><span>{label}</span><span className="text-fg">{value.toFixed(step < 0.01 ? 3 : step < 1 ? 2 : 0)} {suffix}</span></div><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-[var(--color-cyan)]" /></label>; }
function ChartPanel({ title, points, tone }: { title: string; points: string; tone: "cyan" | "amber" | "lime" }) { return <Panel title={title} eyebrow="TREND"><div className="relative h-36 bg-void grid-bg"><svg className="absolute inset-3 h-[calc(100%-24px)] w-[calc(100%-24px)]" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={points} fill="none" stroke={`var(--color-${tone})`} strokeWidth="1.4" vectorEffect="non-scaling-stroke" /></svg><div className="absolute bottom-1 left-2 font-mono text-[8px] text-dim">LOW</div><div className="absolute bottom-1 right-2 font-mono text-[8px] text-dim">HIGH</div></div></Panel>; }