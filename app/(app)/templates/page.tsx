import { PageIntro } from "@/components/shared/page-intro";
import { defaultTemplateBlueprints } from "@/lib/data/templates";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Templates"
        title="Layout recipes"
        description="Template entities are seeded in the schema so we can later drive page generation with structured layout specifications instead of a freeform canvas."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {defaultTemplateBlueprints.map((template) => (
          <article key={template.slug} className="rounded-3xl border border-line bg-surface p-5">
            <p className="eyebrow">Template</p>
            <h2 className="mt-3 text-xl font-semibold">{template.name}</h2>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              Category: {template.category}. Canvas: {template.layoutSpec.canvas.columns} columns,{" "}
              {template.layoutSpec.canvas.aspectRatio}. Built for extensible page JSON generation.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {template.layoutSpec.slots.map((slot) => (
                <span key={slot.id} className="rounded-full border border-line px-3 py-1 text-xs font-medium">
                  {slot.label}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
