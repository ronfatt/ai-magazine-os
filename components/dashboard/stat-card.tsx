import type { DashboardMetric } from "@/lib/types/domain";

export function StatCard({ metric }: { metric: DashboardMetric }) {
  return (
    <article className="panel p-5">
      <p className="eyebrow">{metric.label}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <strong className="text-4xl font-semibold tracking-tight">{metric.value}</strong>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-accent-strong">
          {metric.change}
        </span>
      </div>
    </article>
  );
}
