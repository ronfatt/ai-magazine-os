import type { IssueContentListItem, IssuePageListItem } from "@/lib/types/domain";

function countBy<T>(items: T[], predicate: (item: T) => boolean) {
  return items.filter(predicate).length;
}

export function IssueReviewDashboard({
  contents,
  pages,
}: {
  contents: IssueContentListItem[];
  pages: IssuePageListItem[];
}) {
  const uploadedCount = countBy(contents, (item) => item.status === "uploaded");
  const structuredCount = countBy(contents, (item) => item.status === "structured");
  const approvedCount = countBy(contents, (item) => item.status === "approved");
  const failedCount = countBy(contents, (item) => item.analysisStatus === "failed");
  const processingCount = countBy(contents, (item) => item.analysisStatus === "processing");
  const readyForPageGeneration = countBy(
    contents,
    (item) => item.status === "approved" && Boolean(item.structuredContent),
  );
  const textWaitingForAnalysis = contents.filter(
    (item) =>
      item.ingestionSource === "text" &&
      (item.analysisStatus === "pending" || item.analysisStatus === "failed"),
  );
  const reviewQueue = contents.filter(
    (item) => item.analysisStatus === "completed" && item.status !== "approved",
  );
  const blockedQueue = contents.filter(
    (item) =>
      item.ingestionSource === "text" &&
      (!item.structuredContent || item.analysisStatus === "failed"),
  );
  const approvedPages = countBy(pages, (page) => page.status === "reviewed" || page.status === "published");

  return (
    <section className="panel p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">Review Dashboard</p>
          <h2 className="mt-1 text-2xl font-semibold">Editorial workflow board</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-soft">
            This condenses the issue into one review surface: what is blocked, what is waiting on editorial judgment, and what is ready to become pages.
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          Generation gate: {readyForPageGeneration > 0 ? `${readyForPageGeneration} approved item(s) ready` : "No approved structured content yet"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Uploaded", value: uploadedCount, hint: "Needs review or analysis" },
          { label: "Structured", value: structuredCount, hint: "Parsed, waiting editorial sign-off" },
          { label: "Approved", value: approvedCount, hint: "Ready for generation" },
          { label: "Failed", value: failedCount, hint: "Needs re-run or manual fix" },
          { label: "Processing", value: processingCount, hint: "AI currently working" },
          { label: "Pages", value: pages.length, hint: `${approvedPages} page(s) reviewed/published` },
        ].map((metric) => (
          <article key={metric.label} className="rounded-3xl border border-line bg-surface p-4">
            <p className="eyebrow">{metric.label}</p>
            <strong className="mt-3 block text-3xl font-semibold tracking-tight">{metric.value}</strong>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{metric.hint}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <section className="rounded-3xl border border-line bg-surface p-4">
          <p className="eyebrow">Needs Analysis</p>
          <h3 className="mt-2 text-xl font-semibold">Text waiting on AI</h3>
          <div className="mt-4 space-y-3">
            {textWaitingForAnalysis.length === 0 ? (
              <p className="text-sm leading-7 text-ink-soft">No pending text items. Batch analyze is caught up.</p>
            ) : (
              textWaitingForAnalysis.slice(0, 5).map((item) => (
                <article key={item.id} className="rounded-2xl border border-line px-4 py-3">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="mt-1 text-sm text-ink-soft">
                    {item.analysisStatus === "failed" ? "Retry analysis or edit manually." : "Pending AI structure."}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-4">
          <p className="eyebrow">Review Queue</p>
          <h3 className="mt-2 text-xl font-semibold">Parsed and waiting editorial approval</h3>
          <div className="mt-4 space-y-3">
            {reviewQueue.length === 0 ? (
              <p className="text-sm leading-7 text-ink-soft">Nothing is waiting for review right now.</p>
            ) : (
              reviewQueue.slice(0, 5).map((item) => (
                <article key={item.id} className="rounded-2xl border border-line px-4 py-3">
                  <h4 className="font-medium">{item.structuredContent?.title ?? item.title}</h4>
                  <p className="mt-1 text-sm text-ink-soft">
                    Status: {item.status} · Suggested pages {item.structuredContent?.suggestedPages ?? 1}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-4">
          <p className="eyebrow">Ready For Pages</p>
          <h3 className="mt-2 text-xl font-semibold">Approved editorial inputs</h3>
          <div className="mt-4 space-y-3">
            {approvedCount === 0 ? (
              <p className="text-sm leading-7 text-ink-soft">Approve structured content to unlock reliable page generation.</p>
            ) : (
              contents
                .filter((item) => item.status === "approved")
                .slice(0, 5)
                .map((item) => (
                  <article key={item.id} className="rounded-2xl border border-line px-4 py-3">
                    <h4 className="font-medium">{item.structuredContent?.title ?? item.title}</h4>
                    <p className="mt-1 text-sm text-ink-soft">
                      Category: {item.structuredContent?.category ?? item.contentType}
                    </p>
                  </article>
                ))
            )}
          </div>
        </section>
      </div>

      {blockedQueue.length > 0 ? (
        <div className="mt-6 rounded-3xl border border-amber-300 bg-amber-50 p-4">
          <p className="eyebrow !text-amber-700">Blocked Items</p>
          <p className="mt-2 text-sm leading-7 text-amber-800">
            {blockedQueue.length} content item(s) are blocking smooth generation because they either failed analysis or still have no structured output.
          </p>
        </div>
      ) : null}
    </section>
  );
}
