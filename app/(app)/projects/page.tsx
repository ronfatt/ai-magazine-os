import Link from "next/link";

import { PageIntro } from "@/components/shared/page-intro";
import { getProjectsPageData } from "@/lib/data/projects";

export default async function ProjectsPage() {
  const data = await getProjectsPageData();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Projects"
        title="Publishing programs"
        description="Projects will eventually own brands, issue cadences, asset pools, and AI generation settings. For now, they act as stable containers for the rest of the MVP."
      />

      {data.error ? (
        <div className="rounded-2xl border border-[#d4a491] bg-[#fff4ef] px-4 py-3 text-sm text-[#8a3b1d]">
          {data.error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        {data.projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="rounded-3xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <p className="eyebrow">Project</p>
            <h2 className="mt-3 text-2xl font-semibold">{project.name}</h2>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              {project.description ?? "No project description yet."}
            </p>
            <div className="mt-5 flex items-center justify-between text-sm">
              <span>{project.issueCount} issues</span>
              <span className="text-accent-strong">{project.status}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
