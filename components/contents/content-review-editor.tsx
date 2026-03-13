"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { IssueContentListItem, StructuredEditorialContent } from "@/lib/types/domain";

function prettyJson(value: StructuredEditorialContent | null) {
  return JSON.stringify(
    value ?? {
      title: "",
      subtitle: "",
      summary: "",
      sections: [],
      quotes: [],
      suggestedPages: 1,
      category: "",
    },
    null,
    2,
  );
}

export function ContentReviewEditor({
  content,
  issueId,
}: {
  content: IssueContentListItem;
  issueId: string | null;
}) {
  const router = useRouter();
  const [jsonValue, setJsonValue] = useState(prettyJson(content.structuredContent));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const parsed = JSON.parse(jsonValue) as StructuredEditorialContent;
      const response = await fetch(`/api/contents/${content.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save content review.");
      }

      setSuccess("Structured content saved.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save content review.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusUpdate(status: "uploaded" | "approved") {
    setError(null);
    setSuccess(null);
    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`/api/contents/${content.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update status.");
      }

      setSuccess(`Content marked as ${status}.`);
      router.refresh();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Content Review</p>
            <h2 className="mt-1 text-2xl font-semibold">Editable structured JSON</h2>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              Review and refine the parsed result before page generation uses it.
            </p>
          </div>
          {issueId ? (
            <Link
              href={`/issues/${issueId}`}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:bg-surface-muted"
            >
              Back to Issue
            </Link>
          ) : null}
        </div>

        <div className="mt-5 rounded-3xl border border-line bg-surface p-4">
          <p className="eyebrow">Source</p>
          <h3 className="mt-2 text-xl font-semibold">{content.title}</h3>
          <p className="mt-2 text-sm leading-7 text-ink-soft">
            {content.rawText
              ? `${content.rawText.slice(0, 420)}${content.rawText.length > 420 ? "..." : ""}`
              : "No raw text available."}
          </p>
        </div>

        <label className="mt-5 block space-y-2 text-sm">
          <span className="font-medium">Structured JSON</span>
          <textarea
            className="min-h-[520px] w-full rounded-3xl border border-line bg-[#1f1d1a] px-4 py-4 font-mono text-sm text-[#f8f3ea] outline-none transition focus:border-accent"
            value={jsonValue}
            onChange={(event) => setJsonValue(event.target.value)}
            spellCheck={false}
          />
        </label>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">
            Keep keys stable: `title`, `subtitle`, `summary`, `sections`, `quotes`, `suggestedPages`, `category`.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleStatusUpdate("uploaded")}
              disabled={isUpdatingStatus}
              className="rounded-full border border-line px-5 py-3 text-sm font-medium transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send Back
            </button>
            <button
              type="button"
              onClick={() => handleStatusUpdate("approved")}
              disabled={isUpdatingStatus}
              className="rounded-full border border-line px-5 py-3 text-sm font-medium transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark Approved
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full bg-[#201a17] px-5 py-3 text-sm font-medium text-[#f8f3ea] transition hover:bg-[#352a25] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Review"}
            </button>
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <p className="eyebrow">Review Notes</p>
        <h2 className="mt-1 text-2xl font-semibold">What good output should contain</h2>
        <div className="mt-5 space-y-4 text-sm leading-7 text-ink-soft">
          <p>The title and subtitle should be editor-ready, not just mirrors of the raw source.</p>
          <p>The summary should explain the angle of the story in a compact way.</p>
          <p>Sections should reflect narrative blocks that can later map into page zones.</p>
          <p>Quotes should be meaningful pull quotes, not every sentence with quotation marks.</p>
          <p>Suggested pages should be realistic for a magazine spread, usually between 1 and 6.</p>
          <p>Category should help template selection and page generation, so keep it concise.</p>
        </div>
      </div>
    </section>
  );
}
