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
| Storage | Vercel Blob | Plans are just files; keeps the "each plan describes itself" model and one vendor. Free tier ~1 GB ≫ years of plans |
| Auth | Single owner secret (`HSP_TOKEN`) | One user. Bearer header for the CLI, cookie session for the browser. No user table, no OAuth dependency |
| Sync model | Local-first, push-through | `hsp add` keeps writing locally, then pushes when a remote is configured. Local store doubles as offline cache |

**Deliberately not doing:** multi-user accounts, OAuth, plan sharing/permissions,
Cloudflare Workers port. All possible later; all premature now.

## Architecture

```
hsp add PLAN.md
  ├─ writes ~/.hostplan/plans/...        (unchanged, still works offline)
  └─ POST https://plans.host-plan.com/api/plans   Authorization: Bearer <token>
        └─ Vercel fn → Blob put plans/<project>/<branch>/<id>--<slug>.md

browser → plans.host-plan.com/p/<id>
  └─ middleware checks session cookie → page reads Blob instead of fs
```

Blob keys mirror today's directory layout exactly (`plans/<project>/<branch>/
<id>--<slug>.md`), and metadata stays in each file's frontmatter. Listing uses
Blob's prefix list + a read per plan — fine at hundreds of plans, and if it ever
isn't, the fix is a cache, not a schema.

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

`FsStore` is the existing code moved, `BlobStore` is `@vercel/blob` put/list/get
with the same keys. The web app picks by env: `BLOB_READ_WRITE_TOKEN` present →
blob, else fs. Nothing else in web or cli changes semantics.

### 2. API routes in `apps/web`

- `POST /api/plans` — body: content + meta; allocates id, writes to store
- `GET /api/plans?project=&branch=` and `GET /api/plans/:id`
- `DELETE /api/plans/:id`

All gated on `Authorization: Bearer <HSP_TOKEN>` compared with
`crypto.timingSafeEqual`. These routes also work locally against `FsStore`,
which is how they get tested without deploying.

### 3. Auth

- Generate once: `openssl rand -hex 32` → Vercel env `HSP_TOKEN`.
- **CLI**: `hsp login` prompts for token + remote URL, saves to
  `~/.hostplan/config.json` (chmod 600). Sent as the bearer header.
- **Browser**: `/login` page posts the token; on match, sets an httpOnly
  `hsp_session` cookie (HMAC of the token, 30-day expiry). `middleware.ts`
  redirects everything except `/login`, `/api/*`, and icons to `/login` when
  the cookie is absent/invalid.
- Rotation = change the env var; every session and CLI dies at once. Correct
  behaviour for a leaked single-owner secret.

### 4. CLI remote mode

- `hsp login` / `hsp logout` — manage `remote` + `token` in config.
- `hsp add`: after the local write, push to the remote; print the
  **plans.host-plan.com** URL as primary and the local path under it.
  `--local` skips the push; failure to push warns but doesn't fail the add
  (the plan exists locally — degrade, don't lose work).
- `hsp get/list`: local first, remote fallback (`--remote` to force).
- Keep `ensureServer()` only for when no remote is configured.

### 5. Vercel project

- Import the GitHub repo; **root directory `apps/web`** (monorepo — Vercel
  needs to be told). Build with bun per repo convention.
- Env: `HSP_TOKEN`, `BLOB_READ_WRITE_TOKEN` (auto-added when the Blob store is
  attached in the dashboard).
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
2. Auth middleware + `/login`
3. `hsp login` + push-through `add`, remote `get`/`list`
4. Vercel project + Blob + envs → verify on `*.vercel.app`
5. DNS + domain → verify on plans.host-plan.com
6. README: "Hosting your own" section

## Verification

```bash
# local, before deploying (FsStore + auth on localhost)
HSP_TOKEN=test bun run dev
curl -s -H "Authorization: Bearer test" -d @plan.json localhost:7433/api/plans
curl -s localhost:7433/p/<id>            # -> 307 to /login without cookie

# after deploy
hsp login                                 # paste token + https://plans.host-plan.com
cd some-repo && hsp add PLAN.md           # prints the public URL
open https://plans.host-plan.com/p/<id>   # login once, renders
curl -s https://plans.host-plan.com/api/plans/<id>          # 401
curl -s -H "Authorization: Bearer <token>" ...              # 200
```

Also worth checking by hand: push from a second machine with the same token,
and `hsp add` while offline (must still store locally and warn, not fail).

## Costs

Vercel Hobby $0 · Blob free tier $0 · Cloudflare DNS $0. Total: the domain.
