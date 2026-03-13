import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getContentAccess, hasRequiredRole } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import {
  normalizeStructuredEditorialContent,
  structuredContentToDatabaseJson,
} from "@/lib/content/structured-content";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

interface ContentRouteLookup {
  id: string;
  issue_id: string | null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ contentId: string }> },
) {
  const { contentId } = await params;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before editing structured content." }, { status: 401 });
    }

    const contentAccess = await getContentAccess(contentId, user.id);

    if (!contentAccess) {
      return NextResponse.json({ error: "Content item not found." }, { status: 404 });
    }

    if (!hasRequiredRole(contentAccess.role, "editor")) {
      return NextResponse.json({ error: "You do not have edit access for this content item." }, { status: 403 });
    }

    const payload = (await request.json()) as {
      title?: unknown;
      subtitle?: unknown;
      summary?: unknown;
      category?: unknown;
      suggestedPages?: unknown;
      sections?: unknown;
      quotes?: unknown;
    };

    const normalized = normalizeStructuredEditorialContent(payload);
    const supabase = createAdminClient();

    const lookupQuery = await supabase
      .from("contents")
      .select("id, issue_id")
      .eq("id", contentId)
      .maybeSingle();
    const contentRow = lookupQuery.data as ContentRouteLookup | null;

    if (lookupQuery.error) {
      return NextResponse.json({ error: lookupQuery.error.message }, { status: 500 });
    }

    if (!contentRow) {
      return NextResponse.json({ error: "Content item not found." }, { status: 404 });
    }

    const update: Database["public"]["Tables"]["contents"]["Update"] = {
      structured_content: structuredContentToDatabaseJson(normalized),
      analysis_status: "completed",
      analysis_error: null,
      status: "structured",
      analyzed_at: new Date().toISOString(),
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
      {
        error: error instanceof Error ? error.message : "Could not save structured content.",
      },
      { status: 500 },
    );
  }
}
