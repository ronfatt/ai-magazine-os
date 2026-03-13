import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

import { getIssueAccess } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { getIssueWorkspaceData } from "@/lib/data/issue-workspace";
import { buildIssuePrintHtml } from "@/lib/pdf/issue-document";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in before exporting PDF." }, { status: 401 });
  }

  const issueAccess = await getIssueAccess(id, user.id);

  if (!issueAccess) {
    return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  }

  const workspace = await getIssueWorkspaceData(id);

  if (!workspace.issue) {
    return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  }

  if (workspace.pages.length === 0) {
    return NextResponse.json(
      { error: "Generate at least one page before exporting PDF." },
      { status: 400 },
    );
  }

  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(
      buildIssuePrintHtml({
        issue: workspace.issue,
        pages: workspace.pages,
      }),
      { waitUntil: "networkidle0" },
    );

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate:
        '<div style="width:100%;padding:0 16mm;font-size:10px;color:#675f57;display:flex;justify-content:space-between;"><span>AI Magazine OS</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>',
      margin: {
        top: "18mm",
        right: "16mm",
        bottom: "20mm",
        left: "16mm",
      },
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="issue-${workspace.issue.issueNumber}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF export failed." },
      { status: 500 },
    );
  } finally {
    await browser.close();
  }
}
