# Usage metering: the dashboard

Step 3 of 3. Depends on step 2 — a usage chart with no collector behind it is a
chart of zeroes, and shipping that teaches users the feature is broken.

## Approach

One page per account: current period totals, a daily chart, and the projected
end-of-period figure. Read from pre-aggregated daily rollups rather than the raw
events table, because a customer with 50M events should not be able to make the
page slow for everyone else.

Projection is a straight linear extrapolation from days elapsed. It will be
wrong for spiky workloads, so it's labelled "projected" and not used for
anything that charges money.

## Steps

- [ ] `usage_daily` rollup table plus the job that fills it
- [ ] Backfill rollups from the events table
- [ ] API: totals, daily series, projection
- [ ] Page: total tiles, daily bar chart, period selector
- [ ] Empty state for accounts with no usage yet
- [ ] Cache the response for 5 minutes — nobody needs per-second billing data

## Done when

An account with real usage can see it, the page loads in under 500ms at the
99th percentile, and the numbers reconcile with a raw query against
`usage_events` to the cent.
