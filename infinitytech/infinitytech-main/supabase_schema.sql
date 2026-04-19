-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

create table if not exists public.projects (
  id            text primary key default gen_random_uuid()::text,
  title_en      text not null,
  title_ar      text not null default '',
  description_en text not null default '',
  description_ar text not null default '',
  overview_en   text,
  overview_ar   text,
  problem_en    text,
  problem_ar    text,
  solution_en   text,
  solution_ar   text,
  thumbnail_url text,
  video_url     text,
  assets_zip_url text,
  tags          text[] not null default '{}',
  status        text not null default 'active' check (status in ('active','completed','archived')),
  github_url    text,
  language      text,
  code_snippet  text,
  timeline      jsonb,
  files         jsonb,
  media         jsonb,
  updates       jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at on every row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

-- Enable Row Level Security
alter table public.projects enable row level security;

-- Public read (portfolio site can fetch without auth)
create policy "Public can read projects"
  on public.projects for select
  using (true);

-- Only service_role (backend) can write
create policy "Service role can insert"
  on public.projects for insert
  with check (auth.role() = 'service_role');

create policy "Service role can update"
  on public.projects for update
  using (auth.role() = 'service_role');

create policy "Service role can delete"
  on public.projects for delete
  using (auth.role() = 'service_role');
