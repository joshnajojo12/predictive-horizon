import type { AcquisitionPhase, CameraState, PixelCoordinate, TargetStatus } from "@/lib/simulation";

export function CameraViewport({ kind, camera, status, targetVisible }: { kind: "actual" | "virtual"; camera: CameraState; status: TargetStatus | AcquisitionPhase; targetVisible: boolean }) {
  const point = kind === "actual" ? camera.actualPixel : camera.predictedPixel;
  const x = (point.x / 512) * 100;
  const y = (point.y / 512) * 100;
  const color = kind === "actual" ? "lime" : "amber";
  return (
    <div className="relative aspect-square overflow-hidden bg-void grid-bg">
      <div className="absolute inset-4 border border-edge2/70" />
      <div className="absolute bottom-4 left-4 top-4 w-px bg-cyan/20" />
      <div className="absolute bottom-4 right-4 top-4 w-px bg-cyan/20" />
      <div className="absolute left-4 right-4 top-4 h-px bg-cyan/20" />
      <div className="absolute bottom-4 left-4 right-4 h-px bg-cyan/20" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan/25" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-cyan/25" />
      <div className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/70" />
      {[[20, 30], [70, 22], [40, 70], [80, 60], [15, 55], [63, 18], [28, 82]].map(([starX, starY], index) => <span key={index} className="absolute size-1 rounded-full bg-fg/30" style={{ left: `${starX}%`, top: `${starY}%` }} />)}
      {kind === "virtual" ? <div className="absolute left-1/2 top-1/2 h-px w-28 -translate-x-1/2 -translate-y-1/2 rotate-[20deg] bg-amber/70" /> : null}
      {targetVisible ? <div className={`absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-${color} ${kind === "actual" ? "signal-pulse" : "ring-2 ring-amber/30"}`} style={{ left: `${x}%`, top: `${y}%` }} /> : <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] text-red">TARGET NOT IN FOV</span>}
      {kind === "actual" && targetVisible ? <span className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime shadow-[0_0_14px_3px_var(--color-lime)]" style={{ left: `${x}%`, top: `${y}%` }} /> : null}
      {kind === "virtual" ? <span className="absolute font-mono text-[10px] text-amber" style={{ left: `${Math.min(x + 4, 78)}%`, top: `${Math.max(y - 7, 7)}%` }}>EXP ({Math.round(point.x)}, {Math.round(point.y)})</span> : null}
      <span className="absolute bottom-2 left-3 font-mono text-[10px] text-dim">{kind === "actual" ? `ACTUAL · ${camera.resolution}` : "VIRTUAL · PROJECTION"}</span>
      <span className={`absolute bottom-2 right-3 font-mono text-[10px] text-${kind === "actual" ? "lime" : "amber"}`}>{status}</span>
    </div>
  );
}

export function ResidualBridge({ predicted, actual }: { predicted: PixelCoordinate; actual: PixelCoordinate }) {
  const startX = (predicted.x / 512) * 100;
  const startY = (predicted.y / 512) * 100;
  const endX = (actual.x / 512) * 100;
  const endY = (actual.y / 512) * 100;
  return <svg className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true"><line x1={`${startX}%`} y1={`${startY}%`} x2={`${endX}%`} y2={`${endY}%`} stroke="var(--color-amber)" strokeDasharray="3 4" strokeWidth="1" opacity="0.75" /></svg>;
}