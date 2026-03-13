import type { TemplateRecord, TemplateSchema } from "@/lib/types/domain";

const coverFeatureSchema: TemplateSchema = {
  canvas: { columns: 12, aspectRatio: "8.5:11", background: "paper" },
  zones: [
    { id: "hero", name: "Hero", span: "12 / 5", slots: ["title", "subtitle", "meta"] },
    { id: "body", name: "Body", span: "8 / 7", slots: ["summary", "section"] },
    { id: "pull", name: "Pull Quote", span: "4 / 7", slots: ["quote"] },
  ],
  slots: [
    { id: "title", type: "title", label: "Display title", required: true, maxItems: 1 },
    { id: "subtitle", type: "subtitle", label: "Deck", required: true, maxItems: 1 },
    { id: "meta", type: "meta", label: "Category + page meta", required: false, maxItems: 2 },
    { id: "summary", type: "summary", label: "Opening summary", required: true, maxItems: 1 },
    { id: "section", type: "section", label: "Narrative sections", required: true, maxItems: 2 },
    { id: "quote", type: "quote", label: "Pull quote", required: false, maxItems: 1 },
  ],
};

const sectionDigestSchema: TemplateSchema = {
  canvas: { columns: 12, aspectRatio: "8.5:11", background: "paper" },
  zones: [
    { id: "header", name: "Header", span: "12 / 3", slots: ["title", "subtitle"] },
    { id: "columns", name: "Editorial columns", span: "12 / 9", slots: ["section", "quote"] },
    { id: "footer", name: "Footer", span: "12 / 2", slots: ["meta"] },
  ],
  slots: [
    { id: "title", type: "title", label: "Section title", required: true, maxItems: 1 },
    { id: "subtitle", type: "subtitle", label: "Standfirst", required: false, maxItems: 1 },
    { id: "section", type: "section", label: "Article sections", required: true, maxItems: 3 },
    { id: "quote", type: "quote", label: "Quote rail", required: false, maxItems: 2 },
    { id: "meta", type: "meta", label: "Issue metadata", required: false, maxItems: 2 },
  ],
};

const closingBriefSchema: TemplateSchema = {
  canvas: { columns: 12, aspectRatio: "8.5:11", background: "paper" },
  zones: [
    { id: "top", name: "Top note", span: "12 / 4", slots: ["title", "summary"] },
    { id: "notes", name: "Closing notes", span: "12 / 8", slots: ["section", "quote", "meta"] },
  ],
  slots: [
    { id: "title", type: "title", label: "Closing title", required: true, maxItems: 1 },
    { id: "summary", type: "summary", label: "Closing summary", required: true, maxItems: 1 },
    { id: "section", type: "section", label: "Supporting notes", required: true, maxItems: 2 },
    { id: "quote", type: "quote", label: "Closing quote", required: false, maxItems: 1 },
    { id: "meta", type: "meta", label: "References", required: false, maxItems: 2 },
  ],
};

export const defaultTemplateBlueprints: Array<
  Pick<TemplateRecord, "name" | "category" | "previewUrl" | "scope" | "layoutSpec"> & {
    slug: string;
  }
> = [
  {
    slug: "cover-feature",
    name: "Cover Feature",
    category: "feature",
    previewUrl: null,
    scope: "system",
    layoutSpec: coverFeatureSchema,
  },
  {
    slug: "section-digest",
    name: "Section Digest",
    category: "editorial",
    previewUrl: null,
    scope: "system",
    layoutSpec: sectionDigestSchema,
  },
  {
    slug: "closing-brief",
    name: "Closing Brief",
    category: "closing",
    previewUrl: null,
    scope: "system",
    layoutSpec: closingBriefSchema,
  },
];
