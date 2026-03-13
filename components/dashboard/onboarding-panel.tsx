"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OnboardingPanel({
  hasWorkspace,
  latestIssueId,
  latestIssueTitle,
  latestProjectName,
  mode,
}: {
  hasWorkspace: boolean;
  latestIssueId: string | null;
  latestIssueTitle: string | null;
  latestProjectName: string | null;
  mode: "live" | "mock";
}) {
  const router = useRouter();
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSeedDemo() {
    setError(null);
    setIsSeeding(true);

    try {
      const response = await fetch("/api/demo/seed", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        issueId?: string;
      };

      if (!response.ok || !payload.issueId) {
        throw new Error(payload.error ?? "Could not create demo workspace.");
      }

      router.push(`/issues/${payload.issueId}`);
      router.refresh();
    } catch (seedError) {
      setError(
        seedError instanceof Error ? seedError.message : "Could not create demo workspace.",
      );
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <section className="panel overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 lg:p-7">
          <p className="eyebrow">Onboarding</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {hasWorkspace ? "Keep exploring your editorial sandbox" : "Create a demo editorial workspace"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
            {hasWorkspace
              ? "You already have data in the system. Jump back into the latest issue or spin up another demo workspace to test the full flow again."
              : "Seed a realistic sample project, issue, structured content set, and generated pages so you can demo the whole product without manual setup."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSeedDemo}
              disabled={mode !== "live" || isSeeding}
              className="rounded-full bg-[#201a17] px-5 py-3 text-sm font-medium text-[#f8f3ea] transition hover:bg-[#352a25] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSeeding ? "Creating Demo..." : "Create Demo Workspace"}
            </button>
            {latestIssueId ? (
              <Link
                href={`/issues/${latestIssueId}`}
                className="rounded-full border border-line px-5 py-3 text-sm font-medium transition hover:bg-surface-muted"
              >
                Open Latest Issue
              </Link>
            ) : null}
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {mode !== "live" ? (
            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Add Supabase environment keys first. Demo seeding needs a live database connection.
            </div>
          ) : null}
        </div>

        <div className="grid-stripes border-t border-line bg-[#efe4d2] p-6 lg:border-t-0 lg:border-l lg:p-7">
          <p className="eyebrow">Demo Includes</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-ink-soft">
            <p>1 project and 1 issue with realistic editorial naming.</p>
            <p>3 text content items spanning uploaded, structured, and approved states.</p>
            <p>Pre-seeded structured JSON so page generation has something meaningful to work with.</p>
            <p>Templates and a starter page set for review, reorder, locking, publishing, and PDF export.</p>
          </div>

          {latestIssueId ? (
            <div className="mt-6 rounded-3xl border border-line bg-surface p-4">
              <p className="eyebrow">Latest Workspace</p>
              <h3 className="mt-2 text-xl font-semibold">{latestIssueTitle ?? "Issue ready"}</h3>
              <p className="mt-2 text-sm text-ink-soft">
                {latestProjectName ? `Project: ${latestProjectName}` : "Recent issue available"}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
