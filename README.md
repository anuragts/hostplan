<img src="icon.svg" width="64" alt="">

# hostplan

A central place for coding agents to put plans, and a local site to read them.

Agents write plans constantly and they land wherever — `~/.claude/plans`, a
repo's `PLAN.md`, a scratch file that gets deleted. hostplan gives every plan one
home and one URL.

An agent runs `hsp add PLAN.md`. The plan goes into a global store bucketed by
**project → branch**, and the command prints back a link:

```
$ hsp add PLAN.md
✓ stored  Worktree GC  ·  nest / feat/delivery  ·  a3f9c2
→ http://localhost:7433/p/a3f9c2
  ~/.hostplan/plans/nest/feat-delivery/a3f9c2--worktree-gc.md
```

Another agent runs `hsp get a3f9c2` to read it back. You open the URL and get a
rendered page — with an **Open in** button that hands the plan straight to Codex,
Claude Code, or Cursor.

Everything is local. One machine, one folder, a localhost site.

## Install

Requires [Bun](https://bun.sh) and Node 20+.

```bash
git clone https://github.com/anuragts/hostplan.git
cd hostplan
bun install
bun run build     # builds the viewer, once
bun link          # puts `hsp` on your PATH
```

That's it. `hsp add` starts the viewer on its own the first time you need it.

## Using it

```bash
hsp add PLAN.md              # store a plan, print its URL
hsp add -c "..." -t "Title"  # store one without a file
hsp get <id>                 # print a plan to stdout
hsp get latest               # the most recent plan here
hsp list                     # plans for this repo and branch
hsp open <id>                # open it in a browser
hsp rm <id>                  # delete it
hsp serve status|stop        # manage the viewer
```

Project and branch come from git automatically. `--project` / `--branch`
override them, `--all` ignores them, and `--json` on any of these gives an agent
something parseable.

### Open in

Every plan page has an **Open in** button that deep-links the plan into an app:

| App | What happens |
| --- | --- |
| Codex | New thread in the project, prompt pre-filled |
| Claude Code | New desktop session in the project, prompt pre-filled |
| Cursor | Opens the plan file |

Neither Codex nor Claude Code sends the prompt for you — you read it and press
Enter.

### Where things live

```
~/.hostplan/
  config.json                       # { "port": 7433 }
  plans/<project>/<branch>/<id>--<slug>.md
```

There's no index file. The directory tree is the index and each plan carries its
own metadata in frontmatter, so nothing can fall out of sync and parallel
`hsp add` calls can't corrupt anything.

Set `HOSTPLAN_HOME` to move the store, `HOSTPLAN_PORT` to change the port.

## Developing

```bash
bun test          # core unit tests
bun run typecheck
bun run lint      # biome
bun run dev       # viewer with hot reload on :7433
```

Three workspaces:

- `packages/core` — the store. Paths, ids, metadata, git detection. Used by both apps.
- `apps/cli` — `hsp`. Run straight from TypeScript by Bun, no build step.
- `apps/web` — the Next.js viewer, reading the store from disk on every request.

## License

MIT
