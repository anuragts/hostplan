-- Privacy-preserving, complete UTC-day aggregates for Hostplan's Daily Sunrise.
--
-- This table contains no user identifiers, referrer URLs, query strings, plan
-- ids, share codes, project names, or branches. Writes are service-only; RLS is
-- enabled without browser policies.

create table if not exists public.hostplans_daily_sunrise_snapshots (
  snapshot_date date not null,
  scope text not null check (scope in ('overall', 'public-path', 'article')),
  public_path text not null,
  article_slug text,
  automation_pr_number integer check (automation_pr_number > 0),
  automation_commit_sha text check (automation_commit_sha ~ '^[0-9a-f]{7,40}$'),
  new_users bigint not null check (new_users >= 0),
  returning_users bigint not null check (returning_users >= 0),
  page_views bigint not null check (page_views >= 0),
  organic_search_sessions bigint not null check (organic_search_sessions >= 0),
  ai_answer_referral_sessions bigint not null check (ai_answer_referral_sessions >= 0),
  activation_events bigint not null check (activation_events >= 0),
  insight text not null check (char_length(insight) between 1 and 500),
  decision text not null check (char_length(decision) between 1 and 500),
  is_complete boolean not null default true check (is_complete),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (snapshot_date, scope, public_path),
  check (
    (scope = 'overall' and public_path = '*')
    or (scope <> 'overall' and public_path <> '*')
  ),
  check (public_path = '*' or (
    public_path like '/%'
    and public_path not like '/p/%'
    and public_path not like '/api/%'
    and position('?' in public_path) = 0
    and position('#' in public_path) = 0
  )),
  check (
    (scope = 'article' and article_slug ~ '^[a-z0-9-]+$')
    or (scope <> 'article' and article_slug is null)
  ),
  check (automation_pr_number is not null or automation_commit_sha is not null)
);

alter table public.hostplans_daily_sunrise_snapshots enable row level security;

comment on table public.hostplans_daily_sunrise_snapshots is
  'Complete UTC-day product aggregates only; no PII or private-plan metadata.';

drop trigger if exists hostplans_daily_sunrise_touch_updated_at
  on public.hostplans_daily_sunrise_snapshots;
create trigger hostplans_daily_sunrise_touch_updated_at
before update on public.hostplans_daily_sunrise_snapshots
for each row execute function public.touch_updated_at();
