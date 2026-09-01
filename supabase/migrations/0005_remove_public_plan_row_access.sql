-- Public plans are served by /p/:id and /api/raw/:id after the application has
-- projected out owner-only metadata. Direct PostgREST access returned the full
-- row, including source, cwd, storage_path, and user_id, and also made other
-- users' public plans appear in authenticated dashboard queries.
drop policy if exists "public plans are readable" on public.plans;
