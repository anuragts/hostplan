# Worktree GC

Stale git worktrees accumulate under `.worktrees/` — one per agent session, never
cleaned up. On a long-running machine that's tens of gigabytes and a `git
worktree list` nobody can read.

## Approach

A `gc` subcommand that removes worktrees whose branch is merged or gone from the
remote, and reports what it would remove before removing anything. Dry-run by
default: deleting someone's in-progress work because a heuristic misfired is
much worse than leaving disk unreclaimed for another week.

## Steps

- [ ] `worktree list --porcelain` parser, with a test for detached HEAD
- [ ] Classify each worktree: merged, branch-gone, dirty, or active
- [ ] `gc --dry-run` (the default) prints the classification table
- [ ] `gc --force` actually prunes, skipping anything dirty
- [ ] Refuse to touch the worktree the command is running from

## Not doing

Age-based expiry. "Older than 30 days" would delete the branch someone parked
deliberately, and the merged/gone signals already cover the real garbage.
