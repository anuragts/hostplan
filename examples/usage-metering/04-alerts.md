# Usage metering: overage alerts

Appended to the stack after the fact — this wasn't in the original three steps.
It exists to show `hsp add --after`, which hooks a new plan onto the end of an
existing chain:

```bash
hsp add usage-metering/04-alerts.md --after <dashboard-plan-id>
```

Depends on the dashboard step, because the rollups it reads are built there.

## Approach

Email an account when it crosses 80% and 100% of its plan's included usage,
evaluated once per day off the daily rollups rather than on every event. Alerting
from the request path would mean a metering bug could spam a customer hundreds of
times in a minute.

Alerts are recorded per account, per threshold, per period, so crossing 80%,
dropping under it, and crossing it again in the same month sends one email, not
two. Deduplication is the whole feature — everything else is a query and a
template.

## Steps

- [ ] `usage_alerts` table: account, period, threshold, sent_at
- [ ] Daily job evaluating thresholds from `usage_daily`
- [ ] Email templates for 80% and 100%
- [ ] Idempotency: re-running the job the same day sends nothing new
- [ ] Per-account opt-out honoured

## Not doing

Configurable thresholds. Two fixed ones cover the need; a UI for picking
arbitrary percentages is a settings page nobody asked for yet.
