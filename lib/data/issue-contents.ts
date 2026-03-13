import type { IssueContentListItem } from "@/lib/types/domain";
import { createClient } from "@/lib/supabase/server";

interface IssueMeta {
  id: string;
  title: string;
  issueNumber: number;
  status: string;
  projectId: string;
  projectName: string;
  ownerId: string;
}

interface IssueRow {
  id: string;
  title: string;
  issue_number: number;
  status: string;
  project_id: string;
  owner_id: string;
}

interface ContentRow {
  analysis_error: string | null;
  analysis_model: string | null;
  analysis_provider: string | null;
  analysis_status: string;
  id: string;
  title: string;
  content_type: string;
  ingestion_source: string;
  raw_text: string | null;
  status: string;
  priority: number;
  created_at: string;
  body: unknown;
  structured_content: unknown;
}

export async function getIssueContentPageData(issueId: string): Promise<{
  issue: IssueMeta | null;
  contents: IssueContentListItem[];
  mode: "live" | "mock";
  error: string | null;
}> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      issue: null,
      contents: [],
      mode: "mock",
      error: "Add Supabase env keys to enable uploads and live issue content.",
    };
  }

  try {
    const supabase = await createClient();

    const issueQuery = await supabase
      .from("issues")
      .select("id, title, issue_number, status, project_id, owner_id")
      .eq("id", issueId)
      .maybeSingle();
    const issueRow = issueQuery.data as IssueRow | null;
    const issueError = issueQuery.error;

    if (issueError) {
      return {
        issue: null,
        contents: [],
        mode: "live",
        error: issueError.message,
      };
    }

    if (!issueRow) {
      return {
        issue: null,
        contents: [],
        mode: "live",
        error: "Issue not found in Supabase.",
      };
    }

    const projectQuery = await supabase
      .from("projects")
      .select("name")
      .eq("id", issueRow.project_id)
      .maybeSingle();
    const projectRow = projectQuery.data as { name: string } | null;

    const contentQuery = await supabase
      .from("contents")
      .select("id, title, content_type, ingestion_source, raw_text, status, priority, created_at, body, structured_content, analysis_status, analysis_error, analysis_model, analysis_provider")
      .eq("issue_id", issueId)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    const contentRows = (contentQuery.data ?? []) as ContentRow[];
    const contentError = contentQuery.error;

    if (contentError) {
      return {
        issue: {
          id: issueRow.id,
          title: issueRow.title,
          issueNumber: issueRow.issue_number,
          status: issueRow.status,
          projectId: issueRow.project_id,
          projectName: projectRow?.name ?? "Untitled project",
          ownerId: issueRow.owner_id,
        },
        contents: [],
        mode: "live",
        error: contentError.message,
      };
    }

    const contents: IssueContentListItem[] = contentRows.map((row) => {
      const assetMeta =
        row.body && typeof row.body === "object" && !Array.isArray(row.body) && "asset" in row.body
          ? row.body.asset
          : null;

      return {
        id: row.id,
        title: row.title,
        contentType: row.content_type,
        ingestionSource: row.ingestion_source as IssueContentListItem["ingestionSource"],
        rawText: row.raw_text,
        status: row.status as IssueContentListItem["status"],
        priority: row.priority,
        createdAt: row.created_at,
        assetId:
          assetMeta && typeof assetMeta === "object" && !Array.isArray(assetMeta) && "id" in assetMeta
            ? String(assetMeta.id)
            : null,
        analysisStatus: row.analysis_status as IssueContentListItem["analysisStatus"],
        structuredContent:
          row.structured_content &&
          typeof row.structured_content === "object" &&
          !Array.isArray(row.structured_content)
            ? (row.structured_content as IssueContentListItem["structuredContent"])
            : null,
        analysisError: row.analysis_error,
        analysisModel: row.analysis_model,
        analysisProvider: row.analysis_provider,
        assetFileName:
          assetMeta && typeof assetMeta === "object" && !Array.isArray(assetMeta) && "fileName" in assetMeta
            ? String(assetMeta.fileName)
            : null,
        assetKind:
          assetMeta && typeof assetMeta === "object" && !Array.isArray(assetMeta) && "kind" in assetMeta
            ? (String(assetMeta.kind) as IssueContentListItem["assetKind"])
            : null,
      };
    });

    return {
      issue: {
        id: issueRow.id,
        title: issueRow.title,
        issueNumber: issueRow.issue_number,
        status: issueRow.status,
        projectId: issueRow.project_id,
        projectName: projectRow?.name ?? "Untitled project",
        ownerId: issueRow.owner_id,
      },
      contents,
      mode: "live",
      error: null,
    };
  } catch (error) {
    return {
      issue: null,
      contents: [],
      mode: "mock",
      error: error instanceof Error ? error.message : "Unknown issue content loading error.",
    };
  }
}
