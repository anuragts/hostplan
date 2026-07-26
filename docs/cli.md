# CLI reference

Every command takes `--json`. Prefer it when an agent needs to act on the
output.

For plans you can actually run these against, see
**[examples/](../examples/)** — a walkthrough of status, stacks, tasks,
revisions and search with real output.

## Storing

```bash
hsp add PLAN.md                    # from a file
hsp add -c "# Title\n..." -t "Title"   # without one
hsp add PLAN.md --public           # anyone with the link can read it
hsp add PLAN.md --local            # store locally, don't push to a deployment
hsp add PLAN.md -q                 # print only the URL, for $(...)
hsp add PLAN.md --no-serve         # skip starting the local viewer
```

Project and branch come from git: the repo directory name and the checked-out
branch. Outside a repo it falls back to the working directory's name and
`no-branch`. `--project` / `--branch` override both.

Branch names with slashes are slugified for the directory (`feat/delivery` →
`feat-delivery`) while the real name is kept in the plan's frontmatter and shown
in the UI.

## Reading

```bash
hsp get <id>            # body to stdout
hsp get latest          # newest plan in the current scope
hsp get <id> --meta     # metadata table
hsp get <id> --json     # body plus metadata
```

`<id>` also accepts a full plan URL, so a link can be pasted verbatim.

## Finding

```bash
hsp list                # this repo, this branch
hsp list -a             # everything
hsp list -p nest        # one project, all branches
hsp list -n 10          # cap the output
```

## The plan lifecycle

Every plan has a status: `draft` → `approved` → `in-progress` → `done`, or
`superseded` when a newer plan replaces it. New plans are drafts.

```bash
hsp status <id>              # where the plan is, and whether it's blocked
hsp status <id> approved     # move it
hsp status <id> done         # finishing a step unblocks its dependents
hsp add PLAN.md --status approved
```

Done and superseded plans are *settled* — listings and the dashboard push
them out of the way.

## Stacks

Big work splits into a chain of plans, each waiting on the one before:

```bash
hsp stack step1.md step2.md step3.md   # store as a chain, in order
hsp add PLAN.md --after <id>           # chain one plan after another
hsp stack <id>                         # show the chain a plan belongs to
hsp stack                              # the stacks in this scope
hsp next                               # first plan that's not done and not blocked
```

A plan is **blocked** while the plan it depends on isn't `done`. `hsp status
<id> done` prints what it unblocks; `hsp next` is what an implementing agent
should ask before starting work.

## Revising

```bash
hsp update <id> PLAN.md      # new body, same id, same link, same code
hsp update <id> -c "..."     # inline
```

The previous revision is kept under `~/.hostplan/revisions/<id>/`, so an
update can always be walked back.

## Tasks

A plan's markdown checkboxes are addressable state:

```bash
hsp tasks <id>               # numbered checklist with progress
hsp check <id> 2 3           # tick steps off in the stored plan
hsp check <id> 2 --undo
```

Checking a task rewrites the `- [ ]` line in the body, so the rendered plan
and the task state can never disagree.

## Searching

```bash
hsp search rate limiting     # full-text, across every project
hsp search auth -p nest      # scoped
```

Search is global on purpose — its job is finding the decision a session made
months ago in another repo. The dashboard has the same search across your
hosted plans.

## Sharing

```bash
hsp share <id>          # reprint both link forms
hsp publish <id>        # drop the code, one bare URL
hsp unpublish <id>      # private again, with a fresh code
hsp rotate <id>         # new code; the old link stops working
```

Re-privatising issues a *different* code deliberately — the previous link was
public, so it shouldn't quietly keep working.

## Deployments

```bash
hsp login               # device flow: approve in a browser
hsp login --token hsp_… # unattended, for agents and CI
hsp whoami              # which deployment, if any
hsp logout
```

Once logged in, `hsp add` writes locally *and* pushes, printing the deployment
URL. A failed push warns but doesn't fail the add — the plan is already on disk,
so a network blip can't lose work.

The push carries the plan's id and code, so both sides hold one plan rather than
two copies under different identities.

## Open in

Every plan page has an **Open in** button that deep-links into an app:

| App | Link | What happens |
| --- | --- | --- |
| Codex | `codex://threads/new?prompt=…&path=…` | New thread in the project, prompt pre-filled |
| Claude Code | `claude://code/new?q=…&folder=…` | New desktop session in the project |
| Cursor | `cursor://file/…` | Opens the plan file |

Neither Codex nor Claude Code sends the prompt for you — you read it and press
Enter. For a plan you're reading but don't own, the prompts point at the plan's
URL instead of a local path, since that path wouldn't exist on your machine.

## Where things live

```
~/.hostplan/
  config.json                       # port, and the deployment you're signed in to
  plans/<project>/<branch>/<id>--<slug>.md
```

Locally there's no index file: the directory tree is the index and each plan
carries its own metadata in frontmatter, so nothing can fall out of sync and
parallel `hsp add` calls can't corrupt anything. A hosted deployment does use an
index, because resolving a plan id across many accounts can't mean scanning
every account's storage.

`config.json` holds your deployment token once `hsp login` has run, so it's
written `0600`.

## Environment

| Variable | Effect |
| --- | --- |
| `HOSTPLAN_HOME` | Move the local store |
| `HOSTPLAN_PORT` | Change the local viewer port (7433) |
| `HOSTPLAN_REMOTE` | Deployment URL, overriding the config |
| `HOSTPLAN_TOKEN` | Deployment token, overriding the config — for CI |

## Teaching your agents about it

`skills/hostplan` tells a coding agent when to reach for `hsp`. Symlink it into
whichever agents you use:

```bash
ln -sfn "$PWD/skills/hostplan" ~/.claude/skills/hostplan
ln -sfn "$PWD/skills/hostplan" ~/.codex/skills/hostplan
ln -sfn "$PWD/skills/hostplan" ~/.cursor/skills-cursor/hostplan
```

Symlinks rather than copies, so a `git pull` updates all three at once.
