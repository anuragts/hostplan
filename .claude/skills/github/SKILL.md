---
name: github
description: >-
  Git and GitHub conventions for the hostplan repo — how to commit, branch,
  open a PR, and deploy. Use whenever you are about to run git commit, git
  push, git merge, or any gh command in this repository; whenever a commit
  fails with unexpected `mint` output; and before merging anything to main,
  since main deploys straight to production.
---

# Git and GitHub in hostplan

## Hooks are broken on this machine — bypass them

A global `core.hooksPath` at `~/.git-hooks` runs `mint run
csjones/lefthook-plugin`, expecting Swift's Mint. Homebrew's Mintlify `mint` is
what's on PATH, so **every** hook fails, in every repo, with a wall of Mintlify
help text.

`--no-verify` is not enough: it skips `pre-commit` but not `prepare-commit-msg`.
Bypass all hooks per command:

```bash
git -c core.hooksPath=/dev/null commit -m "..."
git -c core.hooksPath=/dev/null merge --no-ff feat/x
```

Do not "fix" this by changing the user's global config.

## Commits

Granular and grouped by concern, not one commit per session. A reader should be
able to follow the build: scaffold → core → tests → CLI → web → docs.

Conventional prefixes with a scope: `feat(web):`, `fix(cli):`, `refactor(core):`,
`docs:`, `chore:`, `test(core):`.

The body carries the **why**, especially for anything non-obvious. Past commits
record decisions like "no index file", "%20 over +", "accounts need an explicit
opt-in" — that reasoning is the reason to write a body at all. When a commit
fixes something that broke production, say what broke and why the fix is right,
not just what changed.

Do not add `Co-Authored-By` trailers. They were stripped from this history once
already.

## Branches and PRs

Anything beyond a small fix goes on a branch:

```bash
git -c core.hooksPath=/dev/null checkout -b feat/thing
gh pr create --base main --head feat/thing --title "..." --body "..."
gh pr merge <n> --rebase --delete-branch
```

Rebase merges, to keep the granular history readable.

The PR body should include what was verified and what wasn't, and call out bugs
found along the way. A PR that says "adds feature X" and omits "this also
exposed a leak in Y" is a worse PR.

## main deploys to production

Vercel builds `main` and deploys to plans.host-plan.com. Pushing to main is a
production release, so before doing it:

```bash
bun test && bun run typecheck && bun run lint && bun run build
```

Green locally is necessary, not sufficient. **Verify production after the
deploy lands**, and don't assume the build shipped just because the push
succeeded — it takes a minute or two, and it has silently lagged before:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://plans.host-plan.com/
curl -s https://plans.host-plan.com/api/health
```

If a push breaks production, restoring service comes first. Prefer a forward
fix only when the cause is already confirmed; otherwise revert.

## Things that have actually gone wrong here

- **Env-driven features shipping early.** A feature keyed off "is this env var
  present" turned itself on in an environment that had the var for another
  reason, before its database tables existed, and every request 500'd. Gate
  behaviour changes on an explicit flag.
- **Rewriting history then pushing.** `git revert` on a merge, followed by
  `--amend`, dropped the merge and left local diverged from origin. Check
  `git log --oneline origin/main` before assuming what the remote holds.
- **Secrets in files git would track.** `.env*.local` was ignored but plain
  `.env` was not. Both are ignored now; check `git check-ignore` before writing
  a key anywhere.

## Never commit

Keys, tokens, `.env`, `.env.local`. If a credential appears in a transcript or a
diff, say so plainly and tell the user to rotate it.
