import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getPageAccess, hasRequiredRole } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { buildSinglePage } from "@/lib/data/page-generation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";
import type { IssueContentListItem, TemplateRecord } from "@/lib/types/domain";

interface PageLookup {
  id: string;
  issue_id: string;
  page_number: number;
  page_role: "feature" | "section" | "closing";
  content_snapshot: unknown;
  locked: boolean;
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

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before regenerating pages." }, { status: 401 });
    }

    const pageAccess = await getPageAccess(pageId, user.id);

    if (!pageAccess) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    if (!hasRequiredRole(pageAccess.role, "editor")) {
      return NextResponse.json({ error: "You do not have regenerate access for this page." }, { status: 403 });
    }

    const supabase = createAdminClient();
    const pageQuery = await supabase
      .from("pages")
      .select("id, issue_id, page_number, page_role, content_snapshot, locked")
      .eq("id", pageId)
      .maybeSingle();
    const pageRow = pageQuery.data as PageLookup | null;

    if (pageQuery.error) {
      return NextResponse.json({ error: pageQuery.error.message }, { status: 500 });
    }

    if (!pageRow) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    if (pageRow.locked) {
      return NextResponse.json({ error: "Unlock the page before regenerating it." }, { status: 400 });
    }

    const snapshot =
      pageRow.content_snapshot &&
      typeof pageRow.content_snapshot === "object" &&
      !Array.isArray(pageRow.content_snapshot)
        ? (pageRow.content_snapshot as Record<string, unknown>)
        : {};
    const sourceContentIds = Array.isArray(snapshot.sourceContentIds)
      ? snapshot.sourceContentIds.filter((value): value is string => typeof value === "string")
      : [];

    if (sourceContentIds.length === 0) {
      return NextResponse.json({ error: "Page has no source content references." }, { status: 400 });
    }

    const contentQuery = await supabase
      .from("contents")
      .select("id, title, content_type, ingestion_source, raw_text, status, priority, created_at, structured_content")
      .in("id", sourceContentIds)
      .order("priority", { ascending: false });
    const contentRows = (contentQuery.data ?? []) as ContentRow[];

    if (contentQuery.error || contentRows.length === 0) {
      return NextResponse.json(
        { error: contentQuery.error?.message ?? "Source content could not be loaded." },
        { status: 500 },
      );
    }

    const templatesQuery = await supabase
      .from("templates")
      .select("id, name, category, preview_url, scope, brand_id, owner_id, layout_spec, created_at")
      .eq("owner_id", pageAccess.ownerId);
    const templateRows = (templatesQuery.data ?? []) as TemplateRow[];

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

    const targetContent = contents[0];
    const regeneratedPage = buildSinglePage({
      content: targetContent,
      templates,
      pageNumber: pageRow.page_number,
      pageRole: pageRow.page_role,
    });

    const update: Database["public"]["Tables"]["pages"]["Update"] = {
      template_id: regeneratedPage.templateId,
      layout_json:
        regeneratedPage.layoutJson as unknown as Database["public"]["Tables"]["pages"]["Row"]["layout_json"],
      content_snapshot:
        {
          sourceContentIds: regeneratedPage.layoutJson.sourceContentIds,
          generatedFrom: "structured-editorial-content",
        } as Database["public"]["Tables"]["pages"]["Row"]["content_snapshot"],
      status: "generated",
    };

    const updateQuery = await supabase
      .from("pages")
      .update(update as never)
      .eq("id", pageId);

    if (updateQuery.error) {
      return NextResponse.json({ error: updateQuery.error.message }, { status: 500 });
    }

    revalidatePath(`/issues/${pageRow.issue_id}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not regenerate page." },
      { status: 500 },
    );
  }
}
