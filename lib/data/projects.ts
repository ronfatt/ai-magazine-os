import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getProjectsPageData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      mode: "mock" as const,
      projects: [],
    };
  }

  const supabase = await createClient();
  const projectsQuery = await supabase
    .from("projects")
    .select("id, name, description, status, created_at")
    .order("created_at", { ascending: false });
  const projectRows = (projectsQuery.data ?? []) as Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    created_at: string;
  }>;

  if (projectsQuery.error) {
    return {
      mode: "live" as const,
      projects: [],
      error: projectsQuery.error.message,
    };
  }

  const issueCounts = new Map<string, number>();

  if (projectRows.length > 0) {
    const issueQuery = await supabase
      .from("issues")
      .select("id, project_id")
      .in(
        "project_id",
        projectRows.map((project) => project.id),
      );
    const issueRows = (issueQuery.data ?? []) as Array<{ id: string; project_id: string }>;

    for (const row of issueRows) {
      issueCounts.set(row.project_id, (issueCounts.get(row.project_id) ?? 0) + 1);
    }
  }

  return {
    mode: "live" as const,
    projects: projectRows.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      createdAt: project.created_at,
      issueCount: issueCounts.get(project.id) ?? 0,
    })),
    error: null as string | null,
  };
}

export async function getProjectDetailData(projectId: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      mode: "mock" as const,
      project: null,
      issues: [],
      members: [],
      error: "Configure Supabase to enable project collaboration.",
    };
  }

  const supabase = await createClient();

  const [projectQuery, issueQuery, memberQuery] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, description, status, created_at")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("issues")
      .select("id, title, issue_number, status, created_at")
      .eq("project_id", projectId)
      .order("issue_number", { ascending: false }),
    supabase
      .from("project_members")
      .select("id, user_email, role, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
  ]);

  const project = projectQuery.data as
    | {
        id: string;
        name: string;
        description: string | null;
        status: string;
        created_at: string;
      }
    | null;

  return {
    mode: "live" as const,
    project,
    issues: (issueQuery.data ?? []) as Array<{
      id: string;
      title: string;
      issue_number: number;
      status: string;
      created_at: string;
    }>,
    members: (memberQuery.data ?? []) as Array<{
      id: string;
      user_email: string;
      role: string;
      created_at: string;
    }>,
    error: projectQuery.error?.message ?? issueQuery.error?.message ?? memberQuery.error?.message ?? null,
  };
}

