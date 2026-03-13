import { notFound } from "next/navigation";

import { getIssueWorkspaceData } from "@/lib/data/issue-workspace";
import { buildIssuePrintHtml } from "@/lib/pdf/issue-document";

export default async function IssuePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getIssueWorkspaceData(id);

  if (!workspace.issue) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f3ebdd] p-4">
      <iframe
        title={`Issue ${workspace.issue.issueNumber} print preview`}
        srcDoc={buildIssuePrintHtml({
          issue: workspace.issue,
          pages: workspace.pages,
        })}
        className="h-[calc(100vh-2rem)] w-full rounded-3xl border border-line bg-white"
      />
    </main>
  );
}
