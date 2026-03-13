import "server-only";

import { structuredContentToDatabaseJson } from "@/lib/content/structured-content";
import { buildPagesForIssue } from "@/lib/data/page-generation";
import { defaultTemplateBlueprints } from "@/lib/data/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";
import type { IssueContentListItem, StructuredEditorialContent, TemplateRecord } from "@/lib/types/domain";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildDemoStructuredContent(input: {
  title: string;
  subtitle: string;
  summary: string;
  category: string;
  suggestedPages: number;
  sections: Array<{ heading: string; summary: string; keyPoints: string[] }>;
  quotes: Array<{ quote: string; speaker: string | null; context: string }>;
}): StructuredEditorialContent {
  return {
    title: input.title,
    subtitle: input.subtitle,
    summary: input.summary,
    category: input.category,
    suggestedPages: input.suggestedPages,
    sections: input.sections,
    quotes: input.quotes,
  };
}

export async function seedDemoWorkspace(input: { ownerId: string; email?: string | null }) {
  const supabase = createAdminClient();
  const stamp = Date.now();
  const ownerId = input.ownerId;
  const profileInsert: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: ownerId,
    email: input.email ?? null,
    full_name: "AI Magazine OS Editor",
  };
  await supabase.from("profiles").upsert(profileInsert as never);

  const brandName = "Northstar Journal";
  const projectName = "Northstar Journal";
  const issueTitle = "Signals and Stories";
  const issueNumber = Number(String(stamp).slice(-3));

  const brandInsert: Database["public"]["Tables"]["brands"]["Insert"] = {
    owner_id: ownerId,
    name: brandName,
    slug: `${slugify(brandName)}-${stamp}`,
    primary_color: "#A64B2A",
    accent_color: "#1D1A17",
    typography_scale: {
      display: "64px",
      body: "18px",
      caption: "13px",
    },
  };
  const brandQuery = await supabase.from("brands").insert(brandInsert as never).select("id").single();
  const brandId = (brandQuery.data as { id: string } | null)?.id;

  if (brandQuery.error || !brandId) {
    throw new Error(brandQuery.error?.message ?? "Could not create demo brand.");
  }

  const projectInsert: Database["public"]["Tables"]["projects"]["Insert"] = {
    owner_id: ownerId,
    brand_id: brandId,
    name: projectName,
    slug: `${slugify(projectName)}-${stamp}`,
    description: "Demo editorial workspace seeded for onboarding.",
    status: "active",
  };
  const projectQuery = await supabase
    .from("projects")
    .insert(projectInsert as never)
    .select("id")
    .single();
  const projectId = (projectQuery.data as { id: string } | null)?.id;

  if (projectQuery.error || !projectId) {
    throw new Error(projectQuery.error?.message ?? "Could not create demo project.");
  }

  const issueInsert: Database["public"]["Tables"]["issues"]["Insert"] = {
    owner_id: ownerId,
    project_id: projectId,
    issue_number: issueNumber,
    title: issueTitle,
    status: "in_review",
  };
  const issueQuery = await supabase.from("issues").insert(issueInsert as never).select("id").single();
  const issueId = (issueQuery.data as { id: string } | null)?.id;

  if (issueQuery.error || !issueId) {
    throw new Error(issueQuery.error?.message ?? "Could not create demo issue.");
  }

  const templateRows: TemplateRecord[] = [];
  for (const template of defaultTemplateBlueprints) {
    const templateInsert: Database["public"]["Tables"]["templates"]["Insert"] = {
      owner_id: ownerId,
      brand_id: brandId,
      name: template.name,
      category: template.category,
      scope: template.scope,
      preview_url: template.previewUrl,
      layout_spec: template.layoutSpec as unknown as Database["public"]["Tables"]["templates"]["Row"]["layout_spec"],
    };

    const templateInsertQuery = await supabase
      .from("templates")
      .insert(templateInsert as never)
      .select("id, name, category, preview_url, scope, brand_id, owner_id, layout_spec, created_at")
      .single();
    const templateData = templateInsertQuery.data as
      | {
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
      | null;

    if (templateInsertQuery.error || !templateData) {
      throw new Error(templateInsertQuery.error?.message ?? "Could not create demo templates.");
    }

    templateRows.push({
      id: templateData.id,
      ownerId: templateData.owner_id,
      brandId: templateData.brand_id,
      name: templateData.name,
      category: templateData.category ?? "feature",
      previewUrl: templateData.preview_url,
      scope: templateData.scope as TemplateRecord["scope"],
      layoutSpec: templateData.layout_spec as TemplateRecord["layoutSpec"],
      createdAt: templateData.created_at,
    });
  }

  const structuredFeature = buildDemoStructuredContent({
    title: "The New Signal Economy",
    subtitle: "How niche communities are turning private momentum into public media",
    summary:
      "A feature story about how small expert communities are building trust, taste, and recurring value through editorial systems instead of social feeds.",
    category: "feature",
    suggestedPages: 3,
    sections: [
      {
        heading: "A shift away from feeds",
        summary: "Audiences are moving toward slower, higher-trust formats that reward curation.",
        keyPoints: ["Feeds are noisy", "Editorial framing increases trust", "Communities want continuity"],
      },
      {
        heading: "The role of structured publishing",
        summary: "Teams need systems that turn raw input into repeatable editorial artifacts.",
        keyPoints: ["Content must be reusable", "Templates create speed", "Review flows keep quality high"],
      },
    ],
    quotes: [
      {
        quote: "The magazine is not the output. The system is the product.",
        speaker: "Editorial lead",
        context: "Internal workshop note",
      },
    ],
  });

  const structuredClosing = buildDemoStructuredContent({
    title: "Five Editorial Signals to Watch",
    subtitle: "A short closing digest for the current issue",
    summary:
      "A concise end section that wraps the issue with practical cues, themes, and editorial observations.",
    category: "closing",
    suggestedPages: 1,
    sections: [
      {
        heading: "Signal one",
        summary: "Editorial systems win when they reduce formatting friction.",
        keyPoints: ["Speed matters", "Review matters", "Consistency compounds"],
      },
    ],
    quotes: [],
  });

  const contentSeeds: Array<
    Database["public"]["Tables"]["contents"]["Insert"] & {
      preview: IssueContentListItem;
    }
  > = [
    {
      owner_id: ownerId,
      project_id: projectId,
      issue_id: issueId,
      title: "Signal Economy Interview Notes",
      content_type: "article",
      ingestion_source: "text",
      raw_text:
        "Communities are hungry for formats that feel deliberate, trustworthy, and repeatable. Editorial systems become valuable when they make structure visible.",
      body: {
        parseStatus: "completed",
        sourceType: "text",
      },
      status: "approved",
      priority: 5,
      structured_content: structuredContentToDatabaseJson(structuredFeature),
      analysis_status: "completed",
      analysis_provider: "demo-seed",
      analysis_model: "seed",
      analysis_error: null,
      analyzed_at: new Date().toISOString(),
      preview: {
        id: "seed-1",
        title: "Signal Economy Interview Notes",
        contentType: "article",
        ingestionSource: "text",
        rawText:
          "Communities are hungry for formats that feel deliberate, trustworthy, and repeatable. Editorial systems become valuable when they make structure visible.",
        status: "approved",
        priority: 5,
        createdAt: new Date().toISOString(),
        assetFileName: null,
        assetKind: null,
        analysisStatus: "completed",
        structuredContent: structuredFeature,
        analysisError: null,
        analysisModel: "seed",
        analysisProvider: "demo-seed",
      },
    },
    {
      owner_id: ownerId,
      project_id: projectId,
      issue_id: issueId,
      title: "Closing Notes Draft",
      content_type: "brief",
      ingestion_source: "text",
      raw_text:
        "Close the issue with a short digest about what matters now: repeatable systems, thoughtful review, and strong narrative packaging.",
      body: {
        parseStatus: "completed",
        sourceType: "text",
      },
      status: "structured",
      priority: 3,
      structured_content: structuredContentToDatabaseJson(structuredClosing),
      analysis_status: "completed",
      analysis_provider: "demo-seed",
      analysis_model: "seed",
      analysis_error: null,
      analyzed_at: new Date().toISOString(),
      preview: {
        id: "seed-2",
        title: "Closing Notes Draft",
        contentType: "brief",
        ingestionSource: "text",
        rawText:
          "Close the issue with a short digest about what matters now: repeatable systems, thoughtful review, and strong narrative packaging.",
        status: "structured",
        priority: 3,
        createdAt: new Date().toISOString(),
        assetFileName: null,
        assetKind: null,
        analysisStatus: "completed",
        structuredContent: structuredClosing,
        analysisError: null,
        analysisModel: "seed",
        analysisProvider: "demo-seed",
      },
    },
    {
      owner_id: ownerId,
      project_id: projectId,
      issue_id: issueId,
      title: "Founders Letter Raw Draft",
      content_type: "editorial-note",
      ingestion_source: "text",
      raw_text:
        "This note is still rough. It explains why the issue exists and why the team is building a slower publishing rhythm.",
      body: {
        parseStatus: "pending",
        sourceType: "text",
      },
      status: "uploaded",
      priority: 2,
      structured_content: null,
      analysis_status: "pending",
      analysis_provider: null,
      analysis_model: null,
      analysis_error: null,
      analyzed_at: null,
      preview: {
        id: "seed-3",
        title: "Founders Letter Raw Draft",
        contentType: "editorial-note",
        ingestionSource: "text",
        rawText:
          "This note is still rough. It explains why the issue exists and why the team is building a slower publishing rhythm.",
        status: "uploaded",
        priority: 2,
        createdAt: new Date().toISOString(),
        assetFileName: null,
        assetKind: null,
        analysisStatus: "pending",
        structuredContent: null,
        analysisError: null,
        analysisModel: null,
        analysisProvider: null,
      },
    },
  ];

  const insertedContents: IssueContentListItem[] = [];
  for (const seed of contentSeeds) {
    const { preview, ...insert } = seed;
    const contentInsertQuery = await supabase
      .from("contents")
      .insert(insert as never)
      .select("id")
      .single();
    const contentData = contentInsertQuery.data as { id: string } | null;

    if (contentInsertQuery.error || !contentData) {
      throw new Error(contentInsertQuery.error?.message ?? "Could not create demo content.");
    }

    insertedContents.push({
      ...preview,
      id: contentData.id,
    });
  }

  const pageSeeds = buildPagesForIssue({
    contents: insertedContents.filter((content) => content.structuredContent),
    templates: templateRows,
  });

  const pageInsertPayload: Array<Database["public"]["Tables"]["pages"]["Insert"]> = pageSeeds.map((page, index) => ({
    owner_id: ownerId,
    project_id: projectId,
    issue_id: issueId,
    template_id: page.templateId,
    page_number: page.pageNumber,
    page_role: page.pageRole,
    status: index === 0 ? "reviewed" : "generated",
    locked: index === 0,
    layout_json:
      page.layoutJson as unknown as Database["public"]["Tables"]["pages"]["Row"]["layout_json"],
    content_snapshot:
      {
        sourceContentIds: page.layoutJson.sourceContentIds,
        generatedFrom: "demo-seed",
      } as Database["public"]["Tables"]["pages"]["Row"]["content_snapshot"],
  }));

  if (pageInsertPayload.length > 0) {
    const pageQuery = await supabase.from("pages").insert(pageInsertPayload as never);

    if (pageQuery.error) {
      throw new Error(pageQuery.error.message);
    }
  }

  return {
    projectId,
    issueId,
  };
}
