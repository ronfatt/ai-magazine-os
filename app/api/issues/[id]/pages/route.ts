import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getIssueAccess, hasRequiredRole } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { buildPagesForIssue } from "@/lib/data/page-generation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";
import type { IssueContentListItem, TemplateRecord } from "@/lib/types/domain";

interface IssueLookup {
  id: string;
  owner_id: string;
  project_id: string;
}

interface ContentRow {
  id: string;
  title: string;
  content_type: string;
  ingestion_source: string;
  raw_text: string | null;
  status: string;
  priority: number;
  created_at: string;
  structured_content: unknown;
}

interface TemplateRow {
  id: string;
  name: string;
  category: string | null;
  preview_url: string | null;
  scope: string;
  brand_id: string | null;
  owner_id: string;
  layout_spec: unknown;
  created_at: string;
}

export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: issueId } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before generating pages." }, { status: 401 });
    }

    const issueAccess = await getIssueAccess(issueId, user.id);

    if (!issueAccess) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }

    if (!hasRequiredRole(issueAccess.role, "editor")) {
      return NextResponse.json({ error: "You do not have page generation access for this issue." }, { status: 403 });
    }

    const supabase = createAdminClient();

    const issueQuery = await supabase
      .from("issues")
      .select("id, owner_id, project_id")
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
      .select("id, title, content_type, ingestion_source, raw_text, status, priority, created_at, structured_content")
      .eq("issue_id", issueId)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });
    const contentRows = (contentsQuery.data ?? []) as ContentRow[];

    if (contentsQuery.error) {
      return NextResponse.json({ error: contentsQuery.error.message }, { status: 500 });
    }

    const templatesQuery = await supabase
      .from("templates")
      .select("id, name, category, preview_url, scope, brand_id, owner_id, layout_spec, created_at")
      .eq("owner_id", issueAccess.ownerId)
      .order("created_at", { ascending: true });
    const templateRows = (templatesQuery.data ?? []) as TemplateRow[];

    if (templatesQuery.error) {
      return NextResponse.json({ error: templatesQuery.error.message }, { status: 500 });
    }

    const contents: IssueContentListItem[] = contentRows.map((row) => ({
      id: row.id,
      title: row.title,
      contentType: row.content_type,
      ingestionSource: row.ingestion_source as IssueContentListItem["ingestionSource"],
      rawText: row.raw_text,
      status: row.status as IssueContentListItem["status"],
      priority: row.priority,
      createdAt: row.created_at,
      assetFileName: null,
      assetKind: null,
      analysisStatus: row.structured_content ? "completed" : "pending",
      structuredContent:
        row.structured_content &&
        typeof row.structured_content === "object" &&
        !Array.isArray(row.structured_content)
          ? (row.structured_content as IssueContentListItem["structuredContent"])
          : null,
      analysisError: null,
      analysisModel: null,
      analysisProvider: null,
    }));

    const templates: TemplateRecord[] = templateRows.map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      brandId: row.brand_id,
      name: row.name,
      category: row.category ?? "feature",
      previewUrl: row.preview_url,
      scope: row.scope as TemplateRecord["scope"],
      layoutSpec: row.layout_spec as TemplateRecord["layoutSpec"],
      createdAt: row.created_at,
    }));

    const pagesToCreate = buildPagesForIssue({ contents, templates });

    if (pagesToCreate.length === 0) {
      return NextResponse.json(
        { error: "Analyze at least one text content item before generating pages." },
        { status: 400 },
      );
    }

    await supabase.from("pages").delete().eq("issue_id", issueId);

    const insertPayload: Array<Database["public"]["Tables"]["pages"]["Insert"]> = pagesToCreate.map((page) => ({
      owner_id: issue.owner_id,
      project_id: issue.project_id,
      issue_id: issueId,
      template_id: page.templateId,
      page_number: page.pageNumber,
      page_role: page.pageRole,
      layout_json:
        page.layoutJson as unknown as Database["public"]["Tables"]["pages"]["Row"]["layout_json"],
      content_snapshot:
        {
          sourceContentIds: page.layoutJson.sourceContentIds,
          generatedFrom: "structured-editorial-content",
        } as Database["public"]["Tables"]["pages"]["Row"]["content_snapshot"],
      status: page.status,
      locked: page.locked,
    }));

    const insertQuery = await supabase.from("pages").insert(insertPayload as never);

    if (insertQuery.error) {
      return NextResponse.json({ error: insertQuery.error.message }, { status: 500 });
    }

    revalidatePath(`/issues/${issueId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected page generation error." },
      { status: 500 },
    );
  }
}
