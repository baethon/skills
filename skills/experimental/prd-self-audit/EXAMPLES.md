# Examples

Curated subset of a real audit run. Use as a quality bar for depth and specificity — do not copy the domain (this example is about an offline-sync feature; the shape generalises, the content does not).

## Contradiction — three-sided

Contradictions are not always two-sided. Cite every side, including ones that strengthen the apparent winner.

- **§Solution (L13) vs §Out of Scope (L169) vs §Further Notes (L180)** — legacy tag controllers
  - Side A (L13): "The existing per-resource controllers (`Api/Entries/*`, `Api/Tags/*`) are removed; the only write path is `/api/sync`."
  - Side B (L169): "The existing endpoints stay in place but are not made sync-aware; their interaction with offline mode is revisited in a follow-up."
  - Side C (L180): "removing the per-resource controllers (`Api/Entries/*`, `Api/Tags/*`) … is part of this work."

Two of three sides agree, but the disagreeing one is in the Out of Scope section — i.e. an explicit carve-out. Do not silently resolve in favour of the majority; the carve-out has its own consequences (autocomplete rot) that the other sides are silent on.

## Missing invariants

Each invariant must (a) name a rule, (b) name what breaks if violated. Length should be one sentence per part, not a paragraph.

- **Server processes pushed entries in payload order within a transaction.** Reason: the move operation emits `copy → child copies → source-with-pointer` and relies on FK checks passing because the copy already exists by the time the source references it. If the processor reorders (e.g., by id, or grouped by table), the same-batch FK reference breaks.

- **`InHydratedRange` returns soft-deleted (tombstoned) entries.** Reason: cascade soft-delete bumps children's sync version so clients learn about the tombstones via the next pull. That only works if the query does not filter `deleted_at IS NULL`. The PRD describes `InHydratedRange` as the only entry-query constraint and does not address `deleted_at` — implementer could reasonably add a `whereNull('deleted_at')` and break tombstone propagation.

## End-to-end walkthroughs

Each walkthrough is a 2–4 step sequence ending on a single probing question the PRD ought to imply an unambiguous answer to.

- **Hydrated-range re-anchor with a queued edit**: Range is `[Apr, May, Jun]`. User offline, edits April 3rd entry (queue has one item). User navigates to August → re-anchor to `[Jul, Aug, Sep]` and drop the old range's IndexedDB. **Probing question**: is the April queue item dropped along with the April rows, kept in a queue store that survives the drop, or kept-but-orphaned (queue references an entry id whose row was just evicted)?

- **Cursor-expired during a pending push**: Client has 3 queue items, cursor 31 days old. → Push fires, server returns `cursor_expired: true`. → Client drops IndexedDB for the hydrated range and re-issues with `cursor=0`. **Probing question**: are the 3 queue items pushed (a) before the re-hydration request, (b) after, or (c) dropped? If after, the re-hydration response is computed against pre-push server state and immediately invalidated; if before, the server is processing pushes from a client whose cursor it just rejected as stale.
