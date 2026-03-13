import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { structureTextContentWithOpenAI } from "@/lib/ai/content-structuring";
import { getContentAccess, hasRequiredRole } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

interface ContentLookup {
  id: string;
  issue_id: string | null;
  title: string;
  content_type: string;
  raw_text: string | null;
  ingestion_source: string;
}

export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ contentId: string }> },
) {
  const { contentId } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before analyzing content." }, { status: 401 });
    }

    const contentAccess = await getContentAccess(contentId, user.id);

    if (!contentAccess) {
      return NextResponse.json({ error: "Content item not found." }, { status: 404 });
    }

    if (!hasRequiredRole(contentAccess.role, "editor")) {
      return NextResponse.json({ error: "You do not have analysis access for this content item." }, { status: 403 });
    }

    const supabase = createAdminClient();

    const lookupQuery = await supabase
      .from("contents")
      .select("id, issue_id, title, content_type, raw_text, ingestion_source")
      .eq("id", contentId)
      .maybeSingle();
    const contentRow = lookupQuery.data as ContentLookup | null;

    if (lookupQuery.error) {
      return NextResponse.json({ error: lookupQuery.error.message }, { status: 500 });
    }

    if (!contentRow) {
      return NextResponse.json({ error: "Content item not found." }, { status: 404 });
    }

    if (contentRow.ingestion_source !== "text") {
      return NextResponse.json(
        { error: "Only pasted text content can be analyzed right now." },
        { status: 400 },
      );
    }

    if (!contentRow.raw_text?.trim()) {
      return NextResponse.json({ error: "No raw text found for this content item." }, { status: 400 });
    }

    const processingUpdate: Database["public"]["Tables"]["contents"]["Update"] = {
      analysis_status: "processing",
      analysis_error: null,
    };

    await supabase
      .from("contents")
      .update(processingUpdate as never)
      .eq("id", contentId);

    try {
      const result = await structureTextContentWithOpenAI({
        title: contentRow.title,
        contentType: contentRow.content_type,
        rawText: contentRow.raw_text,
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

      const updateQuery = await supabase
        .from("contents")
        .update(completedUpdate as never)
        .eq("id", contentId);

      if (updateQuery.error) {
        return NextResponse.json({ error: updateQuery.error.message }, { status: 500 });
      }
    } catch (error) {
      const failedUpdate: Database["public"]["Tables"]["contents"]["Update"] = {
        analysis_status: "failed",
        analysis_error: error instanceof Error ? error.message : "Unknown analysis failure.",
      };

      await supabase
        .from("contents")
        .update(failedUpdate as never)
        .eq("id", contentId);

      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Analysis failed.",
        },
        { status: 500 },
      );
    }

    if (contentRow.issue_id) {
      revalidatePath(`/issues/${contentRow.issue_id}`);
    }
    revalidatePath(`/contents/${contentId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected analysis error.",
      },
      { status: 500 },
    );
  }
}
