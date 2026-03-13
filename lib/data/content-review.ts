import { normalizeStructuredEditorialContent } from "@/lib/content/structured-content";
import { createClient } from "@/lib/supabase/server";
import type { IssueContentListItem } from "@/lib/types/domain";

interface ContentReviewRow {
  id: string;
  issue_id: string | null;
  title: string;
  content_type: string;
  raw_text: string | null;
  status: string;
  priority: number;
  ingestion_source: string;
  analysis_status: string;
  analysis_error: string | null;
  analysis_model: string | null;
  analysis_provider: string | null;
  structured_content: unknown;
}

interface IssueRow {
  id: string;
  title: string;
  issue_number: number;
  project_id: string;
}

export async function getContentReviewData(contentId: string): Promise<{
  content: IssueContentListItem | null;
  issue:
    | {
        id: string;
        title: string;
        issueNumber: number;
        projectName: string;
      }
    | null;
  mode: "live" | "mock";
  error: string | null;
}> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      content: null,
      issue: null,
      mode: "mock",
      error: "Add Supabase env keys to enable content review.",
    };
  }

  try {
    const supabase = await createClient();
    const contentQuery = await supabase
      .from("contents")
      .select(
        "id, issue_id, title, content_type, raw_text, status, priority, ingestion_source, analysis_status, analysis_error, analysis_model, analysis_provider, structured_content",
      )
      .eq("id", contentId)
      .maybeSingle();
    const row = contentQuery.data as ContentReviewRow | null;

    if (contentQuery.error) {
      return { content: null, issue: null, mode: "live", error: contentQuery.error.message };
    }

    if (!row) {
      return { content: null, issue: null, mode: "live", error: "Content item not found." };
    }

    let issueData: { id: string; title: string; issueNumber: number; projectName: string } | null = null;

    if (row.issue_id) {
      const issueQuery = await supabase
        .from("issues")
        .select("id, title, issue_number, project_id")
        .eq("id", row.issue_id)
        .maybeSingle();
      const issueRow = issueQuery.data as IssueRow | null;

      if (issueRow) {
        const projectQuery = await supabase
          .from("projects")
          .select("name")
          .eq("id", issueRow.project_id)
          .maybeSingle();

        issueData = {
          id: issueRow.id,
          title: issueRow.title,
          issueNumber: issueRow.issue_number,
          projectName: (projectQuery.data as { name: string } | null)?.name ?? "Untitled project",
        };
      }
    }

    return {
      content: {
        id: row.id,
        title: row.title,
        contentType: row.content_type,
        ingestionSource: row.ingestion_source as IssueContentListItem["ingestionSource"],
        rawText: row.raw_text,
        status: row.status as IssueContentListItem["status"],
        priority: row.priority,
        createdAt: new Date().toISOString(),
        assetFileName: null,
        assetKind: null,
        analysisStatus: row.analysis_status as IssueContentListItem["analysisStatus"],
        structuredContent: row.structured_content
          ? normalizeStructuredEditorialContent(row.structured_content)
          : null,
        analysisError: row.analysis_error,
        analysisModel: row.analysis_model,
        analysisProvider: row.analysis_provider,
      },
      issue: issueData,
      mode: "live",
      error: null,
    };
  } catch (error) {
    return {
      content: null,
      issue: null,
      mode: "mock",
      error: error instanceof Error ? error.message : "Unknown content review error.",
    };
  }
}
