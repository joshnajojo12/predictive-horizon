import type { ReactNode } from "react";

export function Panel({
  title,
  eyebrow,
  children,
  className = "",
  action,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`overflow-hidden rounded-md border border-edge bg-panel ${className}`}>
      <div className="flex min-h-9 items-center justify-between border-b border-edge px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">{title}</span>
          {eyebrow ? <span className="font-mono text-[10px] text-dim">{eyebrow}</span> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[10px] uppercase tracking-[0.13em] text-dim">{children}</div>;
}