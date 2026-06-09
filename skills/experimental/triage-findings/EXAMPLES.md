# Examples

Curated samples drawn from a real triage run against a `prd-self-audit` report plus a hypothetical `review` report. Use as a quality bar for shape and depth — do not copy the domain.

## Amend inline — clean contradiction

Finding (from audit):
> **§Wire protocol (L52) vs §LWW behaviour (L98)** — "rolls back" vs "commits"
> - Side A (L52): "Validation/invariant/FK failures: HTTP 422 with `{ errors: [...] }`. The whole batch rolls back."
> - Side B (L98): "The transaction commits even when individual entries are rejected."

Triage:
- **Wire protocol vs LWW behaviour** — Not a true contradiction; L52 covers 422 (validation/FK), L98 covers 200 with LWW staleness. Wording invites confusion. Amend L52 to disambiguate.
  - Edit at L52: after "The whole batch rolls back.", add: "This applies to validation/FK failures only. LWW-stale entries return 200 with the stale items in `rejected[]` and the rest committed (see §LWW behaviour)."

## Amend inline — ambiguous, list the options

Finding (from audit):
> Three-sided contradiction L13 / L169 / L180 about whether legacy tag controllers (`Api/Tags/*`) are removed.

Triage:
- **Legacy tag controllers** — Three sides; the carve-out at L169 has its own consequences (autocomplete rot, rename/merge/delete availability) the other two sides are silent on. User must pick before the edit. List both options inline.
  - Option A — Remove `Api/Tags/*`: amend L169 to drop "stay in place"; rename/merge/delete unavailable in v1; autocomplete-rot caveat strengthened.
  - Option B — Keep `Api/Tags/*` for rename/merge/delete only: amend L13 and L180 to scope removal to entries only; L169 stays as-is.

## Re-grill — design shifted under the PRD

Finding (paraphrased review item):
> Sync cycle now drains the push queue before any pull (Issue 26 + ADR-0003). PRD §Sync cycle still describes a 60-second pull timer driving both directions.

Triage:
- **Sync cycle drift** — Design moved between PRD v1 and accepted Issue 26 / ADR-0003. An inline rewrite would touch most of the section, debounce semantics, and the online-event flush interaction. Re-grill the section as a whole.
  - Section to re-grill: §Sync cycle — drain-then-pull replaces 60s timer; cover single-flight, debounce interaction, online-event flush, cursor-expired handling.

## New issue — PRD is right, code is wrong

Finding (paraphrased review item):
> `markRejected` is never called when the server returns `rejected[]`; queue items stay forever and the pending counter sticks.

Triage:
- **`markRejected` not wired** — PRD §LWW (L98) and the "ack and rejected partition the request" invariant both specify the behaviour. Pure implementation gap.
  - Brief: When `/api/sync` returns entries in `rejected[]`, the FE must call `SyncQueue.markRejected(id)` for each — symmetric to `markAcked` for `ack[]`. Without this, rejected items stay queued, the pending counter never drops, and retries push the same stale rows again. Verify against L98 + the queue-partition invariant; the queue should be empty after a 200 response in which every pushed id appears in either `ack[]` or `rejected[]`.

## No-op — finding misread the PRD

Finding (paraphrased review item):
> No handling specified for "user soft-deletes a parent with no children" — what happens to the cascade?

Triage:
- **Empty cascade** — PRD §Soft delete (L105) states cascade bumps each child's `sync_state_id`. With zero children, the cascade is a no-op; the parent's own bump still fires. PRD already implies the unambiguous answer. Reviewer over-flagged.
