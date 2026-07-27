# Hostplan SEO and AEO baseline

Recorded on 2026-07-28 before the public discovery implementation.

## Product and domain

- Canonical product domain: `https://plans.host-plan.com`
- Source repository: `https://github.com/anuragts/hostplan`
- Positioning used for the implementation:
  "Hostplan is an open-source CLI and web viewer that gives coding-agent plans
  stable, shareable, machine-readable URLs."

## Verified technical baseline

- `/` returned `200 text/html`.
- `/robots.txt`, `/sitemap.xml`, and `/llms.txt` redirected anonymous requests
  to `/login`.
- Root metadata contained only the title `hostplan` and description
  `A central store for agent plans.`
- No canonical, Open Graph, Twitter, sitemap, robots route, or JSON-LD layer
  existed in the web app.
- Live plan pages explicitly returned `noindex, nofollow`. This is an intended
  privacy boundary and must remain.
- PostHog was initialized with defaults but had no explicit acquisition
  taxonomy or conversion events.
- The homepage promoted `npx hostplan add PLAN.md`; the `hostplan` package
  returned npm `404`.

## Discovery baseline

Searches checked:

1. `"hostplan" "plans.host-plan.com"`
2. `"hostplan" coding agent plans`
3. `site:plans.host-plan.com hostplan`
4. `site:github.com/anuragts/hostplan`

The coding-agent product did not appear in the sampled results. Unrelated
web-hosting products dominated the brand term.

## Repository baseline

- Repository visibility: public
- Stars: 1
- Forks: 0
- Topics: `ai-agents`, `claude-code`, `codex`
- npm package: not published

## Target query set

1. `how to share a coding agent plan`
2. `persist plans between coding agent sessions`
3. `handoff a plan from Codex to Claude Code`
4. `central store for AI coding agent plans`
5. `share PLAN.md with a teammate`
6. `resume an AI coding task from a plan`
7. `coding agent plan management`
8. `machine-readable implementation plan URL`

## Measurement after deployment

Track only coarse acquisition source and known public paths. Redact live plan
ids, share codes, project names, branches, private routes, full referrers, and
query strings.

Primary activation events:

- installation command copied;
- GitHub repository opened;
- sign-in started;
- plan opened in Codex, Claude Code, or Cursor.

Search Console, Bing Webmaster Tools, Bing AI Performance, and external
answer-engine prompt checks require the deployed routes and account ownership;
they cannot be populated from the local repository alone.

After the public routes deploy, notify participating search engines with:

```bash
bun run --cwd apps/web submit:indexnow
```

The command first verifies the deployed IndexNow key and will refuse to submit
URLs while production is still serving the previous build.
