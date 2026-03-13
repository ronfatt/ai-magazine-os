import Link from "next/link";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/review", label: "Review" },
  { href: "/templates", label: "Templates" },
  { href: "/brand-kit", label: "Brand Kit" },
];

export function Sidebar() {
  return (
    <aside className="panel flex h-full min-h-[calc(100vh-3rem)] w-full max-w-xs flex-col justify-between p-5">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="eyebrow">AI Magazine OS</p>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Editorial cockpit</h1>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Structure incoming content, route it through issues, and prepare future AI layout modules.
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm font-medium transition hover:border-line hover:bg-surface-muted"
            >
              <span>{item.label}</span>
              <span className="text-xs text-ink-soft">Open</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="rounded-2xl bg-[#201a17] p-4 text-[#f8f3ea]">
        <p className="eyebrow !text-[#d7c7b0]">Next Module</p>
        <h2 className="mt-2 text-lg font-semibold">AI Page Composer</h2>
        <p className="mt-2 text-sm leading-6 text-[#d7c7b0]">
          Reserved for layout generation, prompt orchestration, and human-in-the-loop review.
        </p>
      </div>
    </aside>
  );
}
