-- hostplan multi-user schema.
--
-- Run once in the Supabase SQL editor. Safe to re-run: every statement is
-- guarded.
--
-- The shape here follows from one fact: with plans stored under <user_id>/,
-- resolving a plan by its public id would otherwise mean scanning every user's
-- storage prefix. So Postgres holds the metadata and the index; Storage keeps
-- the markdown.

create table if not exists public.plans (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade,
  title         text not null,
  project       text not null,
  branch        text not null,
  format        text not null default 'md' check (format in ('md', 'html')),
  visibility    text not null default 'private' check (visibility in ('public', 'private')),
  -- 4 letters, or null once the plan is public. Displayable by design: `hsp
  -- share` has to print it, so unlike an API token it cannot be hashed.
  code          text,
  storage_path  text not null,
  source        text,
  cwd           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- The dashboard's only two queries.
create index if not exists plans_user_updated on public.plans (user_id, updated_at desc);
create index if not exists plans_user_scope on public.plans (user_id, project, branch);

create table if not exists public.api_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null default 'cli',
  -- sha256 of the token. Shown once at creation and never recoverable, which is
  -- why this one *can* be a hash where the share code cannot.
  token_hash   text not null unique,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists api_tokens_user on public.api_tokens (user_id, created_at desc);

-- Backs `hsp login` when a human is at the terminal: the CLI polls device_code
-- while the human approves user_code in a browser.
create table if not exists public.cli_auth_requests (
  device_code text primary key,
  user_code   text not null unique,
  user_id     uuid references auth.users(id) on delete cascade,
  approved_at timestamptz,
  expires_at  timestamptz not null default now() + interval '10 minutes'
);

---------------------------------------------------------------------------
-- Row level security
--
-- These policies are the authorisation, not a second opinion on it. Every
-- request that runs as a signed-in user is constrained here, so a mistake in a
-- route handler cannot return another account's plans.
---------------------------------------------------------------------------

alter table public.plans enable row level security;
alter table public.api_tokens enable row level security;
alter table public.cli_auth_requests enable row level security;

drop policy if exists "own plans" on public.plans;
create policy "own plans" on public.plans
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public plans are readable by anyone, signed in or not.
drop policy if exists "public plans are readable" on public.plans;
create policy "public plans are readable" on public.plans
  for select to anon, authenticated
  using (visibility = 'public');

-- Private-plus-code reads are the one case RLS cannot express — "anonymous, but
-- holding the right secret". That path runs service-role in a single route
-- after checking the code, and is the only bypass in the system.

drop policy if exists "own tokens" on public.api_tokens;
create policy "own tokens" on public.api_tokens
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A signed-in human may only ever approve their own pending request.
drop policy if exists "approve own cli request" on public.cli_auth_requests;
create policy "approve own cli request" on public.cli_auth_requests
  for update to authenticated
  using (user_id is null or auth.uid() = user_id)
  with check (auth.uid() = user_id);

---------------------------------------------------------------------------
-- Storage: <user_id>/<project>/<branch>/<id>--<slug>.md
---------------------------------------------------------------------------

drop policy if exists "own files" on storage.objects;
create policy "own files" on storage.objects
  for all to authenticated
  using (bucket_id = 'plans' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'plans' and (storage.foldername(name))[1] = auth.uid()::text);

---------------------------------------------------------------------------
-- Housekeeping
---------------------------------------------------------------------------

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists plans_touch_updated_at on public.plans;
create trigger plans_touch_updated_at before update on public.plans
  for each row execute function public.touch_updated_at();

-- Expired device-code requests are noise; drop them opportunistically.
create or replace function public.sweep_cli_auth_requests() returns void
language sql as $$
  delete from public.cli_auth_requests where expires_at < now();
$$;
