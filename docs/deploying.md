# Deploying to plans.host-plan.com

Everything below is one-time setup. The app is built; these are the account
steps that need your credentials.

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Storage → **New bucket** → name it `plans`, leave **Public** off.
   The bucket must stay private: the app reads it server-side and does its own
   access checks, so a public bucket would bypass every share code.
3. Settings → API → copy the **Project URL** and the **secret key** (`sb_secret_…`; older projects call this `service_role`).

The secret key bypasses row-level security. It only ever belongs in a
server environment variable — never `NEXT_PUBLIC_*`, never client code.

## 2. Owner token

```bash
openssl rand -hex 32
```

Keep it. It is the credential for the CLI and for browsing every plan.

## 3. Vercel

Import the GitHub repo, then:

| Setting | Value |
| --- | --- |
| Root directory | `apps/web` |
| Framework | Next.js (detected) |
| Install command | `bun install` |
| Build command | `bun run build` |

Environment variables:

```
HSP_TOKEN=<the token from step 2>
SUPABASE_URL=<project url>
SUPABASE_SECRET_KEY=<sb_secret_... from Settings → API>
```

`SUPABASE_URL` is what flips the app from the local filesystem to the bucket,
and `HSP_TOKEN` is what turns auth on. Neither is set locally, which is why
`localhost:7433` stays open and file-backed.

Deploy, then check the preview URL before touching DNS:

```bash
curl -s https://<project>.vercel.app/api/health     # {"app":"hostplan",...}
curl -s -o /dev/null -w '%{http_code}\n' https://<project>.vercel.app/   # 307 -> /login
```

## 4. Domain

1. Vercel → project → Settings → Domains → add `plans.host-plan.com`.
2. Cloudflare → DNS → add:

   | Type | Name | Content | Proxy |
   | --- | --- | --- | --- |
   | CNAME | `plans` | `cname.vercel-dns.com` | **DNS only (grey cloud)** |

   Leave the proxy **off**. Orange-clouding a Vercel CNAME breaks their
   certificate issuance — this is the step people lose an afternoon to.
3. Wait for Vercel to report the domain as valid; TLS is automatic.

Optionally point the apex at it with a Cloudflare redirect rule:
`host-plan.com/*` → `https://plans.host-plan.com/$1`.

## 5. Point the CLI at it

Not yet built — `hsp` currently writes to the local store only. Until
`hsp login` lands, plans reach the deployment through the API:

```bash
curl -X POST https://plans.host-plan.com/api/plans \
  -H "Authorization: Bearer $HSP_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"content":"# Plan\n\nbody","title":"Plan","project":"nest","branch":"main","visibility":"private"}'
```

The response carries `url` and, for private plans, `codedUrl`.

## What to check once it's live

```bash
# public plan opens for anyone
curl -s -o /dev/null -w '%{http_code}\n' https://plans.host-plan.com/p/<public-id>

# private plan gives up nothing without the code
curl -s https://plans.host-plan.com/p/<private-id> | grep -c '<known body text>'   # 0
curl -s -o /dev/null -w '%{http_code}\n' https://plans.host-plan.com/api/raw/<private-id>  # 404

# the coded link walks in
curl -s https://plans.host-plan.com/p/<private-id>?code=XXXX | grep -c '<known body text>'  # >=1

# index pages stay owner-only
curl -s -o /dev/null -w '%{http_code}\n' https://plans.host-plan.com/    # 307
```

## Operational notes

- **Rotating `HSP_TOKEN`** invalidates every browser session and CLI at once,
  by design. Share codes are unaffected — they live in the plans.
- **A leaked share code** is fixed per plan with `hsp rotate <id>`, or
  `PATCH /api/plans/<id> {"rotateCode":true}`.
- **Rate limiting is in-memory**, so on serverless it is per-instance and
  resets on cold start. It raises the cost of grinding 234k combinations
  without being a hard guarantee — which is the honest security level of a
  4-letter code. Move the counter into the Supabase Postgres if it ever needs
  to be more than that.
- **Free-tier Supabase projects pause** after about a week idle, so a rarely
  visited viewer may take a cold start on the first request.
