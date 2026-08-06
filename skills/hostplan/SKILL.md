---
name: hostplan
description: >-
  Store implementation plans in hostplan (`hsp`) instead of leaving them in a
  scratch file, and read back plans another agent wrote. Use this whenever you
  finish writing a plan, design doc, or proposal the user will read or another
  agent will pick up; whenever you are asked to "save this plan", "share this
  plan", "give me a link to the plan"; and whenever the user refers to a plan
  you did not write — "the plan from earlier", "what did the other agent plan",
  a plan id, or a hostplan URL (http://localhost:7433/p/<id> or
  https://plans.host-plan.com/p/<id>). Also use it before starting
  implementation work on a branch, to check whether a plan already exists and
  whether it is approved; when splitting a large piece of work into ordered
  steps (plan stacks); when marking progress on a plan (status, checkboxes);
  and when asked what to work on next.
---

# hostplan

`hsp` is a global CLI backed by a store at `~/.hostplan`. It works from any
directory. Plans are bucketed by **project → branch**, both read from git
automatically — so `hsp list` in a repo shows the plans for that repo and
branch with no arguments.

## Storing a plan

After you write a plan to a file:

```bash
hsp add PLAN.md
```

Without a file, pass the body directly:

```bash
hsp add -c "$(cat <<'EOF'
# Worktree GC
...
EOF
)" -t "Worktree GC"
```

It prints the id, the URL, and the store path:

```
✓ stored  Worktree GC  ·  nest / feat/delivery  ·  a3f9c2  ·  private
→ http://localhost:7433/p/a3f9c2            asks for the code
→ http://localhost:7433/p/a3f9c2?code=KRWT  opens directly
```

Give the user that URL — the page renders the plan and has an **Open in**
button that hands it to Codex, Claude Code, or Cursor. Use `-q` if you only
want the URL, `--json` if you need to parse the result.

The same URL is both human- and machine-readable. Opening it in a browser shows
the rendered viewer; curling it returns only the original plan source:

```bash
curl -fsSL 'https://plans.host-plan.com/p/a3f9c2?code=KRWT'
```

No `/api/raw/` URL conversion or HTML cleanup is needed. Non-curl clients can
request `Accept: text/markdown` explicitly.

The viewer starts itself on first use; the very first `hsp add` on a machine
may take ~30s while it builds. Pass `--no-serve` to skip that if you only need
the plan on disk.

## Private and public

Plans are **private by default** and get a 4-letter share code. `hsp add`
prints both link forms: the bare one asks for the code, the `?code=` one opens
directly. Pass on whichever suits — for a link the user will forward, the coded
one saves them a step.

Add `--public` only when the user asks for something anyone can open, or when
the plan is obviously meant to travel. Publishing is deliberate; don't do it
because it seems more convenient.

```bash
hsp add PLAN.md --public     # one bare URL, no code
hsp share <id>               # reprint both link forms
hsp publish|unpublish <id>   # change it later
hsp rotate <id>              # new code, old link stops working
```

Codes are casual privacy, not cryptography. If a plan contains anything
genuinely sensitive, say so rather than hosting it.

## Status: don't implement a draft

Plans have a lifecycle: `draft` → `approved` → `in-progress` → `done`
(`superseded` for plans replaced by newer ones). New plans start as drafts.

- Before implementing a plan, run `hsp status <id>` — if it is still `draft`,
  ask the user to approve it (or to say go ahead) rather than starting.
- When you begin implementing: `hsp status <id> in-progress`.
- When the work ships: `hsp status <id> done`. This unblocks any plan that
  depends on it, and the command prints which.

## Stacks: split big work into chained plans

When a plan is too big for one session, write one file per step and store
them as a stack — each step stays blocked until the one before it is done:

```bash
hsp stack step1.md step2.md step3.md
hsp add MORE.md --after <id>     # append to a chain
hsp next                         # the step to work on now
hsp stack <id>                   # show the whole chain
```

`hsp next` is the question to ask at the start of a session: it returns the
first plan in scope that is neither done nor waiting on an unfinished
dependency.

## Document themes

Themes are plan metadata, so the author's chosen presentation follows the
same link through revisions, publishing, and sync:

```bash
hsp theme --list
hsp add PLAN.md --theme working-draft
hsp theme <id> editorial
```

Use a curated theme when the user asks for a memo, draft, editorial report,
technical brief, or executive presentation. Do not encode themes in share
URLs. A browser reader's personal override stays local to that reader.

## Custom HTML plans

Markdown is the default. Use a custom HTML plan only when the user asks for a
custom visual artifact or when a dashboard, timeline, architecture map,
comparison, or similarly authored layout materially improves comprehension.

Fetch the current contract instead of improvising it:

```bash
hsp guide custom-html
```

Follow its response rules exactly. Compose Hostplan's `hp-*` cards, lists,
stats, grids, badges, callouts, steps, tables, and tokens where useful, and add
custom semantic classes/CSS for the plan's specific visual form. Scripts,
network assets, embeds, submitting forms, and external styles are forbidden.

Write the response as raw HTML to a `.html` file, validate it, then store it:

```bash
hsp validate PLAN.html
hsp add PLAN.html
```

Return the resulting Hostplan link to the user, not the raw HTML. HTML plans do
not support `hsp tasks` or `hsp check`; use their lifecycle status instead.

## Revising and tracking progress

- `hsp update <id> PLAN.md` (or `-c "..."`) revises a plan **in place** —
  same id, same URL. Use it when review feedback changes the plan; never
  create a second plan for a revision.
- `hsp tasks <id>` lists the plan's checkboxes as numbered tasks;
  `hsp check <id> 2 3` ticks them off in the stored plan. Check tasks off as
  you complete them so the next session (or another agent) can see exactly
  where work stopped.

## Searching past decisions

`hsp search <terms>` is full-text across every project in the store. Before
designing something substantial, search for prior art — an earlier session
may have already decided the approach:

```bash
hsp search rate limiting
hsp search migrations -p nest
```

## Reading a plan back

```bash
hsp get <id>          # print the body to stdout
hsp get latest        # the most recent plan for this repo and branch
hsp get <id> --json   # body plus metadata
```

`<id>` also accepts a full `http://localhost:7433/p/<id>` URL, so you can paste
what the user gave you verbatim.

## Finding plans

```bash
hsp list              # this repo, this branch
hsp list -a           # everything in the store
hsp list -p nest      # one project, all branches
hsp list --json
```

Before starting substantial work on a branch, `hsp list` is worth a look — a
prior session may have already planned it.

## Other commands

```bash
hsp open <id>         # open in a browser
hsp url <id>          # just the URL
hsp rm <id>           # delete
hsp serve status|stop # manage the local viewer
hsp whoami            # which deployment plans are pushed to, if any
```

## Local versus hosted

By default everything is local: one folder, a localhost site, nothing uploaded.

If the user has run `hsp login`, `hsp add` also pushes to their deployment and
prints that URL instead — the same plan, one id, readable from anywhere. You do
not need to do anything differently; `hsp whoami` says whether a deployment is
configured. If a push fails, `hsp add` warns but still stores the plan locally,
so nothing is lost.

## Notes

- `--project` / `--branch` override the git-derived buckets; `--all` ignores
  them. Outside a git repo the bucket is the directory name.
- Every command takes `--json` — prefer it when you need to act on the output.
- `HOSTPLAN_HOME` moves the store, `HOSTPLAN_PORT` changes the port (7433).
- Nothing is uploaded unless `hsp login` has been run. Check `hsp whoami`
  before assuming a plan will leave the machine.
- If `hsp` is not on PATH, hostplan is not installed on this machine — say so
  rather than trying to install it.
