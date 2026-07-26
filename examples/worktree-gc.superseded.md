# Worktree GC (age-based, superseded)

The first pass at worktree cleanup: delete any worktree whose directory hasn't
been touched in 30 days.

**Superseded by the merged/branch-gone approach.** Age is a proxy for "nobody
wants this", and it's a bad one — the branch someone parked deliberately in
January looks identical to the branch an agent abandoned in January. The signals
that actually mean "safe to delete" are *merged* and *branch gone from the
remote*, and once you have those, age adds nothing but risk.

Kept as an example of a plan that ends in `superseded` rather than `done`: the
work was never carried out, and the plan that replaced it is the one to read.

## What it would have done

- [ ] `stat` each worktree directory for its mtime
- [ ] Delete anything older than the configured window
- [ ] `--dry-run` to preview

## Why that's wrong

mtime is not a signal about intent. A worktree whose branch is merged is garbage
on day one; a worktree holding unmerged work is precious on day 400.
