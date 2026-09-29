---
name: pr-prepare-context
description: Prepares an isolated checkout and diff artifacts for a GitHub pull request, so another skill can review or analyse it. Use when given a PR URL to review, brief, or inspect, when another skill needs a prepared PR checkout.
model: sonnet
---

# Prepare PR context

Turns a pull request URL into a checkout with dependencies installed and a fixed set
of artifacts on disk. Reviewing, summarising, and judging the PR belong to the
downstream skill.

## Steps

### 1. Run the script

```
scripts/prepare.sh <pull-request-url>
```

It clones to `/tmp/{owner}-{repo}-pr-{number}/`, checks out the PR head detached, and
writes the artifacts below. Re-running is safe and cheap: it fetches, resets `src/` to
the current head — discarding anything written there — and rewrites `context/`.

The script exits non-zero with the fix on its own preflight failures (`gh` not
authenticated, URL not a PR, repository unreachable). Pass that message to the user
rather than working around it.

### 2. Install dependencies

Look at the root of `src/` for PHP and JavaScript manifests and install with whatever
the lockfiles indicate. Run this on every run — the package managers no-op when the
tree already matches.

If an install fails, stop and tell the user the command and the directory. The
checkout is intact; the user fixes the install in place and you continue from there.

### 3. Hand off

Report `/tmp/{owner}-{repo}-pr-{number}` and let the downstream skill read what it
needs from it.

## Artifacts

```
src/                          checkout, detached at the PR head
context/meta.env              OWNER REPO PR_NUMBER BASE_BRANCH BASE_SHA HEAD_SHA
context/pr.json               title, body, author, refs, labels, state
context/patch.diff            BASE_SHA..HEAD_SHA
context/diffstat.txt
context/changed-files.txt
```

`BASE_SHA` is the merge-base of the PR head and the base branch, so the patch is the
PR's own changes and nothing the base picked up meanwhile.
