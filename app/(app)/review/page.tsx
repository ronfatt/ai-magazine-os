import { PageIntro } from "@/components/shared/page-intro";

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Review"
        title="Human-in-the-loop checkpoint"
        description="This review queue will eventually consolidate generated pages, unresolved content mappings, and final editorial approvals before publishing."
      />

      <section className="rounded-3xl border border-dashed border-line bg-surface px-5 py-10 text-center">
        <p className="text-sm uppercase tracking-[0.18em] text-ink-soft">Queue Placeholder</p>
        <h2 className="mt-3 text-2xl font-semibold">No generated pages yet</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
          Once projects and issues are connected to real data, this screen can surface approval tasks from AI composition pipelines.
        </p>
      </section>
    </div>
  );
}
