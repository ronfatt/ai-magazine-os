import type { ActivityItem } from "@/lib/types/domain";

export function ActivityList({
  items,
  title,
}: {
  items: ActivityItem[];
  title: string;
}) {
  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Recent Uploads</p>
          <h3 className="mt-1 text-xl font-semibold">{title}</h3>
        </div>
        <span className="text-sm text-ink-soft">Storage pipeline</span>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-line bg-surface px-4 py-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <p className="mt-1 text-sm text-ink-soft">{item.subtitle}</p>
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
                {item.dateLabel}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
