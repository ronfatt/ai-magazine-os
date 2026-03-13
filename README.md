## AI Magazine OS

MVP scaffold for a structured magazine publishing SaaS. This foundation focuses on project structure, route scaffolding, Supabase integration, starter SQL, and placeholder UI for future AI-powered editorial modules.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Supabase
- Vercel-ready deployment

## Folder Tree

```text
.
├── app
│   ├── (app)
│   │   ├── brand-kit/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── issues/[id]/page.tsx
│   │   ├── layout.tsx
│   │   ├── projects/[id]/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── review/page.tsx
│   │   └── templates/page.tsx
│   ├── (auth)/login/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── dashboard
│   ├── layout
│   └── shared
├── lib
│   ├── data
│   ├── supabase
│   └── types
├── proxy.ts
├── supabase/schema.sql
└── .env.example
```

## Included in This First Pass

- App routes for `/login`, `/dashboard`, `/projects`, `/projects/[id]`, `/issues/[id]`, `/review`, `/templates`, and `/brand-kit`
- Dashboard shell with left sidebar, topbar, metrics cards, and placeholder module panels
- Supabase browser/server clients plus proxy-based session refresh
- Initial SQL schema for `profiles`, `brands`, `projects`, `issues`, `contents`, `assets`, `pages`, and `templates`
- Issue-level content ingestion for pasted text, PDF uploads, and image uploads
- OpenAI-powered text structuring pipeline with preview-ready editorial JSON
- Phase 5 foundation for template schema, page JSON generation, and issue preview layout
- Phase 6 foundation for print view, TOC, page numbering, and PDF export
- Demo seed workspace and dashboard onboarding flow
- Core TypeScript domain types and typed database shape
- Safe dashboard data fallback that uses mock data until Supabase env vars are configured

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env.local
```

3. Add your Supabase project values to `.env.local`.
   Content ingestion uses `SUPABASE_SERVICE_ROLE_KEY` on the server so uploads can write to Storage and insert related rows.
   AI structuring also needs `OPENAI_API_KEY`. `OPENAI_MODEL` is optional and defaults to `gpt-4.1`.
   Magic-link auth needs your Supabase Auth redirect URLs to include `/auth/callback` for local and production domains.

4. Run the SQL in [supabase/schema.sql](/Users/rms/Desktop/Ai Project/ai-magazine-os/supabase/schema.sql) inside the Supabase SQL editor.
   This creates the `issue-assets` Storage bucket plus the fields needed for ingestion, analysis, and page generation, including `structured_content`, `analysis_status`, `layout_json`, `locked`, template `category`, and template `preview_url`.
   It also adds owner-based `storage.objects` policies for the private `issue-assets` bucket.

5. Start the app:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000).

7. Optional demo flow:
   Open `/dashboard` and click `Create Demo Workspace` to seed a realistic sample project, issue, content set, and starter pages.

## Next Recommended Steps

1. Attach Supabase Auth flows to [app/(auth)/login/page.tsx](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/(auth)/login/page.tsx).
2. Replace mock cards with real inserts and list queries for projects, issues, and assets.
3. Add storage upload flows for editorial source files.
4. Introduce project membership tables and richer RLS once collaboration starts.
5. Build the first AI-ready content normalization pipeline on top of `contents` and `templates`.

## Issue Content Upload Notes

- Upload UI lives inside [app/(app)/issues/[id]/page.tsx](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/(app)/issues/[id]/page.tsx).
- API workflow lives in [app/api/issues/[id]/contents/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/issues/[id]/contents/route.ts).
- Files are written into the Supabase Storage bucket `issue-assets`, then linked through `assets` and `contents`.
- AI parsing is intentionally not implemented yet. Each inserted content row stores a placeholder `parseStatus: "pending"` in `body`.
- Issue review dashboard lives in [components/issues/issue-review-dashboard.tsx](/Users/rms/Desktop/Ai Project/ai-magazine-os/components/issues/issue-review-dashboard.tsx) and summarizes analysis/review readiness for the whole issue.

## AI Structuring Notes

- Text analysis route lives in [app/api/contents/[contentId]/analyze/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/contents/[contentId]/analyze/route.ts).
- OpenAI integration is isolated in [lib/ai/content-structuring.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/lib/ai/content-structuring.ts) and [lib/ai/openai.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/lib/ai/openai.ts).
- Future provider expansion is reserved in [lib/ai/providers.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/lib/ai/providers.ts), so Gemini can later own image understanding without rewriting the issue UI.
- Structured output currently captures `title`, `subtitle`, `summary`, `sections`, `quotes`, `suggested_pages`, and `category`.
- Review/edit screen lives in [app/(app)/contents/[contentId]/page.tsx](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/(app)/contents/[contentId]/page.tsx), with save API at [app/api/contents/[contentId]/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/contents/[contentId]/route.ts).
- Batch analyze route lives in [app/api/issues/[id]/contents/analyze/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/issues/[id]/contents/analyze/route.ts), and review status updates live in [app/api/contents/[contentId]/status/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/contents/[contentId]/status/route.ts).

## Page Generation Notes

- Page generation route lives in [app/api/issues/[id]/pages/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/issues/[id]/pages/route.ts).
- Template blueprints live in [lib/data/templates.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/lib/data/templates.ts).
- Page JSON assembly lives in [lib/data/page-generation.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/lib/data/page-generation.ts).
- Issue preview studio lives in [components/pages/issue-page-studio.tsx](/Users/rms/Desktop/Ai Project/ai-magazine-os/components/pages/issue-page-studio.tsx).
- Page preview now feeds both the interactive studio and the print/PDF export layer.
- Page review actions now include lock/unlock, mark reviewed, publish, move up/down, and regenerate single page through [app/api/pages/[pageId]/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/pages/[pageId]/route.ts), [app/api/pages/[pageId]/move/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/pages/[pageId]/move/route.ts), and [app/api/pages/[pageId]/regenerate/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/pages/[pageId]/regenerate/route.ts).

## Publish Notes

- Issue publish gate lives in [components/issues/issue-publish-dashboard.tsx](/Users/rms/Desktop/Ai Project/ai-magazine-os/components/issues/issue-publish-dashboard.tsx).
- Publish action lives in [app/api/issues/[id]/publish/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/issues/[id]/publish/route.ts).
- The issue can publish only when all content is approved, all text is structured, all pages are reviewed, and all pages are locked.

## Demo Notes

- Demo seeding lives in [app/api/demo/seed/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/demo/seed/route.ts) and [lib/demo/seed.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/lib/demo/seed.ts).
- Dashboard onboarding panel lives in [components/dashboard/onboarding-panel.tsx](/Users/rms/Desktop/Ai Project/ai-magazine-os/components/dashboard/onboarding-panel.tsx).
- The demo workspace now seeds under the currently signed-in user, so RLS and ownership checks stay consistent.

## Auth And Storage Notes

- Session helpers live in [lib/auth/session.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/lib/auth/session.ts).
- Workspace permission helpers live in [lib/auth/access.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/lib/auth/access.ts).
- Login uses Supabase email magic links through [app/(auth)/login/page.tsx](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/(auth)/login/page.tsx) and [app/auth/callback/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/auth/callback/route.ts).
- Protected app routes are enforced in [proxy.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/proxy.ts).
- Private asset access now goes through short-lived signed URLs from [app/api/assets/[assetId]/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/assets/[assetId]/route.ts) and [lib/assets/storage.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/lib/assets/storage.ts).

## Collaboration Notes

- Project collaboration uses the new `project_members` table in [supabase/schema.sql](/Users/rms/Desktop/Ai Project/ai-magazine-os/supabase/schema.sql).
- Current roles are `viewer`, `editor`, and `admin`, with the project owner remaining the highest-access role outside the table.
- Owners and admins can add existing users from [app/api/projects/[id]/members/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/projects/[id]/members/route.ts).
- Project list and detail pages now read real accessible projects from [lib/data/projects.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/lib/data/projects.ts), and collaborator management UI lives in [components/projects/project-members-card.tsx](/Users/rms/Desktop/Ai Project/ai-magazine-os/components/projects/project-members-card.tsx).
- This first pass supports adding users who have already signed in once, because their `profiles` row is used to resolve membership by email.

## PDF Export Notes

- Print document builder lives in [lib/pdf/issue-document.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/lib/pdf/issue-document.ts).
- Browser preview route lives in [app/(print)/issues/[id]/print/page.tsx](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/(print)/issues/[id]/print/page.tsx).
- PDF export route lives in [app/api/issues/[id]/pdf/route.ts](/Users/rms/Desktop/Ai Project/ai-magazine-os/app/api/issues/[id]/pdf/route.ts).
- Export includes a cover page, table of contents, and footer page numbering.
- First implementation uses `puppeteer`, which is strong for local/dev export. For hardened Vercel production, the next improvement is a slimmer Chromium strategy or external browser worker.
