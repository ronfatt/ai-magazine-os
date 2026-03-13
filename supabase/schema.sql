create extension if not exists "pgcrypto";

create type public.project_status as enum ('draft', 'active', 'archived');
create type public.issue_status as enum ('planning', 'in_progress', 'in_review', 'published');
create type public.content_status as enum ('uploaded', 'structured', 'approved');
create type public.asset_kind as enum ('image', 'video', 'pdf', 'audio', 'document');
create type public.page_status as enum ('queued', 'generated', 'reviewed', 'published');
create type public.template_scope as enum ('system', 'brand', 'project');
create type public.project_member_role as enum ('viewer', 'editor', 'admin');

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null unique,
  primary_color text,
  accent_color text,
  typography_scale jsonb not null default '{"display":"64px","body":"18px"}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  brand_id uuid references public.brands (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  status public.project_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  issue_number integer not null,
  title text not null,
  status public.issue_status not null default 'planning',
  publish_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, issue_number)
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_email text not null,
  role public.project_member_role not null default 'viewer',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, user_id)
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  issue_id uuid references public.issues (id) on delete set null,
  kind public.asset_kind not null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  issue_id uuid references public.issues (id) on delete set null,
  title text not null,
  content_type text not null,
  ingestion_source text not null default 'text',
  raw_text text,
  body jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'uploaded',
  priority integer not null default 3 check (priority between 1 and 5),
  source_asset_id uuid references public.assets (id) on delete set null,
  structured_content jsonb,
  analysis_status text not null default 'pending',
  analysis_provider text,
  analysis_model text,
  analysis_error text,
  analyzed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  brand_id uuid references public.brands (id) on delete set null,
  name text not null,
  category text,
  scope public.template_scope not null default 'system',
  layout_spec jsonb not null default '{}'::jsonb,
  preview_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  issue_id uuid not null references public.issues (id) on delete cascade,
  template_id uuid references public.templates (id) on delete set null,
  page_number integer not null,
  page_role text not null default 'feature',
  status public.page_status not null default 'queued',
  locked boolean not null default false,
  layout_json jsonb,
  content_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (issue_id, page_number)
);

create index if not exists projects_owner_idx on public.projects (owner_id);
create index if not exists issues_project_idx on public.issues (project_id);
create index if not exists project_members_project_idx on public.project_members (project_id);
create index if not exists project_members_user_idx on public.project_members (user_id);
create index if not exists contents_project_idx on public.contents (project_id);
create index if not exists contents_issue_idx on public.contents (issue_id);
create index if not exists assets_project_idx on public.assets (project_id);
create index if not exists pages_issue_idx on public.pages (issue_id);
create index if not exists templates_owner_idx on public.templates (owner_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

drop trigger if exists set_brands_updated_at on public.brands;
create trigger set_brands_updated_at
before update on public.brands
for each row
execute function public.handle_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.handle_updated_at();

drop trigger if exists set_issues_updated_at on public.issues;
create trigger set_issues_updated_at
before update on public.issues
for each row
execute function public.handle_updated_at();

drop trigger if exists set_project_members_updated_at on public.project_members;
create trigger set_project_members_updated_at
before update on public.project_members
for each row
execute function public.handle_updated_at();

drop trigger if exists set_contents_updated_at on public.contents;
create trigger set_contents_updated_at
before update on public.contents
for each row
execute function public.handle_updated_at();

drop trigger if exists set_assets_updated_at on public.assets;
create trigger set_assets_updated_at
before update on public.assets
for each row
execute function public.handle_updated_at();

drop trigger if exists set_templates_updated_at on public.templates;
create trigger set_templates_updated_at
before update on public.templates
for each row
execute function public.handle_updated_at();

drop trigger if exists set_pages_updated_at on public.pages;
create trigger set_pages_updated_at
before update on public.pages
for each row
execute function public.handle_updated_at();

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.projects enable row level security;
alter table public.issues enable row level security;
alter table public.project_members enable row level security;
alter table public.contents enable row level security;
alter table public.assets enable row level security;
alter table public.templates enable row level security;
alter table public.pages enable row level security;

create policy "profiles_manage_self"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "brands_manage_owned"
on public.brands
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "projects_manage_owned"
on public.projects
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "projects_read_member_access" on public.projects;
create policy "projects_read_member_access"
on public.projects
for select
using (
  exists (
    select 1
    from public.project_members
    where project_members.project_id = projects.id
      and project_members.user_id = auth.uid()
  )
);

create policy "issues_manage_owned"
on public.issues
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "issues_read_member_access" on public.issues;
create policy "issues_read_member_access"
on public.issues
for select
using (
  exists (
    select 1
    from public.project_members
    where project_members.project_id = issues.project_id
      and project_members.user_id = auth.uid()
  )
);

drop policy if exists "project_members_read_access" on public.project_members;
create policy "project_members_read_access"
on public.project_members
for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.projects
    where projects.id = project_members.project_id
      and projects.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.project_members as own_membership
    where own_membership.project_id = project_members.project_id
      and own_membership.user_id = auth.uid()
  )
);

drop policy if exists "project_members_manage_owner_admin" on public.project_members;
create policy "project_members_manage_owner_admin"
on public.project_members
for insert
with check (
  exists (
    select 1
    from public.projects
    where projects.id = project_members.project_id
      and projects.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.project_members as own_membership
    where own_membership.project_id = project_members.project_id
      and own_membership.user_id = auth.uid()
      and own_membership.role = 'admin'
  )
);

drop policy if exists "project_members_update_owner_admin" on public.project_members;
create policy "project_members_update_owner_admin"
on public.project_members
for update
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_members.project_id
      and projects.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.project_members as own_membership
    where own_membership.project_id = project_members.project_id
      and own_membership.user_id = auth.uid()
      and own_membership.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = project_members.project_id
      and projects.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.project_members as own_membership
    where own_membership.project_id = project_members.project_id
      and own_membership.user_id = auth.uid()
      and own_membership.role = 'admin'
  )
);

drop policy if exists "project_members_delete_owner_admin" on public.project_members;
create policy "project_members_delete_owner_admin"
on public.project_members
for delete
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_members.project_id
      and projects.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.project_members as own_membership
    where own_membership.project_id = project_members.project_id
      and own_membership.user_id = auth.uid()
      and own_membership.role = 'admin'
  )
);

create policy "contents_manage_owned"
on public.contents
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "contents_read_member_access" on public.contents;
create policy "contents_read_member_access"
on public.contents
for select
using (
  exists (
    select 1
    from public.project_members
    where project_members.project_id = contents.project_id
      and project_members.user_id = auth.uid()
  )
);

create policy "assets_manage_owned"
on public.assets
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "assets_read_member_access" on public.assets;
create policy "assets_read_member_access"
on public.assets
for select
using (
  exists (
    select 1
    from public.project_members
    where project_members.project_id = assets.project_id
      and project_members.user_id = auth.uid()
  )
);

create policy "templates_manage_owned"
on public.templates
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "templates_read_member_access" on public.templates;
create policy "templates_read_member_access"
on public.templates
for select
using (
  exists (
    select 1
    from public.projects
    join public.project_members on project_members.project_id = projects.id
    where projects.owner_id = templates.owner_id
      and project_members.user_id = auth.uid()
  )
);

create policy "pages_manage_owned"
on public.pages
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "pages_read_member_access" on public.pages;
create policy "pages_read_member_access"
on public.pages
for select
using (
  exists (
    select 1
    from public.project_members
    where project_members.project_id = pages.project_id
      and project_members.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('issue-assets', 'issue-assets', false)
on conflict (id) do nothing;

drop policy if exists "issue_assets_upload_owned_issues" on storage.objects;
create policy "issue_assets_upload_owned_issues"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'issue-assets'
  and exists (
    select 1
    from public.issues
    where issues.id::text = split_part(name, '/', 1)
      and issues.owner_id = auth.uid()
  )
);

drop policy if exists "issue_assets_read_owned" on storage.objects;
create policy "issue_assets_read_owned"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'issue-assets'
  and exists (
    select 1
    from public.assets
    where assets.storage_path = name
      and assets.owner_id = auth.uid()
  )
);

drop policy if exists "issue_assets_update_owned" on storage.objects;
create policy "issue_assets_update_owned"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'issue-assets'
  and exists (
    select 1
    from public.assets
    where assets.storage_path = name
      and assets.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'issue-assets'
  and exists (
    select 1
    from public.assets
    where assets.storage_path = name
      and assets.owner_id = auth.uid()
  )
);

drop policy if exists "issue_assets_delete_owned" on storage.objects;
create policy "issue_assets_delete_owned"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'issue-assets'
  and exists (
    select 1
    from public.assets
    where assets.storage_path = name
      and assets.owner_id = auth.uid()
  )
);
