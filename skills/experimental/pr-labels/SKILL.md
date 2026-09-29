---
name: pr-labels
description: Assigns `pr:door:*` and `pr:blast-radius:*` labels to a GitHub pull request, creating them in the repo if missing. Use when asked to label, triage, or classify the risk of a PR, or when another skill needs those labels applied.
model: opus
context: fork
allowed-tools:
  - Read
  - Grep
  - Skill
  - 'Bash(gh label list *)'
  - 'Bash(gh label create *)'
  - 'Bash(gh pr edit *)'
  - 'Bash(ripwire *)'
  - 'Bash(jq *)'
---

# PR labels

Two labels on a pull request, answering the two questions that tell a reviewer how hard
to look: **the door** — can this be undone — and **the blast radius** — if it is wrong,
how bad is it.

Target: `$ARGUMENTS` — a pull request URL, or the path of a context already prepared by
`pr-prepare-context`.

When that is empty, stop and say: `pr-labels needs a PR URL or a prepared context path.`

## 1. Get the context

Given a path, use it as-is. Given a URL, invoke the `pr-prepare-context` skill and use
the root it reports — stopping after its checkout step. Labelling reads source text, so
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

`patch.diff` and `changed-files.txt` are the evidence for both verdicts. `pr.json` holds
the labels already on the PR and the URL to report.

An empty `changed-files.txt` means there is nothing to judge: say so and stop.

## 2. Call the door

Grep `patch.diff` and `changed-files.txt` against the left column. Any hit makes it
one-way.

| One-way — review hard | Two-way — skim |
| --- | --- |
| Migration that drops or rewrites a column, table, or index | Additive column, table, or index |
| Data backfill, bulk update, or delete | Code-only change over unchanged data |
| Change to a serialized format already on disk or in a queue — cache keys, job payloads, session shape | New queue job or cache key |
| Published package version, or a change to an API other systems already call | Internal refactor behind an unchanged signature |
| Writes to a third party that cannot be undone — payments, emails, webhooks to partners, external order state | Read-only third-party calls |
| Credential, permission, or tenancy-scoping change | UI, copy, or styling |
| Lockfile change pulling a major version | Lockfile patch bump |
| Anything gated behind an irreversible external approval | Anything behind a feature flag you can switch off |

Hold on to the specific evidence — the file and what it does. The verdict is reported as
*"`2026_09_12_drop_legacy_status.php` drops `orders.legacy_status` with no down
migration"*, never as *"appears to be low risk"*.

## 3. Call the blast radius

Judge the damage if the change is wrong, not the size of the diff.

| Bucket | If this is wrong… |
| --- | --- |
| `none` | nothing outside the diff behaves differently — docs, comments, tests, dead code |
| `small` | one screen, endpoint, or job misbehaves, for whoever uses it |
| `mid` | several features degrade — a shared module, service, or model that multiple flows call |
| `big` | everyone or the data is hurt — auth, tenancy, money, bulk writes, shared infra, build or deploy config |

The diff shows what changed; it does not show who depends on it. When the reach beyond
the diff is the thing in doubt — an innocuous-looking helper that half the app may call —
measure it:

```
ripwire "$ROOT/src" --pr-context="$BASE_SHA"
```

Each changed file gets an `<impact dependents="N" files_other="M"/>`: how many symbols
and non-changed files reach it. Counts are floors, so a zero means "none found". Treat
them as evidence the bucket has to account for — a file with 40 dependents is hard to
call `small`. When `ripwire` is unavailable or the language is unindexed, judge from the
diff and say the reach was unmeasured.

## 4. Ensure the labels exist

```
gh label list --repo "$OWNER/$REPO" --search "pr:" --json name
```

When any of the six is missing, `gh label create --force` all six — it repairs a repo
where someone recoloured them:

| Label | Hex |
| --- | --- |
| `pr:door:one-way` | `B60205` |
| `pr:door:two-way` | `0E8A16` |
| `pr:blast-radius:none` | `EEEEEE` |
| `pr:blast-radius:small` | `C2E0C6` |
| `pr:blast-radius:mid` | `FBCA04` |
| `pr:blast-radius:big` | `D93F0B` |

## 5. Apply

One `gh pr edit --repo "$OWNER/$REPO" "$PR_NUMBER"` adding the new pair and removing the
`pr:door:*` and `pr:blast-radius:*` labels in `pr.json` that differ from it. That removal
is what keeps a re-run after a force-push from leaving two radius labels behind. A label
already correct stays put, so it belongs in neither list.

## 6. Report

One line, carrying the labels applied, the evidence for the door, and the PR URL:

```
pr:door:one-way · pr:blast-radius:mid — drops `orders.legacy_status` with no down migration
```
