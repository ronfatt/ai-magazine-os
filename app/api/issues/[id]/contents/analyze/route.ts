import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { structureTextContentWithOpenAI } from "@/lib/ai/content-structuring";
import { getIssueAccess, hasRequiredRole } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

interface BatchContentRow {
  id: string;
  title: string;
  content_type: string;
  raw_text: string | null;
  ingestion_source: string;
  analysis_status: string;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: issueId } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before analyzing content." }, { status: 401 });
    }

    const issueAccess = await getIssueAccess(issueId, user.id);

    if (!issueAccess) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }

    if (!hasRequiredRole(issueAccess.role, "editor")) {
      return NextResponse.json({ error: "You do not have analysis access for this issue." }, { status: 403 });
    }

    const supabase = createAdminClient();
    const query = await supabase
      .from("contents")
      .select("id, title, content_type, raw_text, ingestion_source, analysis_status")
      .eq("issue_id", issueId)
      .eq("ingestion_source", "text")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });
    const rows = (query.data ?? []) as BatchContentRow[];

    if (query.error) {
      return NextResponse.json({ error: query.error.message }, { status: 500 });
    }

    const eligibleRows = rows.filter(
      (row) =>
        row.raw_text?.trim() &&
        (row.analysis_status === "pending" || row.analysis_status === "failed"),
    );

    if (eligibleRows.length === 0) {
      return NextResponse.json(
        { error: "No eligible text items are waiting for analysis." },
        { status: 400 },
      );
    }

    let processed = 0;

    for (const row of eligibleRows) {
      const processingUpdate: Database["public"]["Tables"]["contents"]["Update"] = {
        analysis_status: "processing",
        analysis_error: null,
      };

      await supabase
        .from("contents")
        .update(processingUpdate as never)
        .eq("id", row.id);

      try {
        const result = await structureTextContentWithOpenAI({
          title: row.title,
          contentType: row.content_type,
          rawText: row.raw_text ?? "",
        });

        const completedUpdate: Database["public"]["Tables"]["contents"]["Update"] = {
          structured_content: result.structuredContentJson,
          analysis_status: "completed",
          analysis_error: null,
          analysis_provider: result.provider,
          analysis_model: result.model,
          analyzed_at: new Date().toISOString(),
          status: "structured",
        };

        await supabase
          .from("contents")
          .update(completedUpdate as never)
          .eq("id", row.id);
        processed += 1;
      } catch (error) {
        const failedUpdate: Database["public"]["Tables"]["contents"]["Update"] = {
          analysis_status: "failed",
          analysis_error: error instanceof Error ? error.message : "Unknown analysis failure.",
        };

        await supabase
          .from("contents")
          .update(failedUpdate as never)
          .eq("id", row.id);
      }
    }

    revalidatePath(`/issues/${issueId}`);

    return NextResponse.json({
      ok: true,
      processed,
      totalEligible: eligibleRows.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Batch analysis failed.",
      },
      { status: 500 },
    );
  }
}
