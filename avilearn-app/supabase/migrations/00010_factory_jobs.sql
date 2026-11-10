-- Content Factory: durable job queue + event log.
-- NOT applied automatically. Apply to STAGING first (crm-staging), then live.

create table if not exists public.factory_jobs (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  file_name text not null,
  source_format text not null check (source_format in ('pptx','pdf','docx','mp4','html')),
  storage_path text not null,
  status text not null default 'queued'
    check (status in ('queued','running','awaiting_review','complete','failed','cancelled')),
  current_stage text,
  completed_stages text[] not null default '{}',
  attempt int not null default 0,
  max_attempts int not null default 3,
  cost_usd numeric(10,4) not null default 0,
  sme_flags jsonb not null default '[]'::jsonb,
  error text,
  locked_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists factory_jobs_status_created_idx
  on public.factory_jobs (status, created_at);

create table if not exists public.factory_job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.factory_jobs(id) on delete cascade,
  stage text,
  kind text not null,
  message text not null,
  data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists factory_job_events_job_idx
  on public.factory_job_events (job_id, id);

-- Lets a retried "saving" stage remove the lessons it created earlier.
alter table public.lessons
  add column if not exists factory_job_id uuid references public.factory_jobs(id) on delete set null;

-- Server-side only (service role). No public policies are created.
alter table public.factory_jobs enable row level security;
alter table public.factory_job_events enable row level security;
