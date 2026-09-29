# Pitfalls

The candidate generator for `pr-review`. Every row names something that produces wrong
runtime behavior — that is the entry test for the table, and it is why "long method" and
"inconsistent naming" are absent. Matching a row makes a candidate; the tier bar in the
skill decides whether it becomes a comment.

## Language-agnostic

| Pitfall | What makes it a finding |
| --- | --- |
| Nullable widened on a contract | A return or parameter that could not be null now can, and a caller dereferences it without a guard. The callers `ripwire` named are where to look. |
| Enum case added | A new case, and a `match`/`switch`/branch elsewhere still enumerates the old set. A `default` that swallows it silently is the same finding. |
| Serialized shape changed under live data | A cache key, session payload, job argument, or stored JSON whose structure changed while rows written in the old shape are still readable. |
| New external call with no failure path | An HTTP call, queue push, or third-party SDK call reached with no handling for the failure it can return — and the caller treats it as having succeeded. |
| Query inside a loop | A query, HTTP call, or file read executed once per iteration where the collection is not bounded by something small and known. |
| Query that lost its scoping | A `where` on tenant, owner, status, or soft-delete removed, widened, or moved behind a condition — the query now returns rows it did not before. |
| New query with no supporting index | A `where`, `order by`, or join on a column with no index, on a table the change will hit at scale. |
| Guard removed | A null check, permission check, validation, or early return deleted, with nothing upstream taking it over. Anchors on the removed line, `side: LEFT`. |
| Test that lies | An assertion that cannot fail, or a setup that contradicts the path the test names — the change it claims to cover is unprotected. |

## Laravel

Skip this section on a diff with no PHP in it.

| Pitfall | What makes it a finding |
| --- | --- |
| N+1 on a lazy relation | A relation accessed inside a loop over a collection that was not eager-loaded — `$order->customer->name` inside a `foreach` over orders. |
| `firstOrFail` on a path that tolerated absence | A `find`/`first` returning null replaced with `firstOrFail`/`findOrFail`, in a path whose caller handled the null. The 404 or exception is now the caller's problem. |
| Newly fillable field | A column added to `$fillable`, or `$guarded` narrowed, where a request payload reaches the model through `create`/`update`/`fill`. |
| `down()` that does not invert `up()` | A migration whose rollback leaves a different schema than it started with, or drops data the forward migration did not create. |
| Job payload shape changed | A queued job's constructor signature or serialized properties changed while jobs in the old shape are still on the queue. |
| Observer or event bypassed | A write moved to `DB::table`, `update` on a query builder, or `saveQuietly`, skipping model events something else depends on. |
