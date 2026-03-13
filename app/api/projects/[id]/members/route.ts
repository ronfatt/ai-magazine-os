import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getProjectAccess, hasRequiredRole } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

const ALLOWED_ROLES = new Set(["viewer", "editor", "admin"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in before managing members." }, { status: 401 });
  }

  const { id: projectId } = await params;
  const projectAccess = await getProjectAccess(projectId, user.id);

  if (!projectAccess) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  if (!hasRequiredRole(projectAccess.role, "admin")) {
    return NextResponse.json({ error: "You do not have member management access." }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string; role?: string };
  const email = body.email?.trim().toLowerCase();
  const role = body.role?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!role || !ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Choose a valid member role." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const profileQuery = await supabase.from("profiles").select("id, email").eq("email", email).maybeSingle();
  const profile = profileQuery.data as { id: string; email: string | null } | null;

  if (profileQuery.error) {
    return NextResponse.json({ error: profileQuery.error.message }, { status: 500 });
  }

  if (!profile?.id) {
    return NextResponse.json(
      { error: "That user has not signed in yet. Ask them to log in once before adding them." },
      { status: 400 },
    );
  }

  if (profile.id === projectAccess.ownerId) {
    return NextResponse.json({ error: "Project owner already has full access." }, { status: 400 });
  }

  const membershipInsert: Database["public"]["Tables"]["project_members"]["Insert"] = {
    project_id: projectId,
    user_id: profile.id,
    user_email: profile.email ?? email,
    role,
    created_by: user.id,
  };

  const membershipQuery = await supabase
    .from("project_members")
    .upsert(membershipInsert as never, { onConflict: "project_id,user_id" });

  if (membershipQuery.error) {
    return NextResponse.json({ error: membershipQuery.error.message }, { status: 500 });
  }

  revalidatePath(`/projects/${projectId}`);

  return NextResponse.json({ ok: true });
}
