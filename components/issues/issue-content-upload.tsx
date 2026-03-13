"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SourceType = "text" | "pdf" | "image";

const sourceOptions: Array<{
  value: SourceType;
  label: string;
  helper: string;
}> = [
  {
    value: "text",
    label: "Pasted Text",
    helper: "For article drafts, briefs, interview notes, or cleaned text copied from elsewhere.",
  },
  {
    value: "pdf",
    label: "PDF Upload",
    helper: "For decks, exported manuscripts, or press-ready editorial source documents.",
  },
  {
    value: "image",
    label: "Image Upload",
    helper: "For scans, layouts, photos, or screenshots to parse later.",
  },
];

export function IssueContentUpload({
  issueId,
  disabled,
}: {
  issueId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("article");
  const [rawText, setRawText] = useState("");
  const [status, setStatus] = useState("uploaded");
  const [priority, setPriority] = useState("3");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("contentType", contentType);
      formData.set("rawText", rawText);
      formData.set("status", status);
      formData.set("priority", priority);
      formData.set("sourceType", sourceType);

      if (file) {
        formData.set("file", file);
      }

      const response = await fetch(`/api/issues/${issueId}/contents`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      setSuccess("Content added to this issue.");
      setTitle("");
      setRawText("");
      setFile(null);
      setPriority("3");
      setContentType("article");
      setStatus("uploaded");
      setSourceType("text");
      setFileInputKey((current) => current + 1);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not upload content.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const sourceConfig = sourceOptions.find((option) => option.value === sourceType);

  return (
    <section className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Content Ingestion</p>
          <h2 className="mt-1 text-2xl font-semibold">Upload into this issue</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Add raw editorial material now. AI parsing stays off for this step, but each record is shaped so we can normalize it later.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-ink-soft">
          Future parser hook reserved
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-3">
          {sourceOptions.map((option) => {
            const isActive = option.value === sourceType;

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled || isSubmitting}
                onClick={() => {
                  setSourceType(option.value);
                  setFile(null);
                  setFileInputKey((current) => current + 1);
                  setError(null);
                }}
                className={`rounded-3xl border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-accent bg-[rgba(166,75,42,0.08)]"
                    : "border-line bg-surface hover:border-accent/40"
                }`}
              >
                <h3 className="text-base font-semibold">{option.label}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{option.helper}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-line bg-surface p-4">
          <p className="text-sm font-medium text-accent-strong">{sourceConfig?.label}</p>
          <p className="mt-1 text-sm leading-6 text-ink-soft">{sourceConfig?.helper}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Title</span>
            <input
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="March cover story draft"
              disabled={disabled || isSubmitting}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Content Type</span>
            <select
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              value={contentType}
              onChange={(event) => setContentType(event.target.value)}
              disabled={disabled || isSubmitting}
            >
              <option value="article">Article</option>
              <option value="interview">Interview</option>
              <option value="brief">Brief</option>
              <option value="gallery">Gallery</option>
              <option value="editorial-note">Editorial Note</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Status</span>
            <select
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              disabled={disabled || isSubmitting}
            >
              <option value="uploaded">Uploaded</option>
              <option value="structured">Structured</option>
              <option value="approved">Approved</option>
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Priority</span>
            <select
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              disabled={disabled || isSubmitting}
            >
              <option value="1">1 · Low</option>
              <option value="2">2</option>
              <option value="3">3 · Standard</option>
              <option value="4">4</option>
              <option value="5">5 · High</option>
            </select>
          </label>
        </div>

        {sourceType === "text" ? (
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Raw Text</span>
            <textarea
              className="min-h-56 w-full rounded-3xl border border-line bg-white px-4 py-4 outline-none transition focus:border-accent"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Paste article copy, research notes, transcript segments, or any raw editorial text here."
              disabled={disabled || isSubmitting}
            />
          </label>
        ) : (
          <label className="block space-y-2 text-sm">
            <span className="font-medium">
              {sourceType === "pdf" ? "PDF File" : "Image File"}
            </span>
            <input
              key={fileInputKey}
              type="file"
              accept={sourceType === "pdf" ? "application/pdf" : "image/*"}
              className="w-full rounded-3xl border border-dashed border-line bg-white px-4 py-6 text-sm"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              disabled={disabled || isSubmitting}
            />
            <p className="text-xs leading-6 text-ink-soft">
              File uploads are stored in Supabase Storage and linked back to a content record for this issue.
            </p>
          </label>
        )}

        {error ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">
            Parsing and structuring will be added later. This step only captures source material cleanly.
          </p>
          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className="rounded-full bg-[#201a17] px-5 py-3 text-sm font-medium text-[#f8f3ea] transition hover:bg-[#352a25] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Uploading..." : "Add Content"}
          </button>
        </div>
      </form>
    </section>
  );
}
