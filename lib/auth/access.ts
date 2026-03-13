import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type WorkspaceRole = "viewer" | "editor" | "admin" | "owner";

const ROLE_WEIGHT: Record<WorkspaceRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

export function hasRequiredRole(role: WorkspaceRole, minimumRole: WorkspaceRole) {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[minimumRole];
}

export async function getProjectAccess(projectId: string, userId: string): Promise<{
  projectId: string;
  ownerId: string;
  role: WorkspaceRole;
} | null> {
  const supabase = createAdminClient();
  const projectQuery = await supabase
    .from("projects")
    .select("id, owner_id")
    .eq("id", projectId)
    .maybeSingle();
  const project = projectQuery.data as { id: string; owner_id: string } | null;

  if (projectQuery.error) {
    throw new Error(projectQuery.error.message);
  }

  if (!project) {
    return null;
  }

  if (project.owner_id === userId) {
    return {
      projectId: project.id,
      ownerId: project.owner_id,
      role: "owner",
    };
  }

  const membershipQuery = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  const membership = membershipQuery.data as { role: WorkspaceRole } | null;

  if (membershipQuery.error) {
    throw new Error(membershipQuery.error.message);
  }

  if (!membership) {
    return null;
  }

  return {
    projectId: project.id,
    ownerId: project.owner_id,
    role: membership.role,
  };
}

export async function getIssueAccess(issueId: string, userId: string): Promise<{
  issueId: string;
  projectId: string;
  ownerId: string;
  role: WorkspaceRole;
} | null> {
  const supabase = createAdminClient();
  const issueQuery = await supabase
    .from("issues")
    .select("id, project_id, owner_id")
    .eq("id", issueId)
    .maybeSingle();
  const issue = issueQuery.data as { id: string; project_id: string; owner_id: string } | null;

  if (issueQuery.error) {
    throw new Error(issueQuery.error.message);
  }

  if (!issue) {
    return null;
  }

  const access = await getProjectAccess(issue.project_id, userId);

  if (!access) {
    return null;
  }

  return {
    issueId: issue.id,
    projectId: issue.project_id,
    ownerId: issue.owner_id,
    role: access.role,
  };
}

export async function getContentAccess(contentId: string, userId: string): Promise<{
  contentId: string;
  issueId: string | null;
  projectId: string;
  ownerId: string;
  role: WorkspaceRole;
} | null> {
  const supabase = createAdminClient();
  const contentQuery = await supabase
    .from("contents")
    .select("id, issue_id, project_id, owner_id")
    .eq("id", contentId)
    .maybeSingle();
  const content = contentQuery.data as
    | {
        id: string;
        issue_id: string | null;
        project_id: string;
        owner_id: string;
      }
    | null;

  if (contentQuery.error) {
    throw new Error(contentQuery.error.message);
  }

  if (!content) {
    return null;
  }

  const access = await getProjectAccess(content.project_id, userId);

  if (!access) {
    return null;
  }

  return {
    contentId: content.id,
    issueId: content.issue_id,
    projectId: content.project_id,
    ownerId: content.owner_id,
    role: access.role,
  };
}

export async function getPageAccess(pageId: string, userId: string): Promise<{
  pageId: string;
  issueId: string;
  projectId: string;
  ownerId: string;
  role: WorkspaceRole;
} | null> {
  const supabase = createAdminClient();
  const pageQuery = await supabase
    .from("pages")
    .select("id, issue_id, project_id, owner_id")
    .eq("id", pageId)
    .maybeSingle();
  const page = pageQuery.data as
    | {
        id: string;
        issue_id: string;
        project_id: string;
        owner_id: string;
      }
    | null;

  if (pageQuery.error) {
    throw new Error(pageQuery.error.message);
  }

  if (!page) {
    return null;
  }

  const access = await getProjectAccess(page.project_id, userId);

  if (!access) {
    return null;
  }

  return {
    pageId: page.id,
    issueId: page.issue_id,
    projectId: page.project_id,
    ownerId: page.owner_id,
    role: access.role,
  };
}

export async function getAssetAccess(assetId: string, userId: string): Promise<{
  assetId: string;
  projectId: string;
  ownerId: string;
  role: WorkspaceRole;
} | null> {
  const supabase = createAdminClient();
  const assetQuery = await supabase
    .from("assets")
    .select("id, project_id, owner_id")
    .eq("id", assetId)
    .maybeSingle();
  const asset = assetQuery.data as
    | {
        id: string;
        project_id: string;
        owner_id: string;
      }
    | null;

  if (assetQuery.error) {
    throw new Error(assetQuery.error.message);
  }

  if (!asset) {
    return null;
  }

  const access = await getProjectAccess(asset.project_id, userId);

  if (!access) {
    return null;
  }

  return {
    assetId: asset.id,
    projectId: asset.project_id,
    ownerId: asset.owner_id,
    role: access.role,
  };
}
