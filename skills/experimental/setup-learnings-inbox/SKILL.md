---
name: setup-learnings-inbox
description: Set up an opt-in learnings inbox in a repository and wire the local CLAUDE.md to capture learnings into it. Use whenever the user wants to enable, set up, scaffold, or bootstrap a learnings inbox, learning capture, or knowledge capture for a repo — or mentions gathering learnings, an agent learnings file, or having the agent record gotchas as it works. Creates docs/learnings/ (INBOX.md, LEARNINGS.md, README.md) and injects a gated capture instruction into the repo's agent router file(s) — CLAUDE.md and/or AGENTS.md, updating both if both exist. Run once per repo.
---

# Set up a learnings inbox

This skill bootstraps a lightweight, opt-in system for capturing what the agent
learns while working in a repo, and wires the repo's agent router file(s) —
`CLAUDE.md` and/or `AGENTS.md` — to feed those learnings into a single staging
file (the *inbox*).

The design deliberately splits two jobs:

- **Capture** (cheap, ambient, automated): while doing any task, the agent
  appends surprising or non-obvious findings to `docs/learnings/INBOX.md`. This
  is driven by an always-loaded instruction in the router file(s), because the
  trigger ("huh, that wasn't what I expected") can fire during *any* task and
  can't be predicted in advance.
- **Curation** (deliberate, human-in-the-loop): promoting good inbox entries
  into the curated `docs/learnings/LEARNINGS.md`, pruning stale ones, merging
  duplicates. That is a separate, invoked process — out of scope for this skill.

The capture instruction is **self-disabling**: it only acts when the inbox file
exists. Deleting `docs/learnings/` turns capture off with no other edits, which
is why the block is safe to commit and share across branches.

## When to run

Run this once per repository, when the user wants to enable learning capture.
Re-running is safe (see the idempotency rules below) — it repairs a partial
setup rather than duplicating it.

## Steps

Work through these in order. Each step names the condition that tells you it's
done.

### 1. Locate the repo root and confirm the target path

Find the repository root:

```bash
git rev-parse --show-toplevel 2>/dev/null || pwd
```

The default inbox location is `docs/learnings/` relative to the root. The
**router files** are the agent-instruction files at the repo root: `CLAUDE.md`
and `AGENTS.md`. Determine which of them exist — you'll update every one that
does (both, if both are present). If the user asked for a different inbox folder,
use that instead and substitute it everywhere below. Briefly state the inbox
path and which router file(s) you're about to touch before creating anything.

**Done when:** you know the absolute repo root, the inbox directory path, and
the set of router files present at the root.

### 2. Check for an existing setup (idempotency)

If `docs/learnings/INBOX.md` already exists, the structure is already in place —
do **not** overwrite it or its sibling files. Skip straight to step 4 to verify
the capture block in each router file, then report that the inbox already
existed.

**Done when:** you know whether this is a fresh setup or a repair.

### 3. Create the inbox structure

Create the directory and copy the three template files into it, creating each
file **only if it does not already exist** (never clobber a file that may hold
real content):

- `docs/learnings/README.md`  ← from `assets/README.md` (the contract + entry format)
- `docs/learnings/INBOX.md`   ← from `assets/INBOX.md` (the staging file the agent appends to)
- `docs/learnings/LEARNINGS.md` ← from `assets/LEARNINGS.md` (the curated file, starts empty)

Copy them verbatim from this skill's `assets/` directory; don't paraphrase the
templates.

**Done when:** all three files exist under the inbox directory and any that
pre-existed were left untouched.

### 4. Wire up the router file(s) (idempotent)

Apply the capture block to **every** router file identified in step 1 — if both
`CLAUDE.md` and `AGENTS.md` exist, update both, so the instruction is present
whichever file the agent reads. The block lives between two markers
(`<!-- BEGIN learnings-capture -->` … `<!-- END learnings-capture -->`) so
re-runs update it in place rather than stacking copies. The exact block is in
`assets/capture-block.md` — insert it verbatim, and it's identical across files.

First decide the set of files to write:

- **At least one of `CLAUDE.md` / `AGENTS.md` exists at the root** → the set is
  every one that exists. Do not create the other one; only touch files that are
  already there.
- **Neither exists** → create a single `CLAUDE.md` containing the block (unless
  the user asked for `AGENTS.md`, in which case create that instead). Don't
  create both from scratch.

Then, for **each** file in that set, handle three cases:

- **File does not yet exist** (only the just-decided default) → create it with
  the block as its contents.
- **File exists, no `<!-- BEGIN learnings-capture -->` marker** → append a blank
  line and then the block to the end of the file.
- **File exists and already contains the markers** → replace everything between
  (and including) the two markers with the current block, so the instruction
  stays in sync with this skill's version.

Do not touch anything outside the marked region of each file.

**Done when:** every targeted router file contains exactly one learnings-capture
block matching `assets/capture-block.md`, no file has a duplicate block, and no
content outside the markers changed.

### 5. Report

Tell the user, briefly:

- Which files were created vs. already present.
- Which router file(s) were changed and how (created / appended / updated in
  place) — name each one, e.g. both `CLAUDE.md` and `AGENTS.md`.
- How to disable capture: delete `docs/learnings/` (or just `INBOX.md`); the
  block in each router file self-skips when the inbox is absent, so no further
  edit is needed.
- That entries accumulate in `INBOX.md` and should be periodically curated into
  `LEARNINGS.md` — a separate, deliberate pass, not something to automate.

**Done when:** the user knows what changed and how the two halves (capture vs.
curate) relate.

## Notes

- Keep the templates as the single source of truth for wording. If the user
  wants to tweak the entry format or the capture rule, edit the template /
  `assets/capture-block.md` rather than hand-editing installed copies, so a
  re-run stays consistent across every router file.
- This skill only sets up **capture**. If the user asks about promoting,
  pruning, or merging entries, that's the curation step — a good candidate for
  a separate, user-invoked skill.
