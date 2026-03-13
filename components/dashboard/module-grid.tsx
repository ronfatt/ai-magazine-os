export function ModuleGrid({
  items,
}: {
  items: Array<{ title: string; description: string }>;
}) {
  return (
    <section className="panel p-5">
      <div>
        <p className="eyebrow">Future Modules</p>
        <h3 className="mt-1 text-xl font-semibold">Reserved integration surfaces</h3>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.title}
            className="grid-stripes rounded-3xl border border-line bg-surface px-4 py-5"
          >
            <h4 className="text-lg font-semibold">{item.title}</h4>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
