-- Curated document themes.
--
-- The theme id is public appearance metadata, but all other plan metadata and
-- content keep their existing access rules. The default keeps every plan
-- created before this migration visually identical.

alter table public.plans add column if not exists theme text not null default 'hostplan'
  check (theme in (
    'hostplan',
    'working-draft',
    'office-memo',
    'editorial',
    'technical-brief',
    'executive'
  ));
