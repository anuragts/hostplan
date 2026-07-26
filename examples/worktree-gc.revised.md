# Worktree GC

Stale git worktrees accumulate under `.worktrees/` — one per agent session, never
cleaned up. On a long-running machine that's tens of gigabytes and a `git
worktree list` nobody can read.

## Approach

A `gc` subcommand that removes worktrees whose branch is merged or gone from the
remote, and reports what it would remove before removing anything. Dry-run by
default: deleting someone's in-progress work because a heuristic misfired is
much worse than leaving disk unreclaimed for another week.

**Revised after review:** dirty worktrees are now *never* pruned, not even with
`--force`. The original plan let `--force` override that, which makes the flag a
foot-gun — the whole point of the dirty check is that uncommitted work is
unrecoverable. A separate `--include-dirty` can exist later if anyone actually
wants it.

## Steps

- [ ] `worktree list --porcelain` parser, with a test for detached HEAD
- [ ] Classify each worktree: merged, branch-gone, dirty, or active
- [ ] `gc --dry-run` (the default) prints the classification table
- [ ] `gc --force` prunes merged and branch-gone worktrees only
- [ ] Refuse to touch the worktree the command is running from
- [ ] Dirty worktrees are reported and always skipped

## Not doing

Age-based expiry. "Older than 30 days" would delete the branch someone parked
deliberately, and the merged/gone signals already cover the real garbage.
