# Multi-user hostplan: accounts, per-user plans, agent login

## Context

hostplan is live at plans.host-plan.com, but it has exactly one user: whoever
holds `HSP_TOKEN`. That token is the whole authorisation model — it gates
writes, the index, and browsing private plans. Sharing works per plan via a
4-letter code, which stays.

The goal now: **anyone can sign up, plans belong to their author, and a
dashboard shows you yours and only yours.** Agents need to log in from the CLI
too, headless, without a browser.

## The thing that actually changes

Today the directory tree *is* the index — no manifest, nothing to keep in sync.
That works because one person owns every plan, so `/p/<id>` can find a plan by
walking two levels of directories.

With many users, plans live under `<user_id>/…`, and `/p/<id>` would have to
scan **every user's prefix** to resolve one id. That is O(users) per page load,
and it also means one user's storage listing is readable while serving another
user's plan.

So multi-user forces an index. That is the real cost of this feature, and it is
worth naming up front rather than discovering it halfway through:

> **Postgres becomes the index; Storage stays the content.**

Metadata (id, owner, title, project, branch, visibility, code, storage path)
moves into a `plans` table. The markdown stays in the bucket. The `PlanStore`
interface already in `packages/core` is the seam this slots into — a third
implementation alongside `FsStore` and `SupabaseStore`.

## Decisions

| Area | Choice | Why |
| --- | --- | --- |
| Human auth | Supabase Auth — GitHub OAuth + email magic link | Users are developers; GitHub is one click. Magic link covers everyone else. No passwords to store or reset |
| Agent/CLI auth | Personal access tokens, plus a device flow for humans at a terminal | An agent cannot open a browser. A PAT is pasteable and scriptable; the device flow is nicer when a human is present |
| Authorisation | Postgres RLS on `plans`, using the caller's JWT | The database enforces ownership, so a bug in a route handler cannot leak another user's plans. Defence that does not depend on my `canRead()` being right |
| Anonymous code reads | One service-role path, after the code check | RLS cannot express "anonymous but holds the right code", so exactly one route bypasses it — small enough to audit |
| Content | Stays in Storage at `<user_id>/<project>/<branch>/<id>--<slug>.md` | Plans are files; keeps `hsp get` honest and the store hand-inspectable |
| Existing `HSP_TOKEN` | Kept, as a single-owner escape hatch | Deployments that want one user shouldn't need accounts. Also how the current data migrates |

**Deliberately not doing:** teams and shared workspaces, per-plan ACLs beyond
public/private/code, billing, plan editing in the browser. Each is a real
feature; none is needed for "users can log in and see their plans."

## Schema

```sql
create table plans (
  id            text primary key,                       -- the 6-char public id
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  project       text not null,
  branch        text not null,
  format        text not null default 'md',
  visibility    text not null default 'private',
  code          text,                                   -- 4 letters; null when public
  storage_path  text not null,
  cwd           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index plans_user_updated on plans (user_id, updated_at desc);
create index plans_user_project on plans (user_id, project, branch);

create table api_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null default 'cli',
  token_hash   text not null unique,                    -- sha256; never the token
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

-- Short-lived, for `hsp login` when a human is at the terminal.
create table cli_auth_requests (
  device_code  text primary key,                        -- secret, polled by the CLI
  user_code    text not null unique,                    -- 6 chars, read aloud
  user_id      uuid references auth.users(id) on delete cascade,
  approved_at  timestamptz,
  expires_at   timestamptz not null default now() + interval '10 minutes'
);
```

**API tokens are hashed, share codes are not** — and that difference is
deliberate. A share code has to be *displayed* (`hsp share` prints the coded
URL), so it cannot be one-way. An API token is shown once at creation and never
again, so it can be. Storing a token in plaintext because we happened to do
that for codes would be the wrong lesson to carry over.

### RLS

```sql
alter table plans enable row level security;

create policy "own plans" on plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public plans are readable by anyone, including anonymous visitors.
create policy "public plans readable" on plans
  for select using (visibility = 'public');
```

Private-with-code reads are the one case RLS cannot express, so they go through
a single service-role route that checks the code first. Everything else — the
dashboard, the API, every write — runs as the signed-in user and is enforced by
Postgres.

Storage gets the matching rule so a signed URL can't cross accounts:

```sql
create policy "own files" on storage.objects
  for all using (bucket_id = 'plans' and (storage.foldername(name))[1] = auth.uid()::text);
```

## Web

- `/login` — GitHub button + magic-link field, replacing the token box.
- `/` — landing for anonymous (unchanged), **dashboard** for signed-in users:
  their plans grouped by project, newest first.
- `/p/<id>` — unchanged rules, one more branch: public → anyone; owner → always;
  correct `?code=` → anyone; otherwise the code gate.
- `/settings/tokens` — create and revoke CLI tokens. Token shown **once**.
- Ownership is now visible: a plan page shows whose it is only to that person.

## CLI

```
hsp login                 # device flow: prints a URL + 6-char code, polls
hsp login --token hsp_…   # paste a PAT — the headless/agent path
hsp whoami                # prints the signed-in email and deployment
hsp logout
```

Everything else is unchanged. `hsp add` still pushes; the server derives the
owner from the token rather than trusting anything the client says.

**The device flow, concretely:**

1. `hsp login` → `POST /api/cli/auth` → `{ device_code, user_code, verify_url }`
2. CLI prints: `open https://plans.host-plan.com/cli — code: KRWT-9F`
3. CLI polls `POST /api/cli/token` with the device code every 2s
4. Human signs in, approves; the row gets a `user_id`
5. Poll returns a freshly minted PAT; CLI saves it at 0600

An agent that cannot open a browser uses `--token` with a PAT from settings.
This is why both exist: the device flow is better UX, the PAT is the one that
works unattended.

## Migration

Existing plans have no owner, and the deployment currently has real data in it.

1. Ship the schema and backfill nothing — `user_id` is nullable for one release.
2. `HSP_TOKEN` requests resolve to a designated owner user id
   (`HSP_OWNER_USER_ID`), so today's CLI keeps working unchanged.
3. Sign in once with the account that should own the existing plans, run a
   one-shot `scripts/adopt-plans.ts` to set `user_id` on the orphans and move
   their storage objects under `<user_id>/`.
4. Make `user_id` non-null.

The current `~/.hostplan` local store is untouched by all of this — it stays
file-backed and owner-free, which is what keeps `hsp` usable offline.

## Build order

1. Schema + RLS in Supabase; `PostgresStore` implementing `PlanStore`
2. Run the existing contract suite against it — same 8 tests, third backend
3. Supabase Auth wired into `/login`; session helpers replacing token-only auth
4. Dashboard at `/` for signed-in users
5. `api_tokens` + `/settings/tokens` + bearer-token resolution to a user
6. CLI device flow + `--token`
7. Migration script, then `user_id` not-null

Steps 1–2 are worth doing alone first: if `PostgresStore` passes the contract,
the risky part is done and the rest is wiring.

## Verification

Beyond the existing read matrix, the new questions are all about isolation:

```
two accounts, A and B
  A's dashboard                     -> only A's plans
  B GETs /api/plans/<A's plan id>   -> 404, not 403 (no existence oracle)
  B's token in the CLI              -> pushes land under B
  A's private plan + correct code   -> readable by B, and by anonymous
  A publishes                       -> readable by anyone, no code
  revoke A's token                  -> that CLI stops working immediately
  delete A's account                -> A's plans and files are gone (cascade)
```

The one to check by hand: RLS is doing the work, not the route handler. Point a
raw Supabase client with B's JWT at A's row and confirm Postgres refuses —
because if the only thing standing between two users is my `if` statement, the
policy isn't earning its keep.

## Costs

Supabase free tier: 50k monthly active users, 500 MB database, 1 GB storage.
Vercel Hobby unchanged. Still $0 beyond the domain.
