import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser, getSafeNextPath } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginForm
        nextPath={getSafeNextPath(params.next)}
        loginError={typeof params.error === "string" ? params.error : null}
      />
    </main>
  );
}
