import "server-only";

import type { IssuePageListItem } from "@/lib/types/domain";

interface IssueDocumentInput {
  issue: {
    id: string;
    title: string;
    issueNumber: number;
    status: string;
    projectName: string;
  };
  pages: IssuePageListItem[];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildIssuePrintHtml({ issue, pages }: IssueDocumentInput) {
  const tocItems = pages
    .map(
      (page) => `
        <li class="toc-item">
          <span>${escapeHtml(page.layoutJson?.pageTitle ?? `Page ${page.pageNumber}`)}</span>
          <span>${page.pageNumber}</span>
        </li>
      `,
    )
    .join("");

  const pageMarkup = pages
    .map((page) => {
      const zones = page.layoutJson?.zones
        .map((zone) => {
          const content = Array.isArray(zone.content)
            ? `<ul>${zone.content.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>`
            : `<p>${escapeHtml(zone.content)}</p>`;

          return `
            <section class="zone zone-${escapeHtml(zone.zoneId)}">
              <div class="zone-meta">${escapeHtml(zone.zoneId)} · ${escapeHtml(zone.slotType)}</div>
              ${content}
            </section>
          `;
        })
        .join("");

      return `
        <article class="print-page">
          <header class="page-header">
            <div>
              <p class="eyebrow">Page ${page.pageNumber} · ${escapeHtml(page.pageRole)}</p>
              <h2>${escapeHtml(page.layoutJson?.pageTitle ?? `Page ${page.pageNumber}`)}</h2>
            </div>
            <div class="template-tag">${escapeHtml(page.templateName ?? "Template pending")}</div>
          </header>
          <p class="page-narrative">${escapeHtml(page.layoutJson?.narrative ?? "No page narrative available.")}</p>
          <div class="zones">${zones ?? ""}</div>
        </article>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(issue.projectName)} - Issue ${issue.issueNumber}</title>
      <style>
        @page {
          size: A4;
          margin: 18mm 16mm 20mm;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #1d1a17;
          background: #f3ebdd;
        }
        .document { padding: 24px; }
        .cover, .toc, .print-page {
          page-break-after: always;
          background: #fffdf8;
          border: 1px solid rgba(41, 34, 28, 0.12);
          border-radius: 28px;
          padding: 28px;
          min-height: calc(297mm - 38mm);
        }
        .eyebrow {
          margin: 0;
          color: #675f57;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .cover h1, .toc h2, .print-page h2 {
          margin: 12px 0 0;
          font-size: 34px;
          line-height: 1.1;
        }
        .cover p, .toc p, .print-page p, li { line-height: 1.7; }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 24px;
        }
        .meta-card, .zone, .toc-list {
          border: 1px solid rgba(41, 34, 28, 0.12);
          border-radius: 20px;
          padding: 16px;
          background: #fff8ef;
        }
        .toc-list {
          margin-top: 20px;
          list-style: none;
          padding: 0;
        }
        .toc-item {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px dashed rgba(41, 34, 28, 0.12);
        }
        .toc-item:last-child { border-bottom: 0; }
        .page-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: start;
          border-bottom: 1px solid rgba(41, 34, 28, 0.12);
          padding-bottom: 16px;
        }
        .template-tag {
          border: 1px solid rgba(41, 34, 28, 0.12);
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          color: #7d3218;
          background: #f4e5d5;
          white-space: nowrap;
        }
        .page-narrative { margin-top: 16px; }
        .zones {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 14px;
          margin-top: 24px;
        }
        .zone { grid-column: span 8; }
        .zone-hero { grid-column: span 12; }
        .zone-pull { grid-column: span 4; }
        .zone-meta {
          color: #675f57;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          margin-bottom: 10px;
        }
        ul { margin: 0; padding-left: 18px; }
      </style>
    </head>
    <body>
      <main class="document">
        <section class="cover">
          <p class="eyebrow">AI Magazine OS</p>
          <h1>${escapeHtml(issue.projectName)}</h1>
          <p>Issue ${issue.issueNumber}: ${escapeHtml(issue.title)}</p>
          <div class="meta-grid">
            <div class="meta-card"><strong>Status</strong><br />${escapeHtml(issue.status)}</div>
            <div class="meta-card"><strong>Total Pages</strong><br />${pages.length}</div>
            <div class="meta-card"><strong>Generated</strong><br />Structured editorial pipeline</div>
          </div>
        </section>
        <section class="toc">
          <p class="eyebrow">Table of Contents</p>
          <h2>Page map</h2>
          <ol class="toc-list">${tocItems}</ol>
        </section>
        ${pageMarkup}
      </main>
    </body>
  </html>`;
}
