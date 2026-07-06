# Learnings

Institutional memory for this repo, captured by the coding agent as it works.

Two files, two jobs:

- **`INBOX.md` — capture (automated).** A staging area the agent appends to
  whenever it hits something surprising or non-obvious during a task. Entries
  here are raw and unreviewed. Append-only; nobody should rely on this file as
  authoritative.
- **`LEARNINGS.md` — curated (human-in-the-loop).** The kept, trustworthy
  learnings. Entries land here only after a person (or a deliberate curation
  pass) reviews an inbox entry and decides it's worth keeping — sharpening it,
  merging duplicates, and pruning what's gone stale.

The split exists on purpose: capturing is cheap and worth automating, but
*keeping* is a judgment call. An unattended append-only file fills with
redundant, overfit, or contradictory notes and becomes noise. Curation is what
keeps this valuable.

## Entry format

Each entry is a dated, area-tagged claim, optionally followed by one or two
lines of *why it matters* or the cost of ignoring it:

```
### YYYY-MM-DD — <area>: <one-line claim>
<optional: rationale, or the cost of getting this wrong — 1–2 lines>
```

Keep entries short and self-contained. The `<area>` (e.g. `auth`, `sync`,
`build`, `data`) lets a reader scan for the relevant slice. Prefer a claim that
would change what someone does next over a diary note.

**Example:**

```
### 2026-07-06 — orders: don't trust the order `status` field for refunds
Staff can hand-edit it, so it drifts. Check the transactions array for a
`refund_success` event instead — that reflects actual money movement.
```

## Disabling capture

Delete this folder (or just `INBOX.md`). The capture instruction in the repo's
`CLAUDE.md` only acts when `INBOX.md` exists, so it self-skips — no other edit
needed.
