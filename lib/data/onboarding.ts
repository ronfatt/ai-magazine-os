import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getOnboardingState() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      mode: "mock" as const,
      hasWorkspace: false,
      latestIssueId: null as string | null,
      latestIssueTitle: null as string | null,
      latestProjectName: null as string | null,
    };
  }

  try {
    const supabase = await createClient();
    const projectCountQuery = await supabase.from("projects").select("*", { count: "exact", head: true });

    const latestIssueQuery = await supabase
      .from("issues")
      .select("id, title, project_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestIssue = latestIssueQuery.data as
      | { id: string; title: string; project_id: string }
      | null;

    let latestProjectName: string | null = null;
    if (latestIssue?.project_id) {
      const projectQuery = await supabase
        .from("projects")
        .select("name")
        .eq("id", latestIssue.project_id)
        .maybeSingle();
      latestProjectName = (projectQuery.data as { name: string } | null)?.name ?? null;
    }

    return {
      mode: "live" as const,
      hasWorkspace: (projectCountQuery.count ?? 0) > 0,
      latestIssueId: latestIssue?.id ?? null,
      latestIssueTitle: latestIssue?.title ?? null,
      latestProjectName,
    };
  } catch {
    return {
      mode: "mock" as const,
      hasWorkspace: false,
      latestIssueId: null,
      latestIssueTitle: null,
      latestProjectName: null,
    };
  }
}
