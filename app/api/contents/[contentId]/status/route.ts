import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getContentAccess, hasRequiredRole } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

interface StatusLookup {
  id: string;
  issue_id: string | null;
}

const ALLOWED_STATUSES = new Set(["uploaded", "structured", "approved"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ contentId: string }> },
) {
  const { contentId } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before updating content status." }, { status: 401 });
    }

    const contentAccess = await getContentAccess(contentId, user.id);

    if (!contentAccess) {
      return NextResponse.json({ error: "Content item not found." }, { status: 404 });
    }

    if (!hasRequiredRole(contentAccess.role, "editor")) {
      return NextResponse.json({ error: "You do not have status access for this content item." }, { status: 403 });
    }

    const body = (await request.json()) as { status?: string };
    const nextStatus = body.status?.trim();

    if (!nextStatus || !ALLOWED_STATUSES.has(nextStatus)) {
      return NextResponse.json({ error: "Invalid content status." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const lookupQuery = await supabase
      .from("contents")
      .select("id, issue_id")
      .eq("id", contentId)
      .maybeSingle();
    const contentRow = lookupQuery.data as StatusLookup | null;

    if (lookupQuery.error) {
      return NextResponse.json({ error: lookupQuery.error.message }, { status: 500 });
    }

    if (!contentRow) {
      return NextResponse.json({ error: "Content item not found." }, { status: 404 });
    }

    const update: Database["public"]["Tables"]["contents"]["Update"] = {
      status: nextStatus,
    };

    const updateQuery = await supabase
      .from("contents")
      .update(update as never)
      .eq("id", contentId);

    if (updateQuery.error) {
      return NextResponse.json({ error: updateQuery.error.message }, { status: 500 });
    }

    if (contentRow.issue_id) {
      revalidatePath(`/issues/${contentRow.issue_id}`);
    }
    revalidatePath(`/contents/${contentId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update content status." },
      { status: 500 },
    );
  }
}
