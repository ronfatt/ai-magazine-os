export function Topbar({ userEmail }: { userEmail: string | null }) {
  return (
    <header className="panel flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="eyebrow">Foundation Build</p>
        <h2 className="text-2xl font-semibold tracking-tight">MVP scaffold is ready for Supabase-backed modules</h2>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
        <div className="rounded-full border border-line px-4 py-2">App Router</div>
        <div className="rounded-full border border-line px-4 py-2">Supabase SSR</div>
        <div className="rounded-full border border-line px-4 py-2">Vercel-ready</div>
        {userEmail ? (
          <div className="rounded-full border border-line bg-surface px-4 py-2 text-ink">
            {userEmail}
          </div>
        ) : null}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-full border border-line px-4 py-2 text-ink transition hover:bg-surface-muted"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
