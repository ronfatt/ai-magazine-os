"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { IssuePageListItem, TemplateRecord } from "@/lib/types/domain";

function PagePreview({ page }: { page: IssuePageListItem | null }) {
  if (!page?.layoutJson) {
    return (
      <div className="rounded-[32px] border border-dashed border-line bg-[#f8f4ed] p-6 text-sm text-ink-soft">
        Generate pages to see a preview layout based on the selected template schema.
      </div>
    );
  }

  return (
    <div className="rounded-[32px] border border-line bg-[#fffdf8] p-6 shadow-[0_20px_60px_rgba(69,45,18,0.08)]">
      <div className="border-b border-line pb-4">
        <p className="eyebrow">Page {page.pageNumber}</p>
        <h3 className="mt-2 text-3xl font-semibold tracking-tight">{page.layoutJson.pageTitle}</h3>
        <p className="mt-2 text-sm leading-7 text-ink-soft">{page.layoutJson.narrative}</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-12">
        {page.layoutJson.zones.map((zone) => (
          <article
            key={`${page.id}-${zone.zoneId}-${zone.slotType}`}
            className={`rounded-3xl border border-line bg-surface p-4 ${
              zone.zoneId === "hero" ? "md:col-span-12" : zone.zoneId === "pull" ? "md:col-span-4" : "md:col-span-8"
            }`}
          >
            <p className="eyebrow">{zone.zoneId}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink-soft">{zone.slotType}</p>
            {Array.isArray(zone.content) ? (
              <ul className="mt-3 space-y-2 text-sm leading-7 text-ink-soft">
                {zone.content.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-7 text-ink-soft">{zone.content}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

export function IssuePageStudio({
  issueId,
  pages,
  templates,
  mode,
}: {
  issueId: string;
  pages: IssuePageListItem[];
  templates: TemplateRecord[];
  mode: "live" | "mock";
}) {
  const router = useRouter();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pages[0]?.id ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [busyPageId, setBusyPageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0] ?? null;

  async function handleGeneratePages() {
    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch(`/api/issues/${issueId}/pages`, {
        method: "POST",
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not generate pages.");
      }

      router.refresh();
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate pages.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleExportPdf() {
    setError(null);
    setIsExporting(true);

    try {
      const response = await fetch(`/api/issues/${issueId}/pdf`);

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Could not export PDF.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `issue-${issueId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Could not export PDF.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handlePageAction(
    pageId: string,
    action: "reviewed" | "published" | "lock" | "unlock" | "move-up" | "move-down" | "regenerate",
  ) {
    setError(null);
    setBusyPageId(pageId);

    try {
      let response: Response;

      if (action === "reviewed" || action === "published") {
        response = await fetch(`/api/pages/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        });
      } else if (action === "lock" || action === "unlock") {
        response = await fetch(`/api/pages/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locked: action === "lock" }),
        });
      } else if (action === "move-up" || action === "move-down") {
        response = await fetch(`/api/pages/${pageId}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction: action === "move-up" ? "up" : "down" }),
        });
      } else {
        response = await fetch(`/api/pages/${pageId}/regenerate`, {
          method: "POST",
        });
      }

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Page action failed.");
      }

      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Page action failed.");
    } finally {
      setBusyPageId(null);
    }
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">Page Studio</p>
          <h2 className="mt-1 text-2xl font-semibold">Template-driven page JSON</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-soft">
            This is the first generation layer between structured editorial content and future PDF output. Templates define layout schema; generated pages store reusable page JSON.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/issues/${issueId}/print`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-line px-5 py-3 text-sm font-medium transition hover:bg-surface-muted"
          >
            Print View
          </a>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={mode !== "live" || isExporting}
            className="rounded-full border border-line px-5 py-3 text-sm font-medium transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>
          <button
            type="button"
            onClick={handleGeneratePages}
            disabled={mode !== "live" || isGenerating}
            className="rounded-full bg-[#201a17] px-5 py-3 text-sm font-medium text-[#f8f3ea] transition hover:bg-[#352a25] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Pages"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-surface p-4">
            <p className="eyebrow">Available Templates</p>
            <div className="mt-3 space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="rounded-2xl border border-line px-4 py-3">
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    {template.category} · {template.layoutSpec.canvas.columns} cols
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-4">
            <p className="eyebrow">Generated Pages</p>
            <div className="mt-3 space-y-3">
              {pages.length === 0 ? (
                <p className="text-sm leading-7 text-ink-soft">
                  No pages yet. Run generation after analyzing at least one text content item.
                </p>
              ) : (
                pages.map((page) => (
                  <article
                    key={page.id}
                    className={`rounded-2xl border px-4 py-3 transition ${
                      selectedPage?.id === page.id
                        ? "border-accent bg-[rgba(166,75,42,0.06)]"
                        : "border-line bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedPageId(page.id)}
                      className="block w-full text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">Page {page.pageNumber}</h3>
                          <p className="mt-1 text-sm text-ink-soft">
                            {page.templateName ?? "No template"} · {page.pageRole}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {page.locked ? (
                            <span className="rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-accent-strong">
                              Locked
                            </span>
                          ) : null}
                          <span className="rounded-full border border-line px-2 py-1 text-xs font-medium">
                            {page.status}
                          </span>
                        </div>
                      </div>
                    </button>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handlePageAction(page.id, page.locked ? "unlock" : "lock")}
                        disabled={busyPageId === page.id || mode !== "live"}
                        className="rounded-full border border-line px-3 py-1 text-xs font-medium transition hover:bg-surface-muted disabled:opacity-50"
                      >
                        {busyPageId === page.id ? "Working..." : page.locked ? "Unlock" : "Lock"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageAction(page.id, "reviewed")}
                        disabled={busyPageId === page.id || mode !== "live"}
                        className="rounded-full border border-line px-3 py-1 text-xs font-medium transition hover:bg-surface-muted disabled:opacity-50"
                      >
                        Mark Reviewed
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageAction(page.id, "published")}
                        disabled={busyPageId === page.id || mode !== "live"}
                        className="rounded-full border border-line px-3 py-1 text-xs font-medium transition hover:bg-surface-muted disabled:opacity-50"
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageAction(page.id, "move-up")}
                        disabled={busyPageId === page.id || mode !== "live"}
                        className="rounded-full border border-line px-3 py-1 text-xs font-medium transition hover:bg-surface-muted disabled:opacity-50"
                      >
                        Move Up
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageAction(page.id, "move-down")}
                        disabled={busyPageId === page.id || mode !== "live"}
                        className="rounded-full border border-line px-3 py-1 text-xs font-medium transition hover:bg-surface-muted disabled:opacity-50"
                      >
                        Move Down
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageAction(page.id, "regenerate")}
                        disabled={busyPageId === page.id || page.locked || mode !== "live"}
                        className="rounded-full border border-line px-3 py-1 text-xs font-medium transition hover:bg-surface-muted disabled:opacity-50"
                      >
                        Regenerate
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        <PagePreview page={selectedPage} />
      </div>
    </section>
  );
}
