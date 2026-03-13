import type { ActivityItem, DashboardMetric } from "@/lib/types/domain";

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Total Projects", value: "12", change: "+3 this month" },
  { label: "Total Issues", value: "34", change: "+5 in review" },
  { label: "Total Pages", value: "186", change: "+24 auto-composed" },
  { label: "Recent Uploads", value: "48", change: "7 awaiting tagging" },
];

export const recentUploads: ActivityItem[] = [
  {
    id: "upload-1",
    title: "Spring editorial photo set",
    subtitle: "14 image assets linked to Issue 06",
    dateLabel: "2h ago",
  },
  {
    id: "upload-2",
    title: "Founder interview transcript",
    subtitle: "Converted into structured content blocks",
    dateLabel: "Today",
  },
  {
    id: "upload-3",
    title: "Brand refresh deck",
    subtitle: "Queued for template mapping",
    dateLabel: "Yesterday",
  },
];

export const modulePlaceholders = [
  {
    title: "Projects",
    description: "Magazine programs, editorial calendars, and ownership boundaries.",
  },
  {
    title: "Issues",
    description: "Time-boxed publishing drops that accumulate content and generated pages.",
  },
  {
    title: "Contents",
    description: "Structured articles, briefs, interviews, and narrative blocks.",
  },
  {
    title: "Assets",
    description: "Media uploaded into Supabase Storage with metadata and reuse hooks.",
  },
  {
    title: "Pages",
    description: "Page assembly states ready for review, automation, and publishing.",
  },
  {
    title: "Templates",
    description: "Layout recipes that future AI modules can fill with editorial content.",
  },
  {
    title: "Brands",
    description: "Typography, palette, and voice rules that steer issue generation.",
  },
];
