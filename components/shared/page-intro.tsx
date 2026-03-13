export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <p className="eyebrow">{eyebrow}</p>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-soft">{description}</p>
      </div>
    </div>
  );
}
