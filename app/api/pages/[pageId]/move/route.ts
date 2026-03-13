import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getPageAccess, hasRequiredRole } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

interface PageRow {
  id: string;
  issue_id: string;
  page_number: number;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before reordering pages." }, { status: 401 });
    }

    const pageAccess = await getPageAccess(pageId, user.id);

    if (!pageAccess) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    if (!hasRequiredRole(pageAccess.role, "editor")) {
      return NextResponse.json({ error: "You do not have reorder access for this page." }, { status: 403 });
    }

    const body = (await request.json()) as { direction?: "up" | "down" };
    const direction = body.direction;

    if (direction !== "up" && direction !== "down") {
      return NextResponse.json({ error: "Direction must be up or down." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const lookupQuery = await supabase
      .from("pages")
      .select("id, issue_id, page_number")
      .eq("id", pageId)
      .maybeSingle();
    const currentPage = lookupQuery.data as PageRow | null;

    if (lookupQuery.error) {
      return NextResponse.json({ error: lookupQuery.error.message }, { status: 500 });
    }

    if (!currentPage) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    const targetPageNumber =
      direction === "up" ? currentPage.page_number - 1 : currentPage.page_number + 1;

    if (targetPageNumber < 1) {
      return NextResponse.json({ error: "Page is already at the top." }, { status: 400 });
    }

    const siblingQuery = await supabase
      .from("pages")
      .select("id, issue_id, page_number")
      .eq("issue_id", currentPage.issue_id)
      .eq("page_number", targetPageNumber)
      .maybeSingle();
    const siblingPage = siblingQuery.data as PageRow | null;

    if (siblingQuery.error) {
      return NextResponse.json({ error: siblingQuery.error.message }, { status: 500 });
    }

    if (!siblingPage) {
      return NextResponse.json({ error: "No page exists in that direction." }, { status: 400 });
    }

    await supabase
      .from("pages")
      .update({ page_number: 0 } as never)
      .eq("id", currentPage.id);
    await supabase
      .from("pages")
      .update({ page_number: currentPage.page_number } as never)
      .eq("id", siblingPage.id);
    await supabase
      .from("pages")
      .update({ page_number: siblingPage.page_number } as never)
      .eq("id", currentPage.id);

    revalidatePath(`/issues/${currentPage.issue_id}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not reorder page." },
      { status: 500 },
    );
  }
}
