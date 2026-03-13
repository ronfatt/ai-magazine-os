import type {
  IssueContentListItem,
  IssuePageListItem,
  PageLayoutJson,
  TemplateRecord,
} from "@/lib/types/domain";

import { defaultTemplateBlueprints } from "@/lib/data/templates";

function createLayoutJson(content: IssueContentListItem, pageNumber: number): PageLayoutJson {
  const structured = content.structuredContent;
  const sections = structured?.sections.slice(0, 3) ?? [];
  const quotes = structured?.quotes.slice(0, 2) ?? [];

  return {
    pageTitle: structured?.title ?? content.title,
    narrative:
      structured?.summary ??
      content.rawText?.slice(0, 260) ??
      "Awaiting structured narrative for this page.",
    sourceContentIds: [content.id],
    zones: [
      {
        zoneId: "hero",
        slotType: "title",
        content: structured?.title ?? content.title,
      },
      {
        zoneId: "hero",
        slotType: "subtitle",
        content: structured?.subtitle ?? `Page ${pageNumber} feature introduction`,
      },
      {
        zoneId: "body",
        slotType: "summary",
        content: structured?.summary ?? "Summary will appear here after analysis.",
      },
      {
        zoneId: "body",
        slotType: "section",
        content:
          sections.length > 0
            ? sections.map((section) => `${section.heading}: ${section.summary}`)
            : ["No structured sections available yet."],
      },
      {
        zoneId: "pull",
        slotType: "quote",
        content:
          quotes.length > 0
            ? quotes.map((quote) => `${quote.quote} (${quote.speaker ?? "Source"})`)
            : ["No pull quote extracted yet."],
      },
      {
        zoneId: "hero",
        slotType: "meta",
        content: [
          `Category: ${structured?.category ?? content.contentType}`,
          `Suggested pages: ${structured?.suggestedPages ?? 1}`,
        ],
      },
    ],
  };
}

export function buildSinglePage(input: {
  content: IssueContentListItem;
  templates: TemplateRecord[];
  pageNumber: number;
  pageRole?: "feature" | "section" | "closing";
}) {
  const template = chooseTemplateForContent(input.content, input.templates);

  return {
    pageNumber: input.pageNumber,
    pageRole: input.pageRole ?? "section",
    templateId: template?.id ?? null,
    layoutJson: createLayoutJson(input.content, input.pageNumber),
    status: "generated" as const,
    locked: false as const,
  };
}

export function chooseTemplateForContent(
  content: IssueContentListItem,
  templates: TemplateRecord[],
) {
  const category = content.structuredContent?.category?.toLowerCase() ?? "";

  return (
    templates.find((template) => template.category.toLowerCase() === category) ??
    templates.find((template) => template.category === "feature") ??
    null
  );
}

export function buildPagesForIssue(input: {
  contents: IssueContentListItem[];
  templates: TemplateRecord[];
}): Array<{
  pageNumber: number;
  pageRole: "feature" | "section" | "closing";
  templateId: string | null;
  layoutJson: PageLayoutJson;
  status: "generated";
  locked: false;
}> {
  const structuredContents = input.contents.filter(
    (content) => content.ingestionSource === "text" && content.structuredContent,
  );

  return structuredContents.map((content, index, collection) => {
    const pageNumber = index + 1;
    const pageRole =
      index === collection.length - 1 ? "closing" : index === 0 ? "feature" : "section";

    return buildSinglePage({
      content,
      templates: input.templates,
      pageNumber,
      pageRole,
    });
  });
}

export function buildMockIssuePages(contents: IssueContentListItem[]): IssuePageListItem[] {
  return buildPagesForIssue({
    contents,
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
  }).map((page, index) => ({
    id: `mock-page-${index + 1}`,
    templateId: page.templateId,
    pageNumber: page.pageNumber,
    pageRole: page.pageRole,
    status: page.status,
    locked: page.locked,
    templateName:
      defaultTemplateBlueprints.find((template) => template.slug === "cover-feature")?.name ?? null,
    templateCategory:
      defaultTemplateBlueprints.find((template) => template.slug === "cover-feature")?.category ?? null,
    layoutJson: page.layoutJson,
  }));
}
