import { IssueContentList } from "@/components/issues/issue-content-list";
import { IssuePublishDashboard } from "@/components/issues/issue-publish-dashboard";
import { IssueReviewDashboard } from "@/components/issues/issue-review-dashboard";
import { IssueContentUpload } from "@/components/issues/issue-content-upload";
import { IssuePageStudio } from "@/components/pages/issue-page-studio";
import { PageIntro } from "@/components/shared/page-intro";
import { getIssueWorkspaceData } from "@/lib/data/issue-workspace";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { issue, contents, pages, templates, mode, error } = await getIssueWorkspaceData(id);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Issue Detail"
        title={issue ? `Issue ${issue.issueNumber}: ${issue.title}` : `Issue: ${id}`}
        description={
          issue
            ? `Project: ${issue.projectName}. Upload text, PDFs, and images into this issue, keep priorities visible, and leave AI parsing as a later layer.`
            : "This route now hosts the content ingestion workflow. Connect Supabase env keys and create an issue row to activate live uploads."
        }
      />

      {error ? (
        <section className="rounded-3xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {error}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Issue Status",
            value: issue?.status ?? "Not loaded",
          },
          {
            label: "Content Items",
            value: String(contents.length),
          },
          {
            label: "Data Mode",
            value: mode,
          },
          {
            label: "AI Parsing",
            value: "OpenAI active",
          },
          {
            label: "Pages",
            value: String(pages.length),
          },
        ].map((item) => (
          <article key={item.label} className="rounded-3xl border border-line bg-surface p-5">
            <p className="eyebrow">{item.label}</p>
            <h2 className="mt-3 text-lg font-semibold capitalize">{item.value}</h2>
          </article>
        ))}
      </section>

      <IssueContentUpload issueId={id} disabled={!issue} />
      {issue ? (
        <IssuePublishDashboard
          issueId={id}
          issueStatus={issue.status}
          contents={contents}
          pages={pages}
          mode={mode}
        />
      ) : null}
      <IssueReviewDashboard contents={contents} pages={pages} />
      <IssueContentList issueId={id} items={contents} mode={mode} />
      <IssuePageStudio issueId={id} pages={pages} templates={templates} mode={mode} />
    </div>
  );
}
