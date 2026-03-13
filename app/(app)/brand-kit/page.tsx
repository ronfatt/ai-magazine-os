import { PageIntro } from "@/components/shared/page-intro";

export default function BrandKitPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Brand Kit"
        title="Identity system"
        description="Brands are first-class records in the MVP so editorial output can inherit palette, typography, and voice guidance before AI layout automation arrives."
      />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-line bg-surface p-5">
          <p className="eyebrow">Palette</p>
          <div className="mt-4 flex gap-3">
            {["#1D1A17", "#A64B2A", "#D2B690", "#F4EFE7"].map((swatch) => (
              <div key={swatch} className="space-y-2">
                <div
                  className="h-20 w-20 rounded-2xl border border-line"
                  style={{ backgroundColor: swatch }}
                />
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
                  {swatch}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-line bg-surface p-5">
          <p className="eyebrow">Typography Rules</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Display hierarchy</h2>
          <p className="mt-3 text-sm leading-7 text-ink-soft">
            Placeholder for brand voice, scale tokens, and issue-level override controls.
          </p>
        </article>
      </section>
    </div>
  );
}
