export type ModuleKey =
  | "projects"
  | "issues"
  | "contents"
  | "assets"
  | "pages"
  | "templates"
  | "brands";

export type ProjectStatus = "draft" | "active" | "archived";
export type IssueStatus = "planning" | "in_progress" | "in_review" | "published";
export type ContentStatus = "uploaded" | "structured" | "approved";
export type AssetKind = "image" | "video" | "pdf" | "audio" | "document";
export type PageStatus = "queued" | "generated" | "reviewed" | "published";
export type TemplateScope = "system" | "brand" | "project";
export type IngestionSource = "text" | "pdf" | "image";
export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

export interface StructuredSection {
  heading: string;
  summary: string;
  keyPoints: string[];
}

export interface StructuredQuote {
  quote: string;
  speaker: string | null;
  context: string;
}

export interface StructuredEditorialContent {
  title: string;
  subtitle: string;
  summary: string;
  sections: StructuredSection[];
  quotes: StructuredQuote[];
  suggestedPages: number;
  category: string;
}

export interface TemplateSlot {
  id: string;
  type: "title" | "subtitle" | "summary" | "section" | "quote" | "image" | "meta";
  label: string;
  required: boolean;
  maxItems?: number;
}

export interface TemplateSchema {
  canvas: {
    columns: number;
    aspectRatio: string;
    background: "paper" | "ink" | "brand";
  };
  zones: Array<{
    id: string;
    name: string;
    span: string;
    slots: string[];
  }>;
  slots: TemplateSlot[];
}

export interface PageLayoutZoneContent {
  zoneId: string;
  slotType: TemplateSlot["type"];
  content: string | string[];
}

export interface PageLayoutJson {
  pageTitle: string;
  narrative: string;
  zones: PageLayoutZoneContent[];
  sourceContentIds: string[];
}

export interface Brand {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  primaryColor: string | null;
  accentColor: string | null;
  typographyScale: Record<string, string>;
  createdAt: string;
}

export interface Project {
  id: string;
  ownerId: string;
  brandId: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
}

export interface Issue {
  id: string;
  ownerId: string;
  projectId: string;
  issueNumber: number;
  title: string;
  status: IssueStatus;
  publishAt: string | null;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  ownerId: string;
  projectId: string;
  issueId: string | null;
  title: string;
  contentType: string;
  ingestionSource: IngestionSource;
  rawText: string | null;
  body: Record<string, unknown>;
  status: ContentStatus;
  priority: number;
  createdAt: string;
}

export interface Asset {
  id: string;
  ownerId: string;
  projectId: string;
  issueId: string | null;
  kind: AssetKind;
  fileName: string;
  storagePath: string;
  mimeType: string | null;
  createdAt: string;
}

export interface PageRecord {
  id: string;
  ownerId: string;
  projectId: string;
  issueId: string;
  templateId: string | null;
  pageNumber: number;
  pageRole: "cover" | "feature" | "section" | "ad" | "closing";
  status: PageStatus;
  locked: boolean;
  layoutJson: PageLayoutJson | null;
  createdAt: string;
}

export interface TemplateRecord {
  id: string;
  ownerId: string;
  brandId: string | null;
  name: string;
  category: string;
  scope: TemplateScope;
  previewUrl: string | null;
  layoutSpec: TemplateSchema;
  createdAt: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  change: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  dateLabel: string;
}

export interface IssueContentListItem {
  id: string;
  title: string;
  contentType: string;
  ingestionSource: IngestionSource;
  rawText: string | null;
  status: ContentStatus;
  priority: number;
  createdAt: string;
  assetId?: string | null;
  assetFileName: string | null;
  assetKind: AssetKind | null;
  analysisStatus: AnalysisStatus;
  structuredContent: StructuredEditorialContent | null;
  analysisError: string | null;
  analysisModel: string | null;
  analysisProvider: string | null;
}

export interface IssuePageListItem {
  id: string;
  templateId: string | null;
  pageNumber: number;
  pageRole: string;
  status: PageStatus;
  locked: boolean;
  templateName: string | null;
  templateCategory: string | null;
  layoutJson: PageLayoutJson | null;
}
