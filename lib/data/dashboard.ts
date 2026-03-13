import { dashboardMetrics, recentUploads } from "@/lib/data/mock-dashboard";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type AssetListItem = Pick<
  Database["public"]["Tables"]["assets"]["Row"],
  "id" | "file_name" | "created_at" | "kind"
>;

export async function getDashboardSnapshot() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return {
      metrics: dashboardMetrics,
      uploads: recentUploads,
      mode: "mock" as const,
    };
  }

  try {
    const supabase = await createClient();

    const [{ count: projectsCount }, { count: issuesCount }, { count: pagesCount }, assetsResult] =
      await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("issues").select("*", { count: "exact", head: true }),
        supabase.from("pages").select("*", { count: "exact", head: true }),
        supabase
          .from("assets")
          .select("id, file_name, created_at, kind")
          .order("created_at", { ascending: false })
          .limit(4),
      ]);

    const assets = (assetsResult.data ?? []) as AssetListItem[];

    return {
      mode: "live" as const,
      metrics: [
        {
          label: "Total Projects",
          value: String(projectsCount ?? 0),
          change: "Live from Supabase",
        },
        {
          label: "Total Issues",
          value: String(issuesCount ?? 0),
          change: "Live from Supabase",
        },
        {
          label: "Total Pages",
          value: String(pagesCount ?? 0),
          change: "Live from Supabase",
        },
        {
          label: "Recent Uploads",
          value: String(assets.length),
          change: "Latest 4 assets",
        },
      ],
      uploads: assets.map((asset) => ({
        id: asset.id,
        title: asset.file_name,
        subtitle: `Asset type: ${asset.kind}`,
        dateLabel: new Date(asset.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      })),
    };
  } catch {
    return {
      metrics: dashboardMetrics,
      uploads: recentUploads,
      mode: "mock" as const,
    };
  }
}
