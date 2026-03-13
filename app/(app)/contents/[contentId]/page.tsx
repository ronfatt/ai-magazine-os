import { notFound } from "next/navigation";

import { ContentReviewEditor } from "@/components/contents/content-review-editor";
import { PageIntro } from "@/components/shared/page-intro";
import { getContentReviewData } from "@/lib/data/content-review";

export default async function ContentReviewPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const { content, issue, error } = await getContentReviewData(contentId);

  if (!content) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Content Detail"
        title={content.structuredContent?.title || content.title}
        description={
          issue
            ? `Review structured output for Issue ${issue.issueNumber}: ${issue.title} in ${issue.projectName}.`
            : "Review and refine the structured editorial JSON before page generation."
        }
      />

      {error ? (
        <section className="rounded-3xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {error}
        </section>
      ) : null}

      <ContentReviewEditor content={content} issueId={issue?.id ?? null} />
    </div>
  );
}
