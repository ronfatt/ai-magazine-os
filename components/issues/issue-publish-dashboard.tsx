"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { IssueContentListItem, IssuePageListItem } from "@/lib/types/domain";

function CheckRow({
  label,
  passed,
  detail,
}: {
  label: string;
  passed: boolean;
  detail: string;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        passed ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm">{label}</strong>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {passed ? "Ready" : "Blocked"}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink-soft">{detail}</p>
    </div>
  );
}

export function IssuePublishDashboard({
  issueId,
  issueStatus,
  contents,
  pages,
  mode,
}: {
  issueId: string;
  issueStatus: string;
  contents: IssueContentListItem[];
  pages: IssuePageListItem[];
  mode: "live" | "mock";
}) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approvedContents = contents.filter((item) => item.status === "approved").length;
  const totalContents = contents.length;
  const completedText = contents.filter(
    (item) =>
      item.ingestionSource !== "text" ||
      (item.analysisStatus === "completed" && item.structuredContent),
  ).length;
  const reviewedPages = pages.filter(
    (page) => page.status === "reviewed" || page.status === "published",
  ).length;
  const lockedPages = pages.filter((page) => page.locked).length;

  const checks = [
    {
      label: "All contents approved",
      passed: totalContents > 0 && approvedContents === totalContents,
      detail: `${approvedContents}/${totalContents} content item(s) approved.`,
    },
    {
      label: "All text structured",
      passed: totalContents > 0 && completedText === totalContents,
      detail: `${completedText}/${totalContents} content item(s) ready for downstream layout.`,
    },
    {
      label: "Pages reviewed",
      passed: pages.length > 0 && reviewedPages === pages.length,
      detail: `${reviewedPages}/${pages.length} page(s) reviewed or published.`,
    },
    {
      label: "Pages locked",
      passed: pages.length > 0 && lockedPages === pages.length,
      detail: `${lockedPages}/${pages.length} page(s) locked against accidental regeneration.`,
    },
  ];

  const isPublishReady = checks.every((check) => check.passed);

  async function handlePublish() {
    setError(null);
    setIsPublishing(true);

    try {
      const response = await fetch(`/api/issues/${issueId}/publish`, {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not publish issue.");
      }

      router.refresh();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Could not publish issue.");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">Publish Dashboard</p>
          <h2 className="mt-1 text-2xl font-semibold">Final release gate</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-soft">
            This is the final checkpoint before release. The issue can only publish once editorial inputs, page review, and lock state are all aligned.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <span className="rounded-full border border-line px-4 py-2 text-sm font-medium">
            Issue status: {issueStatus}
          </span>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!isPublishReady || mode !== "live" || isPublishing || issueStatus === "published"}
            className="rounded-full bg-[#201a17] px-5 py-3 text-sm font-medium text-[#f8f3ea] transition hover:bg-[#352a25] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPublishing ? "Publishing..." : issueStatus === "published" ? "Published" : "Publish Issue"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {checks.map((check) => (
          <CheckRow
            key={check.label}
            label={check.label}
            passed={check.passed}
            detail={check.detail}
          />
        ))}
      </div>
    </section>
  );
}
