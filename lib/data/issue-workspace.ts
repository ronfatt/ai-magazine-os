import type { IssuePageListItem, TemplateRecord } from "@/lib/types/domain";

import { buildMockIssuePages } from "@/lib/data/page-generation";
import { defaultTemplateBlueprints } from "@/lib/data/templates";
import { getIssueContentPageData } from "@/lib/data/issue-contents";
import { createClient } from "@/lib/supabase/server";

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

interface PageRow {
  id: string;
  template_id: string | null;
  page_number: number;
  page_role: string;
  status: string;
  locked: boolean | null;
  layout_json: unknown;
  templates:
    | {
        name: string;
        category: string | null;
      }
    | null
    | Array<{ name: string; category: string | null }>;
}

export async function getIssueWorkspaceData(issueId: string): Promise<
  Awaited<ReturnType<typeof getIssueContentPageData>> & {
    pages: IssuePageListItem[];
    templates: TemplateRecord[];
  }
> {
  const base = await getIssueContentPageData(issueId);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      ...base,
      templates: defaultTemplateBlueprints.map((template, index) => ({
        id: `mock-template-${index + 1}`,
        ownerId: "mock-owner",
        brandId: null,
        name: template.name,
        category: template.category,
        previewUrl: template.previewUrl,
        scope: template.scope,
        layoutSpec: template.layoutSpec,
        createdAt: new Date().toISOString(),
      })),
      pages: buildMockIssuePages(base.contents),
    };
  }

  try {
    const supabase = await createClient();

    const templatesQuery = await supabase
      .from("templates")
      .select("id, name, category, preview_url, scope, brand_id, owner_id, layout_spec, created_at")
      .order("created_at", { ascending: true });
    const templateRows = (templatesQuery.data ?? []) as TemplateRow[];

    const pagesQuery = await supabase
      .from("pages")
      .select("id, template_id, page_number, page_role, status, locked, layout_json, templates(name, category)")
      .eq("issue_id", issueId)
      .order("page_number", { ascending: true });
    const pageRows = (pagesQuery.data ?? []) as PageRow[];

    const templates: TemplateRecord[] =
      templateRows.length > 0
        ? templateRows.map((row) => ({
            id: row.id,
            ownerId: row.owner_id,
            brandId: row.brand_id,
            name: row.name,
            category: row.category ?? "feature",
            previewUrl: row.preview_url,
            scope: row.scope as TemplateRecord["scope"],
            layoutSpec: row.layout_spec as TemplateRecord["layoutSpec"],
            createdAt: row.created_at,
          }))
        : defaultTemplateBlueprints.map((template, index) => ({
            id: `mock-template-${index + 1}`,
            ownerId: "mock-owner",
            brandId: null,
            name: template.name,
            category: template.category,
            previewUrl: template.previewUrl,
            scope: template.scope,
            layoutSpec: template.layoutSpec,
            createdAt: new Date().toISOString(),
          }));

    const pages: IssuePageListItem[] =
      pageRows.length > 0
        ? pageRows.map((row) => ({
            id: row.id,
            templateId: row.template_id,
            pageNumber: row.page_number,
            pageRole: row.page_role,
            status: row.status as IssuePageListItem["status"],
            locked: Boolean(row.locked),
            templateName:
              Array.isArray(row.templates) || !row.templates ? null : row.templates.name,
            templateCategory:
              Array.isArray(row.templates) || !row.templates ? null : row.templates.category,
            layoutJson:
              row.layout_json && typeof row.layout_json === "object" && !Array.isArray(row.layout_json)
                ? (row.layout_json as IssuePageListItem["layoutJson"])
                : null,
          }))
        : buildMockIssuePages(base.contents);

    return {
      ...base,
      templates,
      pages,
    };
  } catch {
    return {
      ...base,
      templates: defaultTemplateBlueprints.map((template, index) => ({
        id: `mock-template-${index + 1}`,
        ownerId: "mock-owner",
        brandId: null,
        name: template.name,
        category: template.category,
        previewUrl: template.previewUrl,
        scope: template.scope,
        layoutSpec: template.layoutSpec,
        createdAt: new Date().toISOString(),
      })),
      pages: buildMockIssuePages(base.contents),
    };
  }
}
