import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function createOwnedAssetSignedUrl(input: {
  assetId: string;
  expiresIn?: number;
}) {
  const supabase = createAdminClient();

  const assetQuery = await supabase
    .from("assets")
    .select("id, file_name, storage_path, kind")
    .eq("id", input.assetId)
    .maybeSingle();
  const asset = assetQuery.data as
    | {
        id: string;
        file_name: string;
        storage_path: string;
        kind: string;
      }
    | null;

  if (assetQuery.error) {
    throw new Error(assetQuery.error.message);
  }

  if (!asset) {
    return null;
  }

  const signedUrlQuery = await supabase.storage
    .from("issue-assets")
    .createSignedUrl(asset.storage_path, input.expiresIn ?? 60);

  if (signedUrlQuery.error || !signedUrlQuery.data?.signedUrl) {
    throw new Error(signedUrlQuery.error?.message ?? "Could not create signed asset URL.");
  }

  return {
    assetId: asset.id,
    fileName: asset.file_name,
    kind: asset.kind,
    signedUrl: signedUrlQuery.data.signedUrl,
  };
}
