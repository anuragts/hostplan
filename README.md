<img src="icon.svg" width="64" alt="">

# hostplan

A home for the plans your coding agents write.

Agents produce plans constantly and they land wherever — `~/.claude/plans`, a
repo's `PLAN.md`, a scratch file that gets deleted. hostplan gives every plan one
address, filed by project and branch, readable in a browser or by the next agent.

```
$ hsp add PLAN.md
✓ stored  Worktree GC  ·  nest / feat/delivery  ·  a3f9c2  ·  private
→ https://plans.host-plan.com/p/a3f9c2            asks for the code
→ https://plans.host-plan.com/p/a3f9c2?code=KRWT  opens directly
```

Another agent runs `hsp get a3f9c2` to read it back. You open the URL and get a
rendered page, with an **Open in** button that hands the plan straight to Codex,
Claude Code, or Cursor.

Works entirely offline against a folder on your machine. Sign in to a deployment
and the same plans become shareable links.

## Install

Requires [Bun](https://bun.sh) and Node 20+.

```bash
git clone https://github.com/anuragts/hostplan.git
cd hostplan
bun install
bun run build     # builds the viewer, once
bun link          # puts `hsp` on your PATH
```

`hsp` is global — the store lives at `~/.hostplan` and every command works from
any directory, so it's the same in every project. The viewer starts itself the
first time you need it.

## Using it

```bash
hsp add PLAN.md              # store a plan, print its URL
hsp get <id>                 # print a plan to stdout
hsp get latest               # the most recent plan here
hsp list                     # plans for this repo and branch
hsp share <id>               # print its shareable links
```

Plans are live objects, not just documents:

```bash
hsp status <id> approved     # draft → approved → in-progress → done
hsp stack s1.md s2.md s3.md  # chain steps; each waits on the one before
hsp next                     # the first plan that's not done and not blocked
hsp check <id> 2 3           # tick the plan's checkboxes off
hsp update <id> PLAN.md      # revise in place — same id, same link
hsp search rate limiting     # full-text, across every project
```

Project and branch are detected from git, so there's nothing to configure.

**Plans are private by default.** A private plan gets a 4-letter code, and `hsp
add` prints both forms of its link — the bare one asks for the code, the `?code=`
one opens directly. `hsp add --public` gives a single link that opens for anyone.
Publishing should be deliberate, which is why it takes a flag.

Codes are casual privacy, not cryptography: 4 letters is ~234,000 combinations,
rate-limited but guessable given time. Don't host anything genuinely sensitive.

Full command reference, sharing rules, and environment variables:
**[docs/cli.md](docs/cli.md)**. Runnable plans for every workflow command:
**[examples/](examples/)**.

## Hosting it

Everything above works with no server. To get shareable links and a dashboard of
your own plans, deploy it: Next.js on Vercel, Supabase for storage and accounts,
sign-in by magic link, and `hsp login` to connect a terminal.

See **[docs/deploying.md](docs/deploying.md)**.

## Developing

```bash
bun test          # unit tests and the plan-store contract
bun run typecheck
bun run lint      # biome
bun run dev       # viewer with hot reload on :7433
```

Three workspaces:

- `packages/core` — the store. Paths, ids, metadata, git detection, access rules. Used by both apps.
- `apps/cli` — `hsp`. Run straight from TypeScript by Bun, no build step.
- `apps/web` — the Next.js viewer.

Both store backends run the same contract suite, so the filesystem and hosted
implementations can't quietly drift.

## License

MIT
