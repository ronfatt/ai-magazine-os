import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getPageAccess, hasRequiredRole } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

interface PageLookup {
  id: string;
  issue_id: string;
}

const ALLOWED_PAGE_STATUSES = new Set(["generated", "reviewed", "published"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before updating pages." }, { status: 401 });
    }

    const pageAccess = await getPageAccess(pageId, user.id);

    if (!pageAccess) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    if (!hasRequiredRole(pageAccess.role, "editor")) {
      return NextResponse.json({ error: "You do not have edit access for this page." }, { status: 403 });
    }

    const body = (await request.json()) as {
      status?: string;
      locked?: boolean;
    };

    const supabase = createAdminClient();
    const lookupQuery = await supabase
      .from("pages")
      .select("id, issue_id")
      .eq("id", pageId)
      .maybeSingle();
    const pageRow = lookupQuery.data as PageLookup | null;

    if (lookupQuery.error) {
      return NextResponse.json({ error: lookupQuery.error.message }, { status: 500 });
    }

    if (!pageRow) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    const update: Database["public"]["Tables"]["pages"]["Update"] = {};

    if (typeof body.locked === "boolean") {
      update.locked = body.locked;
    }

    if (body.status) {
      const nextStatus = body.status.trim();
      if (!ALLOWED_PAGE_STATUSES.has(nextStatus)) {
        return NextResponse.json({ error: "Invalid page status." }, { status: 400 });
      }
      update.status = nextStatus;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid page updates provided." }, { status: 400 });
    }

    const updateQuery = await supabase
      .from("pages")
      .update(update as never)
      .eq("id", pageId);

    if (updateQuery.error) {
      return NextResponse.json({ error: updateQuery.error.message }, { status: 500 });
    }

    revalidatePath(`/issues/${pageRow.issue_id}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update page." },
      { status: 500 },
    );
  }
}
