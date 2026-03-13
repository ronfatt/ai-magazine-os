import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getIssueAccess, hasRequiredRole } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

const ALLOWED_MIME_TYPES = {
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};
const ALLOWED_STATUSES = new Set(["uploaded", "structured", "approved"]);

function slugifyFileName(fileName: string) {
  return fileName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: issueId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before uploading content." }, { status: 401 });
    }

    const issueAccess = await getIssueAccess(issueId, user.id);

    if (!issueAccess) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }

    if (!hasRequiredRole(issueAccess.role, "editor")) {
      return NextResponse.json({ error: "You do not have upload access for this issue." }, { status: 403 });
    }

    const formData = await request.formData();

    const title = String(formData.get("title") ?? "").trim();
    const contentType = String(formData.get("contentType") ?? "").trim();
    const rawText = String(formData.get("rawText") ?? "").trim();
    const status = String(formData.get("status") ?? "uploaded").trim();
    const sourceType = String(formData.get("sourceType") ?? "text").trim() as
      | "text"
      | "pdf"
      | "image";
    const priority = Number(formData.get("priority") ?? 3);
    const file = formData.get("file");

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (!contentType) {
      return NextResponse.json({ error: "Content type is required." }, { status: 400 });
    }

    if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
      return NextResponse.json({ error: "Priority must be between 1 and 5." }, { status: 400 });
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid content status." }, { status: 400 });
    }

    if (sourceType === "text" && !rawText) {
      return NextResponse.json({ error: "Paste article text before uploading." }, { status: 400 });
    }

    if ((sourceType === "pdf" || sourceType === "image") && !(file instanceof File)) {
      return NextResponse.json({ error: "Choose a file before uploading." }, { status: 400 });
    }

    if ((sourceType === "pdf" || sourceType === "image") && file instanceof File) {
      const allowedTypes = ALLOWED_MIME_TYPES[sourceType];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error:
              sourceType === "pdf"
                ? "Only PDF files are supported for PDF uploads."
                : "Only common image formats are supported for image uploads.",
          },
          { status: 400 },
        );
      }
    }

    const supabase = createAdminClient();

    const issueLookup = await supabase
      .from("issues")
      .select("id, owner_id, project_id")
      .eq("id", issueId)
      .maybeSingle();
    const issueRow = issueLookup.data as {
      id: string;
      owner_id: string;
      project_id: string;
    } | null;
    const issueError = issueLookup.error;

    if (issueError) {
      return NextResponse.json({ error: issueError.message }, { status: 500 });
    }

    if (!issueRow) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }

    let assetPayload:
      | {
          id: string;
          fileName: string;
          kind: "pdf" | "image";
          storagePath: string;
          mimeType: string;
        }
      | undefined;

    let uploadedStoragePath: string | undefined;

    if ((sourceType === "pdf" || sourceType === "image") && file instanceof File) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const safeFileName = slugifyFileName(file.name);
      const storagePath = `${issueId}/${Date.now()}-${safeFileName}`;
      uploadedStoragePath = storagePath;

      const { error: uploadError } = await supabase.storage
        .from("issue-assets")
        .upload(storagePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const assetInsert: Database["public"]["Tables"]["assets"]["Insert"] = {
        owner_id: issueRow.owner_id,
        project_id: issueRow.project_id,
        issue_id: issueId,
        kind: sourceType,
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
      };

      const assetInsertQuery = await supabase
        .from("assets")
        .insert(assetInsert as never)
        .select("id, file_name, kind, storage_path, mime_type")
        .single();
      const assetRow = assetInsertQuery.data as {
        id: string;
        file_name: string;
        kind: string;
        storage_path: string;
        mime_type: string | null;
      } | null;
      const assetError = assetInsertQuery.error;

      if (assetError || !assetRow) {
        await supabase.storage.from("issue-assets").remove([storagePath]);
        return NextResponse.json(
          { error: assetError?.message ?? "Asset row could not be created." },
          { status: 500 },
        );
      }

      assetPayload = {
        id: assetRow.id,
        fileName: assetRow.file_name,
        kind: assetRow.kind as "pdf" | "image",
        storagePath: assetRow.storage_path,
        mimeType: assetRow.mime_type ?? file.type,
      };
    }

    const contentInsert: Database["public"]["Tables"]["contents"]["Insert"] = {
      owner_id: issueRow.owner_id,
      project_id: issueRow.project_id,
      issue_id: issueId,
      title,
      content_type: contentType,
      ingestion_source: sourceType,
      raw_text: sourceType === "text" ? rawText : null,
      status,
      priority,
      source_asset_id: assetPayload?.id ?? null,
      body: {
        parseStatus: "pending",
        sourceType,
        asset: assetPayload ?? null,
        notes: "Reserved for future AI parsing and content normalization.",
      },
      structured_content: null,
      analysis_status: "pending",
      analysis_error: null,
      analysis_model: null,
      analysis_provider: null,
      analyzed_at: null,
    };

    const { error: insertError } = await supabase
      .from("contents")
      .insert(contentInsert as never);

    if (insertError) {
      if (uploadedStoragePath) {
        await supabase.storage.from("issue-assets").remove([uploadedStoragePath]);
      }

      if (assetPayload?.id) {
        await supabase.from("assets").delete().eq("id", assetPayload.id).eq("owner_id", user.id);
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    revalidatePath(`/issues/${issueId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected upload error.",
      },
      { status: 500 },
    );
  }
}
