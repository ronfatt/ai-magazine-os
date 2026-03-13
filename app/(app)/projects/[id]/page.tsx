import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectMembersCard } from "@/components/projects/project-members-card";
import { PageIntro } from "@/components/shared/page-intro";
import { getProjectAccess, hasRequiredRole } from "@/lib/auth/access";
import { requireCurrentUser } from "@/lib/auth/session";
import { getProjectDetailData } from "@/lib/data/projects";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCurrentUser(`/projects/${id}`);
  const access = await getProjectAccess(id, user.id);
  const data = await getProjectDetailData(id);

  if (!access || !data.project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Project Detail"
        title={data.project.name}
        description={data.project.description ?? "Project workspace for issues, collaborators, and editorial operations."}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl border border-line bg-surface p-5">
          <p className="eyebrow">Access</p>
          <h2 className="mt-3 text-2xl font-semibold capitalize">{access.role}</h2>
          <p className="mt-2 text-sm leading-7 text-ink-soft">
            Collaboration roles now support owners, admins, editors, and viewers across shared projects.
          </p>
        </article>
        <article className="rounded-3xl border border-line bg-surface p-5">
          <p className="eyebrow">Project Status</p>
          <h2 className="mt-3 text-2xl font-semibold capitalize">{data.project.status}</h2>
          <p className="mt-2 text-sm leading-7 text-ink-soft">
            Shared access is enforced at the project level and inherited by issues, contents, assets, and pages.
          </p>
        </article>
        <article className="rounded-3xl border border-line bg-surface p-5">
          <p className="eyebrow">Issue Queue</p>
          <h2 className="mt-3 text-2xl font-semibold">{data.issues.length}</h2>
          <p className="mt-2 text-sm leading-7 text-ink-soft">
            Active issues currently visible to this workspace.
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-line bg-surface p-5">
          <p className="eyebrow">Issues</p>
          <h2 className="mt-3 text-2xl font-semibold">Recent issue lanes</h2>
          <div className="mt-5 space-y-3">
            {data.issues.length > 0 ? (
              data.issues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/issues/${issue.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-line bg-white/70 px-4 py-4 transition hover:border-accent"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">Issue {issue.issue_number}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-ink-soft">{issue.status}</span>
                  </div>
                  <p className="text-sm text-ink-soft">{issue.title}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-ink-soft">
                No issues created for this project yet.
              </div>
            )}
          </div>
        </article>

        <ProjectMembersCard
          projectId={id}
          canManageMembers={hasRequiredRole(access.role, "admin")}
          members={data.members.map((member) => ({
            id: member.id,
            email: member.user_email,
            role: member.role,
            joinedAt: member.created_at,
          }))}
        />
      </section>
    </div>
  );
}
