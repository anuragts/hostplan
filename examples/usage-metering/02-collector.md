# Usage metering: the collector

Step 2 of 3. Depends on step 1: there is no point writing an emitter before the
column names are fixed, and this plan stays blocked until that table is real.

## Approach

Emit events from the request path into an in-process buffer, flush every 5
seconds or 500 events, whichever comes first. Writing one row per request
synchronously would put billing on the critical path of every API call — a
metering outage would become an availability outage.

Buffered means events can be lost on a hard crash. That's the right trade here:
the request logs are the durable record and the backfill script from step 1 can
replay them, so the worst case is a delayed bill, not a wrong one.

## Steps

- [ ] `meter.record(kind, quantity)` — non-blocking, drops on a full buffer
- [ ] Flush loop with jitter, so instances don't all write on the same tick
- [ ] Batch insert, one statement per flush
- [ ] Counter for dropped events, alerting if it's ever non-zero
- [ ] Graceful shutdown flushes the buffer before exit
- [ ] Load test: 10k req/s sustained with no drops

## Not doing

A queue (Kafka, SQS) between the app and Postgres. At this volume the buffer is
enough, and a queue is another thing to run, monitor, and page someone about.
Revisit if drops become non-zero under normal load.
