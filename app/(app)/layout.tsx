import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireCurrentUser();

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />
        <main className="space-y-4">
          <Topbar userEmail={user.email ?? null} />
          <div className="panel min-h-[calc(100vh-10rem)] p-5 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
