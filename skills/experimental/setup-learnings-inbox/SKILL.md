---
name: setup-learnings-inbox
description: Set up a learnings inbox in a repository and wire the local agent router file(s) — CLAUDE.md and/or AGENTS.md — to read curated learnings before work and record new discoveries as they happen. Use whenever the user wants to enable, set up, scaffold, or bootstrap a learnings inbox, learning capture, or knowledge capture for a repo — or mentions gathering learnings, an agent learnings file, or having the agent record gotchas as it works. Creates docs/learnings/ (INBOX.md, LEARNINGS.md) and injects a capture instruction into every router file that exists. Run once per repo.
---

# Set up a learnings inbox

This skill bootstraps a lightweight system for capturing what the agent learns
while working in a repo, and wires the repo's agent router file(s) — `CLAUDE.md`
and/or `AGENTS.md` — to read the accumulated learnings before work and record
new ones into a staging file (the *inbox*).

The design deliberately splits two jobs:

- **Capture** (cheap, ambient, automated): while doing any task, the agent
  appends surprising or non-obvious findings to `docs/learnings/INBOX.md`. This
  is driven by an always-loaded instruction in the router file(s), because the
  trigger ("huh, that wasn't what I expected") can fire during *any* task and
  can't be predicted in advance.
- **Curation** (deliberate, human-in-the-loop): promoting good inbox entries
  into the curated `docs/learnings/LEARNINGS.md`, pruning stale ones, merging
  duplicates. That is a separate, invoked process — out of scope for this skill.

The router block encodes the agent's behavior: **read** the curated learnings
(`docs/learnings/LEARNINGS.md`) before starting work, **append** any new
discovery to `docs/learnings/INBOX.md` while working, and **flag** in its reply
whenever it recorded one so the user knows something was found. Reading and
capturing happen every task, unconditionally.

## When to run

Run this once per repository, when the user wants to enable learning capture.
Re-running is safe (see the idempotency rules below) — it repairs a partial
setup rather than duplicating it.

## Steps

Work through these in order. Each step names the condition that tells you it's
done.

### 1. Locate the repo root and router files

Find the repository root:

```bash
git rev-parse --show-toplevel 2>/dev/null || pwd
```

The inbox lives at `docs/learnings/` relative to the root (use a different
folder only if the user asks). The **router files** are the agent-instruction
files at the repo root: `CLAUDE.md` and `AGENTS.md`. Determine which exist —
you'll update every one that does. Briefly state the inbox path and which router
file(s) you're about to touch before creating anything.

**Done when:** you know the repo root, the inbox path, and the set of router
files present.

### 2. Check for an existing setup (idempotency)

If `docs/learnings/INBOX.md` already exists, the structure is already in place —
do **not** overwrite it or `LEARNINGS.md`. Skip to step 4 to verify the capture
block in each router file, then report that the inbox already existed.

**Done when:** you know whether this is a fresh setup or a repair.

### 3. Create the inbox structure

Create `docs/learnings/` and write these two files, each **only if it does not
already exist** (never clobber a file that may hold real content).

`docs/learnings/INBOX.md` — the staging file the agent appends to. Its header
carries the entry format, so it's visible right where entries get written:

```
# Inbox — unreviewed learnings

Staging area. The agent appends entries here as it works; a person promotes the
good ones into `LEARNINGS.md` and clears them from here.

## Entry format

A dated, area-tagged claim, optionally followed by one or two lines of *why it
matters* or the cost of ignoring it:

    ### YYYY-MM-DD — <area>: <one-line claim>
    <optional rationale, or the cost of getting it wrong — 1–2 lines>

Keep entries short and self-contained. Prefer a claim that changes what someone
does next over a diary note. Example:

    ### 2026-07-06 — orders: don't trust the order status field for refunds
    Staff can hand-edit it, so it drifts. Check the transactions array for a
    refund_success event instead — that reflects actual money movement.

---
Append new entries below.
```

`docs/learnings/LEARNINGS.md` — the curated file, starts empty:

```
# Learnings — curated

Trustworthy, kept learnings, promoted from `INBOX.md` after review. Group by
area; prune entries when they stop being true.

_No curated learnings yet._
```

**Done when:** both files exist under `docs/learnings/` and any that pre-existed
were left untouched.

### 4. Wire up the router file(s) (idempotent)

Insert the block below into **every** router file found in step 1 — if both
`CLAUDE.md` and `AGENTS.md` exist, update both, identically. It sits between two
markers so re-runs update it in place instead of stacking copies.

First decide the set of files:

- **At least one of `CLAUDE.md` / `AGENTS.md` exists** → the set is every one
  that exists; don't create the other.
- **Neither exists** → create a single `CLAUDE.md` with the block (or `AGENTS.md`
  if the user prefers); don't create both.

Then, for **each** file in that set:

- **File doesn't exist** (the just-decided default) → create it with the block
  as its contents.
- **Exists, no `<!-- BEGIN learnings-capture -->` marker** → append a blank line
  then the block.
- **Exists with the markers** → replace everything between (and including) the
  markers with the current block.

Insert this block verbatim; don't touch anything outside the marked region:

```
<!-- BEGIN learnings-capture -->
## Learnings

This repo keeps a running log of hard-won learnings under `docs/learnings/`.

**Before you start working**, read `docs/learnings/LEARNINGS.md` — the curated,
trustworthy learnings — so you benefit from what's already been discovered
instead of rediscovering it or repeating a past mistake. If your task touches a
specific area, pay attention to the entries tagged for it.

**While working**, whenever you hit something surprising or non-obvious — a
field or status you couldn't trust, an API behaving unlike its docs, a
repo-specific gotcha, or a decision whose rationale wasn't obvious — append one
short entry to `docs/learnings/INBOX.md` before you finish. Do this every time,
without being asked. Capture a claim plus, where it matters, the *why* or the
cost of ignoring it. One entry per learning; the entry format is in that file's
header.

**When you add an entry, say so in your reply** — a brief one-line note such as
"Recorded a learning: <gist>" — so the user knows something was found and
captured. Keep it short; it's a heads-up, not a summary.

Append to the inbox only. Never edit `docs/learnings/LEARNINGS.md` directly —
that file is curated separately.
<!-- END learnings-capture -->
```

**Done when:** every targeted router file contains exactly one learnings-capture
block, with no duplicates and no changes outside the markers.

### 5. Report

Tell the user, briefly:

- Which files were created vs. already present.
- Which router file(s) were changed and how (created / appended / updated in
  place) — name each one.
- That discoveries accumulate in `INBOX.md` and should be periodically curated
  into `LEARNINGS.md` — a separate, deliberate pass, not something to automate.

**Done when:** the user knows what changed and how capture and curation relate.

## Notes

- The block and the two seed files above are the single source of truth for
  wording. To tweak the entry format or the capture rule, edit them here so a
  re-run stays consistent across every router file.
- This skill only sets up **capture** (and reading). Promoting, pruning, or
  merging entries is the curation step — a good candidate for a separate,
  user-invoked skill.
