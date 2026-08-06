-- Expand the curated theme allowlist with three dark document themes.

alter table public.plans drop constraint if exists plans_theme_check;

alter table public.plans add constraint plans_theme_check
  check (theme in (
    'hostplan',
    'midnight',
    'terminal',
    'nocturne',
    'working-draft',
    'office-memo',
    'editorial',
    'technical-brief',
    'executive'
  ));
