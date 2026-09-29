---
name: pr-review
description: Drafts an unsubmitted GitHub pull request review flagging runtime correctness risks — code that will misbehave, break its callers, or corrupt data. Use when asked to review a PR for bugs or hidden issues, to find what a change might break, or when another skill needs that draft written. Standards and spec fidelity belong to `code-review`.
model: opus
context: fork
allowed-tools:
  - Read
  - Grep
  - Skill
  - 'Bash(ripwire *)'
  - 'Bash(jq *)'
  - 'Bash(gh api graphql *)'
---

# PR review

One axis: **what breaks**. A finding belongs here when the code will misbehave at
runtime — wrong output, lost data, a broken caller, a query that melts under load.
Code that is merely ugly, or that drifts from the ticket, is `code-review`'s work.

Findings land as threads on a **draft** — a pending review that stays unsubmitted. The
human reads every comment before any of it is public, so the cost of a wrong finding is
one deleted draft comment. That is the whole safety net, and it is why the bar in step 4
is worth holding.

Target: `$ARGUMENTS` — a pull request URL, or the path of a context already prepared by
`pr-prepare-context`.

When that is empty, stop and say: `pr-review needs a PR URL or a prepared context path.`

## 1. Get the context

Given a path, use it as-is. Given a URL, invoke the `pr-prepare-context` skill and use
the root it reports — stopping after its checkout step. Reviewing reads source text, so
it needs no installed dependencies.

The root holds:

```
src/                      checkout, detached at the PR head
context/meta.env          OWNER REPO PR_NUMBER BASE_BRANCH BASE_SHA HEAD_SHA
context/pr.json           title, body, author, url, baseRefName, headRefName, labels, state
context/patch.diff        BASE_SHA..HEAD_SHA — the PR's own changes
context/diffstat.txt
context/changed-files.txt
```

`patch.diff` is the evidence and the anchoring authority. `pr.json` holds the URL to
report.

An empty `changed-files.txt` means there is nothing to review: say so and stop.

Read the diff and the checkout. The ticket stays closed — intent is `code-review`'s axis,
and a correctness reviewer that reads the ticket starts reporting unmet requirements.

## 2. Pick the targets

```
ripwire "$ROOT/src" --pr-context="$BASE_SHA"
```

Each changed file gets an `<impact dependents="N" files_other="M"/>`. Read the files with
dependents alongside the callers that reach them — that is where a changed contract turns
into someone else's bug. Files nothing reaches get a single pass over the diff. Counts are
floors, so a zero means "none found". When `ripwire` is unavailable or the language is
unindexed, work in diff order and say the reach was unmeasured.

These files hold nothing to judge: lockfiles, generated or compiled output, vendored code,
fixtures, snapshots.

Tests are in scope for one thing only — a test that lies, the row of that name in
`references/pitfalls.md`. A test that cannot fail hides a runtime bug, which is this axis.

## 3. Find the candidates

Read `references/pitfalls.md` and run every changed hunk past it. It has a
language-agnostic section and a Laravel section; skip the Laravel section on a diff with no
PHP in it.

A candidate is a pitfall matched to a specific line. Something off the table is something
this skill stays quiet about.

## 4. Grade

Each candidate is graded once, into one of three tiers, and anything that fits none of them
is dropped in silence.

| Tier | When |
| --- | --- |
| `🔴` | The scenario is complete — inputs, path, wrong result — and the outcome is wrong behavior, lost data, a security hole, or money. |
| `🔵` | The scenario is complete, and the outcome is survivable — a slow page, a 500 where a message belonged. |
| `🤔` | The hazard is located, and it hinges on one fact the checkout cannot settle. |

Two rules hold the tiers apart:

- **Severity grades facts.** A question carries no `🔴`/`🔵` — the skill that could not
  settle the fact cannot rank the damage either.
- **A question has one honest answer at most.** When the answer is knowable from the
  checkout, the finding is a `🔴` or a `🔵`. A question with a single plausible answer is an
  assertion wearing a question mark, and it is the fastest way to spend the reviewer's
  trust.

Findings on the same line merge within a tier. Across tiers they stay separate — the tier
is the signal, and one prefix cannot carry two kinds of claim.

## 5. Write the comments

Every body opens with `🤖` and its tier emoji. Two lines:

1. The fact, or — for `🤔` — the question.
2. Where it reaches from, or the fact that could not be settled. Dropped when the finding
   is local and speaks for itself.

```
🤖 🔴 `up()` renames `orders.status` to `state`; `down()` drops `state` instead of renaming it back — a rollback leaves orders with no status column.
Reached by OrderExport::rows(), 14 dependents.

🤖 🔵 `$items` is lazy-loaded inside the foreach — one query per row.
InvoiceController::show() renders this with up to 200 rows.

🤖 🤔 What bounds `qty` before it reaches the `* $price` multiply?
No rule for it in StoreOrderRequest.
```

Write plainly and state the finding outright: *"a rollback leaves orders with no status
column"*, never *"this could potentially cause data loss"*. Hedging reads as uncertainty
the tier already encodes, and it costs the reviewer a re-read on every comment in a long
draft.

The body states the problem. A suggested fix is what a reviewer argues with instead of
weighing the claim, and it doubles the surface on which this skill can be confidently
wrong.

## 6. Post

### Anchor from the hunks

`patch.diff`'s `@@` headers decide what can be anchored; the API is not consulted for it.
For each hunk `@@ -old,n +new,m @@`:

- an added or context line anchors at its new-file number, `side: RIGHT`
- a removed line anchors at its old-file number, `side: LEFT` — a deleted guard is exactly
  this skill's finding

A finding on any other line demotes to a file-level thread on its file. Only a finding
belonging to no single file goes into the review body.

### Look up the draft

One query, carrying both the PR node ID and any draft already open:

```
gh api graphql --input - <<'JSON'
{"query":"query($owner:String!,$repo:String!,$number:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$number){id reviews(states:[PENDING],last:1){nodes{id body}}}}}",
 "variables":{"owner":"OWNER","repo":"REPO","number":123}}
JSON
```

`gh api`'s `-f`/`-F` flags carry scalars only, so every call on this page passes its whole
payload through `--input -`.

### No draft — create one

One `addPullRequestReview` carrying every line-anchored thread, with no `event`, which is
what leaves it pending:

```
gh api graphql --input - <<'JSON'
{"query":"mutation($input:AddPullRequestReviewInput!){addPullRequestReview(input:$input){pullRequestReview{id state}}}",
 "variables":{"input":{"pullRequestId":"PR_…","body":"…","threads":[{"path":"src/a.php","line":12,"side":"RIGHT","body":"🤖 🔴 …"}]}}}
JSON
```

`DraftPullRequestReviewThread` has no `subjectType`, so each demoted finding follows as its
own `addPullRequestReviewThread` against the returned review ID:

```
{"query":"mutation($input:AddPullRequestReviewThreadInput!){addPullRequestReviewThread(input:$input){thread{id}}}",
 "variables":{"input":{"pullRequestReviewId":"PRR_…","path":"src/a.php","subjectType":"FILE","body":"🤖 🔵 …"}}}
```

### A draft exists — append

It belongs to the authenticating account, so it may be a review the human started by hand.
Add each finding with `addPullRequestReviewThread` against its ID, then set the body with
`updatePullRequestReview` to **the body read in the lookup, plus the header appended**:
`updatePullRequestReview` replaces the body, and overwriting it would erase what the human
wrote.

### The body header

Three lines:

```
🤖 Machine-generated review draft. Nothing here is submitted.
2🔴 1🔵 3🤔 — delete what you disagree with. The account holding these comments has not endorsed them.
Runtime correctness only; standards and spec fidelity are not covered.
```

### Leave it pending

The draft stays unsubmitted: no `event` on creation, and no
`submitPullRequestReview`. Submitting is the human's call, made after reading.

When the lookup returns no draft and the create fails anyway, stop and report the API's
message. GitHub allows one pending review per account per pull request and does not
document that error, so pass it through rather than retrying around it.

## 7. Report

One line — counts by tier, the word `pending`, and the PR URL. A draft has no URL of its
own until it is submitted.

```
2🔴 1🔵 3🤔 pending — https://github.com/owner/repo/pull/123
```

When the findings went into a draft the human already had open, say that instead:

```
2🔴 1🔵 3🤔 added to your open draft — https://github.com/owner/repo/pull/123
```

When nothing cleared the bar, write nothing to the PR and report:

```
Nothing cleared the bar; no review drafted.
```
