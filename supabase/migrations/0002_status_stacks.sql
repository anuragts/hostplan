-- Plan lifecycle and stacks.
--
-- Run once in the Supabase SQL editor. Safe to re-run: every statement is
-- guarded.
--
-- `status` is where a plan is in its life (draft → approved → in-progress →
-- done, or superseded). `depends_on` chains plans into stacks: a plan is
-- blocked until the plan it depends on is done. Both also live in each plan
-- file's frontmatter — these columns are the index's copy, same as title.

alter table public.plans add column if not exists status text not null default 'draft'
  check (status in ('draft', 'approved', 'in-progress', 'done', 'superseded'));

-- No foreign key: a dependency may be deleted, live only locally, or arrive
-- later — a dangling link is defined as "not blocking" rather than an error.
alter table public.plans add column if not exists depends_on text;

-- The dashboard splits active from settled per user.
create index if not exists plans_user_status on public.plans (user_id, status);
