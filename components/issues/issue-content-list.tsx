"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { IssueContentListItem } from "@/lib/types/domain";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AnalysisPreview({
  item,
}: {
  item: IssueContentListItem | null;
}) {
  if (!item) {
    return (
      <aside className="rounded-3xl border border-dashed border-line bg-surface px-5 py-8 text-sm text-ink-soft">
        Select a content item to inspect the parsed editorial preview.
      </aside>
    );
  }

  if (!item.structuredContent) {
    return (
      <aside className="rounded-3xl border border-dashed border-line bg-surface px-5 py-8">
        <p className="eyebrow">Preview Panel</p>
        <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
        <p className="mt-3 text-sm leading-7 text-ink-soft">
          No structured JSON yet. Run analysis on a text item to generate title, summary, sections, quotes, suggested pages, and category.
        </p>
        {item.analysisError ? (
          <p className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {item.analysisError}
          </p>
        ) : null}
      </aside>
    );
  }

  return (
    <aside className="rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Preview Panel</p>
          <h3 className="mt-2 text-2xl font-semibold">{item.structuredContent.title}</h3>
          <p className="mt-2 text-sm leading-7 text-ink-soft">{item.structuredContent.subtitle}</p>
        </div>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-accent-strong">
          {item.structuredContent.category}
        </span>
      </div>

      <div className="mt-5 space-y-5 text-sm">
        <section>
          <p className="eyebrow">Summary</p>
          <p className="mt-2 leading-7 text-ink-soft">{item.structuredContent.summary}</p>
        </section>

        <section>
          <p className="eyebrow">Sections</p>
          <div className="mt-3 space-y-3">
            {item.structuredContent.sections.map((section) => (
              <div key={section.heading} className="rounded-2xl border border-line px-4 py-3">
                <h4 className="font-semibold">{section.heading}</h4>
                <p className="mt-2 leading-7 text-ink-soft">{section.summary}</p>
                <ul className="mt-2 list-disc pl-5 text-ink-soft">
                  {section.keyPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="eyebrow">Quotes</p>
          <div className="mt-3 space-y-3">
            {item.structuredContent.quotes.length === 0 ? (
              <p className="text-ink-soft">No pull quotes identified.</p>
            ) : (
              item.structuredContent.quotes.map((quote) => (
                <blockquote key={`${quote.quote}-${quote.context}`} className="rounded-2xl border border-line px-4 py-3">
                  <p className="font-medium">&ldquo;{quote.quote}&rdquo;</p>
                  <p className="mt-2 text-ink-soft">
                    {quote.speaker ? `${quote.speaker} · ` : ""}
                    {quote.context}
                  </p>
                </blockquote>
              ))
            )}
          </div>
        </section>

        <section className="flex flex-wrap gap-2">
          <span className="rounded-full border border-line px-3 py-1 text-xs font-medium">
            Suggested pages: {item.structuredContent.suggestedPages}
          </span>
          {item.analysisModel ? (
            <span className="rounded-full border border-line px-3 py-1 text-xs font-medium">
              Model: {item.analysisModel}
            </span>
          ) : null}
          {item.analysisProvider ? (
            <span className="rounded-full border border-line px-3 py-1 text-xs font-medium">
              Provider: {item.analysisProvider}
            </span>
          ) : null}
        </section>
      </div>
    </aside>
  );
}

export function IssueContentList({
  issueId,
  items,
  mode,
}: {
  issueId: string;
  items: IssueContentListItem[];
  mode: "live" | "mock";
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  async function handleAnalyze(contentId: string) {
    setBusyId(contentId);
    setActionError(null);

    try {
      const response = await fetch(`/api/contents/${contentId}/analyze`, {
        method: "POST",
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis failed.");
      }

      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleBatchAnalyze() {
    setActionError(null);
    setIsBatchAnalyzing(true);

    try {
      const response = await fetch(`/api/issues/${issueId}/contents/analyze`, {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Batch analysis failed.");
      }

      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Batch analysis failed.");
    } finally {
      setIsBatchAnalyzing(false);
    }
  }

  async function handleStatusUpdate(contentId: string, status: "uploaded" | "approved") {
    setBusyId(contentId);
    setActionError(null);

    try {
      const response = await fetch(`/api/contents/${contentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Status update failed.");
      }

      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Status update failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Issue Contents</p>
          <h2 className="mt-1 text-2xl font-semibold">Uploaded source material</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleBatchAnalyze}
            disabled={mode !== "live" || isBatchAnalyzing}
            className="rounded-full bg-[#201a17] px-4 py-2 text-sm font-medium text-[#f8f3ea] transition hover:bg-[#352a25] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBatchAnalyzing ? "Batch Analyzing..." : "Batch Analyze"}
          </button>
          <div className="rounded-full border border-line px-4 py-2 text-sm text-ink-soft">
            {mode === "live" ? "Live Supabase data" : "Awaiting Supabase setup"}
          </div>
        </div>
      </div>

      {actionError ? (
        <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-line bg-surface px-5 py-10 text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-soft">No Content Yet</p>
          <h3 className="mt-3 text-xl font-semibold">This issue does not have uploaded inputs yet</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Use the upload form to add pasted copy, PDFs, or images. They will appear here immediately after insert.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3">
            {items.map((item) => {
              const canAnalyze = item.ingestionSource === "text";
              const isBusy = busyId === item.id;
              const isSelected = selectedItem?.id === item.id;

              return (
                <article
                  key={item.id}
                  className={`rounded-3xl border px-4 py-4 transition ${
                    isSelected ? "border-accent bg-[rgba(166,75,42,0.06)]" : "border-line bg-surface"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="flex-1 text-left"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
                          <span>{item.contentType}</span>
                          <span>{item.ingestionSource}</span>
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-sm leading-7 text-ink-soft">
                          {item.rawText
                            ? `${item.rawText.slice(0, 180)}${item.rawText.length > 180 ? "..." : ""}`
                            : item.assetFileName
                              ? `Linked asset: ${item.assetFileName}`
                              : "No raw preview available yet."}
                        </p>
                        {item.assetFileName ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-accent-strong">
                              Asset: {item.assetKind} · {item.assetFileName}
                            </p>
                            {item.assetId ? (
                              <Link
                                href={`/api/assets/${item.assetId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-medium text-accent-strong underline decoration-[rgba(166,75,42,0.35)] underline-offset-4"
                              >
                                Open Asset
                              </Link>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </button>

                    <div className="flex flex-wrap content-start gap-2 lg:max-w-[220px] lg:justify-end">
                      <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-accent-strong">
                        Status: {item.status}
                      </span>
                      <span className="rounded-full border border-line px-3 py-1 text-xs font-medium">
                        Priority {item.priority}
                      </span>
                      <span className="rounded-full border border-dashed border-line px-3 py-1 text-xs font-medium text-ink-soft">
                        AI: {item.analysisStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAnalyze(item.id)}
                        disabled={!canAnalyze || isBusy || mode !== "live"}
                        className="rounded-full bg-[#201a17] px-4 py-2 text-xs font-medium text-[#f8f3ea] transition hover:bg-[#352a25] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusy ? "Analyzing..." : "Analyze Content"}
                      </button>
                      <Link
                        href={`/contents/${item.id}`}
                        className="rounded-full border border-line px-4 py-2 text-xs font-medium transition hover:bg-surface-muted"
                      >
                        Review JSON
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(item.id, "approved")}
                        disabled={item.status === "approved" || isBusy || mode !== "live"}
                        className="rounded-full border border-line px-4 py-2 text-xs font-medium transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mark Approved
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(item.id, "uploaded")}
                        disabled={item.status === "uploaded" || isBusy || mode !== "live"}
                        className="rounded-full border border-line px-4 py-2 text-xs font-medium transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Send Back
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <AnalysisPreview item={selectedItem} />
        </div>
      )}
    </section>
  );
}
