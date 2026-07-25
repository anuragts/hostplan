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
`hsp` is global — the store lives at `~/.hostplan` and every command works from
any directory, so you run it the same way in every project.

### Teaching your agents about it

`skills/hostplan` is a skill that tells a coding agent when to reach for `hsp`.
Symlink it into whichever agents you use:

```bash
ln -sfn "$PWD/skills/hostplan" ~/.claude/skills/hostplan
ln -sfn "$PWD/skills/hostplan" ~/.codex/skills/hostplan
ln -sfn "$PWD/skills/hostplan" ~/.cursor/skills-cursor/hostplan
```

Symlinks rather than copies, so a `git pull` updates all three at once.

## Using it

```bash
hsp add PLAN.md              # store a plan, print its URL
hsp add -c "..." -t "Title"  # store one without a file
hsp get <id>                 # print a plan to stdout
hsp get latest               # the most recent plan here
hsp list                     # plans for this repo and branch
hsp open <id>                # open it in a browser
hsp rm <id>                  # delete it
hsp share <id>               # print its shareable links
hsp publish|unpublish <id>   # change who can read it
hsp rotate <id>              # issue a new share code
hsp serve status|stop        # manage the viewer
```

Project and branch come from git automatically. `--project` / `--branch`
override them, `--all` ignores them, and `--json` on any of these gives an agent
something parseable.

### Public and private plans

Every plan is **private** unless you say otherwise — publishing should be
deliberate. A private plan gets a 4-letter code, and `hsp add` prints both forms
of its link:

```
$ hsp add PLAN.md --private
✓ stored  Worktree GC  ·  nest / main  ·  a3f9c2  ·  private
→ http://localhost:7433/p/a3f9c2            asks for the code
→ http://localhost:7433/p/a3f9c2?code=KRWT  opens directly
```

Send the bare link plus the code separately, or send the coded link and skip a
step. Entering the code on the page redirects to `?code=…`, so the address bar
becomes the link you can pass on. `hsp add --public` gives one bare URL that
opens for anyone.

Codes are casual privacy, not cryptography: 4 letters is ~234,000 combinations,
throttled but guessable given time. Don't host anything genuinely sensitive.

None of this applies locally — there's no login and no code prompt until the
viewer is deployed. See [docs/deploying.md](docs/deploying.md).

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
