# Examples

Real plans you can store and drive with `hsp`, covering the workflow features:
status, stacks, tasks, revisions and search.

Everything below runs against a throwaway store, so it can't touch your real
plans:

```bash
export HOSTPLAN_HOME=/tmp/hsp-examples
cd examples
```

Add `--local` if you're signed in to a deployment and don't want the examples
pushed to it.

## Status: the approval gate

```bash
$ hsp add worktree-gc.md
✓ stored  Worktree GC  ·  hostplan / main  ·  qf5tvr  ·  private

$ hsp status qf5tvr
Worktree GC  ·  qf5tvr  ·  draft

$ hsp status qf5tvr approved
✓ approved  Worktree GC  ·  qf5tvr
```

New plans are drafts. The point of the gate is that an agent checks
`hsp status` before implementing and stops if the plan hasn't been approved —
so approving is a deliberate act by a human, not the default.

## Tasks: durable checkboxes

`worktree-gc.md` has a `## Steps` checklist. Those checkboxes are addressable
state, not just prose:

```bash
$ hsp tasks qf5tvr
Worktree GC  ·  qf5tvr  ·  0/5 done
   1 [ ] `worktree list --porcelain` parser, with a test for detached HEAD
   2 [ ] Classify each worktree: merged, branch-gone, dirty, or active
   3 [ ] `gc --dry-run` (the default) prints the classification table
   4 [ ] `gc --force` actually prunes, skipping anything dirty
   5 [ ] Refuse to touch the worktree the command is running from

$ hsp check qf5tvr 1 2
✓ checked 1, 2  ·  2/5 done
```

Checking rewrites the `- [ ]` line in the stored plan, so the rendered page and
the task state can't disagree. A session that stops at step 3 hands off *state*
to the next one, not just a document.

## Stacks: split work that won't fit in one session

`usage-metering/` is one feature as three ordered plans. Store them as a chain:

```bash
$ hsp stack usage-metering/01-schema.md usage-metering/02-collector.md usage-metering/03-dashboard.md
✓ stored a stack of 3
  1 → cdoq9y Usage metering: the events table · draft
  2 ⛔ wtulu7 Usage metering: the collector · draft waits on cdoq9y
  3 ⛔ l5gntn Usage metering: the dashboard · draft waits on wtulu7
```

Steps 2 and 3 are **blocked** — each waits on the one before it. Finishing a
step is what unblocks the next, and the command says so:

```bash
$ hsp status cdoq9y done
✓ done  Usage metering: the events table  ·  cdoq9y
→ unblocks wtulu7  Usage metering: the collector  ·  draft
```

Ask a stack what's next, or look at the whole chain from any member:

```bash
$ hsp next
$ hsp stack wtulu7
Stack of 3
  1 ✔ cdoq9y Usage metering: the events table · done
  2 → wtulu7 Usage metering: the collector · draft
  3 ⛔ l5gntn Usage metering: the dashboard · draft waits on wtulu7

$ hsp status l5gntn
Usage metering: the dashboard  ·  l5gntn  ·  draft
⛔ blocked by wtulu7  Usage metering: the collector  ·  draft
```

`hsp stack` with no arguments lists every stack in scope. To append to an
existing chain rather than starting a new one:

```bash
hsp add usage-metering/04-alerts.md --after l5gntn
```

## Revisions: same link, new body

`worktree-gc.revised.md` is the same plan after review — `--force` no longer
overrides the dirty check. Revise in place instead of filing a second plan:

```bash
$ hsp update qf5tvr worktree-gc.revised.md
✓ revised  Worktree GC  ·  qf5tvr  · same link, new body
  previous revision kept at ~/.hostplan/revisions/qf5tvr/2026-07-26T13-03-57-114Z.md
```

Same id, same URL, same share code — so whoever you already sent the link to
sees the new version. The outgoing revision is archived first, so an update can
always be walked back.

One thing to know: the body is replaced wholesale, so **checked tasks reset to
whatever the incoming file says**. Above, `qf5tvr` was at 2/5 before the update
and is 0/6 after, because the revised file's checkboxes are all unticked. If you
want progress to survive a revision, tick the boxes in the file you're updating
with.

## Search: find the decision you already made

```bash
$ hsp search collector buffer
wtulu7  Usage metering: the collector  hostplan / main  draft  0s
```

Global by default, across every project — that's the point. The question worth
asking before designing anything is "did a past session already decide this?",
and scoping to the current branch is exactly what would hide the answer. Narrow
with `-p` / `-b` when you do want a single project.

## Listings

`hsp list` shows status, with `blocked` in place of it when a plan is waiting:

```bash
$ hsp list
qf5tvr  Worktree GC                       hostplan / main  approved  private ARKV  0s
l5gntn  Usage metering: the dashboard     hostplan / main  blocked   private MMZA  0s
wtulu7  Usage metering: the collector     hostplan / main  blocked   private ZJGR  0s
cdoq9y  Usage metering: the events table  hostplan / main  draft     private NRZA  0s
```

Once plans are `done` or `superseded` they're *settled*: the hosted dashboard
folds them into their own collapsed section, so what's left on screen is what's
in flight.

## Seeing settled plans and stacks in the dashboard

Both UIs only appear when there's something to show — an account of nothing but
drafts renders neither. To populate them:

```bash
# a stack, with the first step finished so the second is unblocked
hsp stack usage-metering/0*.md -p examples -b feat/usage-metering
hsp status <step-1-id> done
hsp status <step-2-id> in-progress

# two settled plans: one that shipped, one that was replaced
hsp add worktree-gc.revised.md    -p examples -b feat/worktree-gc --status done
hsp add worktree-gc.superseded.md -p examples -b feat/worktree-gc --status superseded
```

What to look for on the plan pages and dashboard:

| plan | shows |
| --- | --- |
| step 1 (`done`) | green `done` badge, folded under **Settled** |
| step 2 (`in-progress`) | `in-progress` badge, `follows <id>` — its dependency is done, so not blocked |
| steps 3–4 | amber **blocked · waits on `<id>`**, linked to the step above |
| `worktree-gc.superseded.md` | `superseded` — work never carried out, unlike `done` |

`superseded` versus `done` is the distinction worth being deliberate about: a
superseded plan was *replaced*, not completed, which is why it never unblocks a
plan that depends on it. Only `done` does.

## The loop, in short

```bash
hsp next                    # what should I work on?
hsp status <id>             # is it approved? is it blocked?
hsp status <id> in-progress
hsp check <id> 1 2          # tick steps off as you go
hsp status <id> done        # unblocks whatever waited on it
```

Full reference: [../docs/cli.md](../docs/cli.md). What agents are told about
this: [../skills/hostplan/SKILL.md](../skills/hostplan/SKILL.md).
