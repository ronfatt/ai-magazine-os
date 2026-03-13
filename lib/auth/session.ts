import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export function getSafeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireCurrentUser(nextPath = "/dashboard") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(getSafeNextPath(nextPath))}`);
  }

  return user;
}

