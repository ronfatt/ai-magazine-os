import { NextResponse } from "next/server";

import { createOwnedAssetSignedUrl } from "@/lib/assets/storage";
import { getAssetAccess } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in before opening assets." }, { status: 401 });
  }

  const { assetId } = await params;

  try {
    const assetAccess = await getAssetAccess(assetId, user.id);

    if (!assetAccess) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    const asset = await createOwnedAssetSignedUrl({
      assetId,
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    return NextResponse.redirect(asset.signedUrl);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not open asset.",
      },
      { status: 500 },
    );
  }
}
