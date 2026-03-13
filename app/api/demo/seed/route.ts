import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { seedDemoWorkspace } from "@/lib/demo/seed";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in before creating a demo workspace." }, { status: 401 });
    }

    const result = await seedDemoWorkspace({
      ownerId: user.id,
      email: user.email ?? null,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not seed demo workspace." },
      { status: 500 },
    );
  }
}
