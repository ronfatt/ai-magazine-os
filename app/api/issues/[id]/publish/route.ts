import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getIssueAccess, hasRequiredRole } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

interface IssueLookup {
  id: string;
}

interface ContentPublishRow {
  status: string;
  analysis_status: string;
  ingestion_source: string;
  structured_content: unknown;
}

interface PagePublishRow {
  status: string;
  locked: boolean | null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: issueId } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before publishing issues." }, { status: 401 });
    }

    const issueAccess = await getIssueAccess(issueId, user.id);

    if (!issueAccess) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }

    if (!hasRequiredRole(issueAccess.role, "admin")) {
      return NextResponse.json({ error: "You do not have publish access for this issue." }, { status: 403 });
    }

    const supabase = createAdminClient();

    const issueQuery = await supabase
      .from("issues")
      .select("id")
      .eq("id", issueId)
      .maybeSingle();
    const issue = issueQuery.data as IssueLookup | null;

    if (issueQuery.error) {
      return NextResponse.json({ error: issueQuery.error.message }, { status: 500 });
    }

    if (!issue) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }

    const contentsQuery = await supabase
      .from("contents")
      .select("status, analysis_status, ingestion_source, structured_content")
      .eq("issue_id", issueId);
    const contentRows = (contentsQuery.data ?? []) as ContentPublishRow[];

    if (contentsQuery.error) {
      return NextResponse.json({ error: contentsQuery.error.message }, { status: 500 });
    }

    const pagesQuery = await supabase
      .from("pages")
      .select("status, locked")
      .eq("issue_id", issueId);
    const pageRows = (pagesQuery.data ?? []) as PagePublishRow[];

    if (pagesQuery.error) {
      return NextResponse.json({ error: pagesQuery.error.message }, { status: 500 });
    }

    if (contentRows.length === 0) {
      return NextResponse.json({ error: "No contents found for this issue." }, { status: 400 });
    }

    if (pageRows.length === 0) {
      return NextResponse.json({ error: "Generate pages before publishing." }, { status: 400 });
    }

    const hasUnapprovedContent = contentRows.some((row) => row.status !== "approved");
    const hasFailedOrPendingAnalysis = contentRows.some(
      (row) =>
        row.ingestion_source === "text" &&
        (row.analysis_status !== "completed" || !row.structured_content),
    );
    const hasUnreviewedPages = pageRows.some(
      (row) => row.status !== "reviewed" && row.status !== "published",
    );
    const hasUnlockedPages = pageRows.some((row) => !row.locked);

    if (hasUnapprovedContent || hasFailedOrPendingAnalysis || hasUnreviewedPages || hasUnlockedPages) {
      return NextResponse.json(
        {
          error:
            "Issue is not publish-ready. Ensure all contents are approved, all text is structured, all pages are reviewed, and all pages are locked.",
        },
        { status: 400 },
      );
    }

    const pageUpdate: Database["public"]["Tables"]["pages"]["Update"] = {
      status: "published",
    };
    const issueUpdate: Database["public"]["Tables"]["issues"]["Update"] = {
      status: "published",
      publish_at: new Date().toISOString(),
    };

    const [pagesUpdateQuery, issueUpdateQuery] = await Promise.all([
      supabase.from("pages").update(pageUpdate as never).eq("issue_id", issueId),
      supabase.from("issues").update(issueUpdate as never).eq("id", issueId),
    ]);

    if (pagesUpdateQuery.error) {
      return NextResponse.json({ error: pagesUpdateQuery.error.message }, { status: 500 });
    }

    if (issueUpdateQuery.error) {
      return NextResponse.json({ error: issueUpdateQuery.error.message }, { status: 500 });
    }

    revalidatePath(`/issues/${issueId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not publish issue." },
      { status: 500 },
    );
  }
}
