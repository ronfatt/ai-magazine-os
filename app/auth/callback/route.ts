import { NextResponse, type NextRequest } from "next/server";

import { getSafeNextPath } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Missing login code. Request a fresh magic link.");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile: Database["public"]["Tables"]["profiles"]["Insert"] = {
      id: user.id,
      email: user.email ?? null,
      full_name:
        typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null,
    };

    await supabase.from("profiles").upsert(profile as never);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
