# Hosting hostplan at plans.host-plan.com

## Context

hostplan is local-only today: the CLI writes markdown files into `~/.hostplan`,
and the Next.js viewer reads that folder off disk on every request. That design
was deliberate — and the id-addressed URL scheme (`/p/<id>`) was the seam left
for exactly this move.

The goal now: the same viewer at **https://plans.host-plan.com**, plans pushable
from any machine, readable from anywhere, with auth so it isn't a public dump of
private plans. Domain is registered on Cloudflare; the app deploys to Vercel.

The one real constraint driving everything: **Vercel has no persistent
filesystem.** The store cannot be a folder there, so remote plans need a storage
backend the serverless functions can reach.

## Decisions

| Area | Choice | Why |
| --- | --- | --- |
| App hosting | Vercel (existing account) | Zero-config Next.js; free Hobby tier is plenty |
| DNS | Stays on Cloudflare, `plans` CNAME → Vercel, **DNS-only (grey cloud)** | Proxying through Cloudflare in front of Vercel breaks cert issuance and buys nothing here |
| Storage | Supabase Storage | Plans are just files; keeps the "each plan describes itself" model. Free tier 1 GB ≫ years of plans. Brings Postgres and auth in the same project for free — the obvious growth path if listing ever needs an index or a second user ever appears — and being S3-compatible it isn't welded to Vercel |
| Auth | Owner secret + per-plan visibility | `HSP_TOKEN` for writes and browsing everything; each plan is `public` (bare link) or `private` (4-letter code). No user table, no OAuth dependency |
| Sync model | Local-first, push-through | `hsp add` keeps writing locally, then pushes when a remote is configured. Local store doubles as offline cache |

**Deliberately not doing:** multi-user accounts, OAuth, plan sharing/permissions,
Cloudflare Workers port. All possible later; all premature now. Notably we are
*not* using Supabase Auth yet even though it's sitting right there — the token
scheme is less machinery for one user, and Supabase Auth is the drop-in upgrade
when a second user materialises.

## Architecture

```
hsp add PLAN.md
  ├─ writes ~/.hostplan/plans/...        (unchanged, still works offline)
  └─ POST https://plans.host-plan.com/api/plans   Authorization: Bearer <token>
        └─ Vercel fn → Supabase Storage upload
             bucket `plans`, key <project>/<branch>/<id>--<slug>.md

browser → plans.host-plan.com/p/<id>
  └─ middleware checks session cookie → page reads Supabase instead of fs
```

Object keys mirror today's directory layout exactly, and metadata stays in each
file's frontmatter. The bucket is **private**; only the server (service-role
key) touches it, so the existing auth story is unchanged. Listing walks the
two-level prefix tree (`list()` per project, then per branch) plus a download
per plan — same shape as the fs walk today, fine at hundreds of plans. If it
ever isn't, the free Postgres sitting next to the bucket is the index; still a
cache, not a second source of truth.

## Build steps

### 1. Storage adapter in `packages/core`

Extract today's fs calls behind one interface — this is the whole port:

```ts
interface PlanStore {
  add(input: AddPlanInput): Promise<StoredPlan>;
  get(id: string): Promise<StoredPlan | undefined>;
  list(filter: PlanFilter): Promise<StoredPlan[]>;
  remove(id: string): Promise<StoredPlan | undefined>;
}
```

`FsStore` is the existing code moved. `SupabaseStore` is
`@supabase/supabase-js` storage calls (`upload`/`download`/`list`/`remove`)
against a private `plans` bucket, created server-side with the service-role
key — never the anon key, since the bucket bypasses RLS entirely through it.
The web app picks by env: `SUPABASE_URL` present → supabase, else fs. Nothing
else in web or cli changes semantics.

### 2. API routes in `apps/web`

- `POST /api/plans` — body: content + meta; allocates id, writes to store
- `GET /api/plans?project=&branch=` and `GET /api/plans/:id`
- `DELETE /api/plans/:id`

All gated on `Authorization: Bearer <HSP_TOKEN>` compared with
`crypto.timingSafeEqual`. These routes also work locally against `FsStore`,
which is how they get tested without deploying.

### 3. Auth — three tiers

Writing and reading are different problems with different audiences:

| Tier | Who | Credential | Can |
| --- | --- | --- | --- |
| Owner | you + your agents | `HSP_TOKEN` (bearer / login cookie) | everything: write, delete, browse all plans, see codes |
| Code holder | someone you shared a private plan with | that plan's 4-letter code | read that one plan |
| Everyone | anyone with the link | — | read public plans |

**Owner** stays as designed: `openssl rand -hex 32` → Vercel env `HSP_TOKEN`;
CLI sends it as a bearer header, the browser gets it via `/login` → httpOnly
cookie. All writes require it. Rotation = change the env var.

**Per-plan visibility.** Every plan carries `visibility: public | private` in
its frontmatter. Private plans also carry a `code` — 4 letters, generated at
add time from `A–Z` minus lookalikes (`I O Q L`), stored plaintext in the
frontmatter (the store is owner-only; the code is not a secret *from the
owner*). Default visibility is **private**, set in config as
`default_visibility` — publishing should be the deliberate act, not the
accident.

**Read rules, enforced in one place** (a `canRead(plan, request)` helper used
by the page, the raw route, and the API):

1. `visibility: public` → serve.
2. Owner session cookie → serve, always.
3. `?code=` matches the plan's code (case-insensitive) → serve.
4. Otherwise → the plan page renders a 4-letter code form instead of the body.
   On a correct entry it redirects to `/p/<id>?code=XXXX` — so after entering
   the code once, **the address bar holds the shareable coded URL**. That's the
   deliberate trick of the scheme: the two share formats are
   `…/p/<id>` (asks for the code) and `…/p/<id>?code=XXXX` (walks right in),
   and either one can be pasted onward.

Index pages (`/`, `/<project>`, `/<branch>`) stay **owner-only**. Sharing is
per-plan by link; the directory of everything you're planning is not the
shareable surface.

**Honesty about 4 letters:** 22⁴ ≈ 234k combinations. That is casual privacy —
"randoms and crawlers can't read this" — not cryptography. Two mitigations make
it fine for what it is: code checks are rate-limited (10 tries/min per IP, 429
after), and a code only ever unlocks its one plan. Anything genuinely sensitive
shouldn't be in a hosted plan at all. `hsp code rotate <id>` reissues a code if
one leaks.

Local (`localhost:7433`) skips all of this — no login, no codes. The
frontmatter fields simply ride along until a plan is pushed.

### 4. CLI remote mode

- `hsp login` / `hsp logout` — manage `remote` + `token` in config.
- `hsp add --public` / `--private` — the agent states the intent per plan;
  omitted → `default_visibility` from config (initially `private`). After the
  local write, push to the remote and print what's shareable:

  ```
  ✓ stored  Worktree GC  ·  nest / feat/delivery  ·  a3f9c2  ·  private
  → https://plans.host-plan.com/p/a3f9c2            asks for code
  → https://plans.host-plan.com/p/a3f9c2?code=KRWT  opens directly
  ```

  Public plans print the one bare URL. `--local` skips the push; a failed push
  warns but doesn't fail the add (the plan exists locally — degrade, don't
  lose work).
- `hsp share <id>` — reprint both link forms for a plan without re-adding.
- `hsp publish <id>` / `hsp unpublish <id>` — flip visibility later;
  `hsp code rotate <id>` — reissue a leaked code.
- `hsp get/list`: local first, remote fallback (`--remote` to force).
- Keep `ensureServer()` only for when no remote is configured.

### 5. Vercel project

- Import the GitHub repo; **root directory `apps/web`** (monorepo — Vercel
  needs to be told). Build with bun per repo convention.
- Supabase side, once: create the project, create a **private** bucket named
  `plans`, copy the URL + service-role key.
- Vercel env: `HSP_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- The `Open in` deep links keep working as-is — they encode the *store path* of
  the plan, which now differs per machine. v1: hide the button when the plan's
  `cwd` isn't on this machine's store… not knowable server-side, so simpler:
  keep the button; the prompt says "Read the plan at <URL>" instead of a local
  path when serving remotely. Codex/Claude can fetch a URL fine.

### 6. Domain wiring

1. Vercel → project → Settings → Domains → add `plans.host-plan.com`.
2. Cloudflare DNS → add `CNAME  plans  cname.vercel-dns.com`, proxy **off**
   (grey cloud). Vercel then issues TLS automatically.
3. Optional: apex `host-plan.com` → Cloudflare redirect rule to
   `https://plans.host-plan.com` (or leave parked for a landing page later).

### 7. Ship order

1. Storage adapter + API routes (works fully locally — test with curl)
2. Visibility + codes in core (`visibility`, `code` in frontmatter; `canRead`)
3. Owner auth middleware + `/login`; code form + redirect on `/p/[id]`
4. `hsp login`, `--public/--private`, push-through `add`, `share`,
   `publish/unpublish`, `code rotate`, remote `get`/`list`
5. Vercel project + Supabase bucket + envs → verify on `*.vercel.app`
6. DNS + domain → verify on plans.host-plan.com
7. README: "Hosting your own" section

## Verification

```bash
# local, before deploying — FsStore + auth on localhost, no Supabase needed.
# Then once more with SUPABASE_URL set, against a scratch bucket, before DNS.
HSP_TOKEN=test bun run dev
curl -s -H "Authorization: Bearer test" -d @plan.json localhost:7433/api/plans

# after deploy
hsp login                                   # paste token + https://plans.host-plan.com
hsp add PLAN.md --public                    # one bare URL, opens for anyone
hsp add PLAN.md --private                   # two URLs, 4-letter code

# the read matrix — every row checked against the page AND /api/raw/<id>
#   public plan, no cookie, no code      -> 200
#   private, bare URL, logged out        -> code form (page) / 401 (raw)
#   private, ?code=RIGHT                 -> 200, address bar keeps the code
#   private, ?code=wrong                 -> form again; 11th try in a minute -> 429
#   private, owner cookie, no code       -> 200
#   /, /<project> logged out             -> redirect to /login even if plans are public
open https://plans.host-plan.com/p/<id>     # enter code -> lands on ?code=XXXX
hsp share <id>                              # reprints both link forms
hsp code rotate <id>                        # old coded URL stops working
```

Also worth checking by hand: push from a second machine with the same token,
and `hsp add` while offline (must still store locally and warn, not fail).

## Costs

Vercel Hobby $0 · Supabase free tier $0 (1 GB storage; project pauses after a
week idle on free — a plan viewer waking on first request is acceptable) ·
Cloudflare DNS $0. Total: the domain.
