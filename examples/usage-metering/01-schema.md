# Usage metering: the events table

Step 1 of 3. Nothing else can be built until the shape of an event is settled,
which is why this is its own plan rather than a section of a bigger one.

## The table

```sql
create table usage_events (
  id          bigserial primary key,
  account_id  uuid not null references accounts(id) on delete cascade,
  kind        text not null,          -- 'request', 'storage_hour', 'export'
  quantity    numeric not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now()
);
```

`occurred_at` and `recorded_at` are separate on purpose. A collector that was
down for an hour backfills events whose `occurred_at` is in the past; billing
reads `occurred_at`, monitoring reads `recorded_at`, and collapsing them into
one column would make a late batch look like a usage spike.

`quantity` is numeric rather than integer because storage-hours are fractional.

## Steps

- [ ] Migration creating the table
- [ ] Index on `(account_id, occurred_at desc)` — every read is per account, by time
- [ ] Index on `(kind, occurred_at)` for the aggregate rollups step 3 needs
- [ ] Backfill script for the six months already in the request logs
- [ ] Decide the retention window and write it down here

## Done when

The table exists in staging with the backfill applied, and a hand-written query
can answer "requests for account X last month" in under 100ms.
