---
name: pr-reviewer-brief
description: Posts a short orientation comment on a GitHub pull request whose description is too vague for a reviewer to get the big picture. Use when asked to brief, orient, or write an overview for a PR's reviewer, or when another skill needs that comment posted.
model: sonnet
context: fork
allowed-tools:
  - Read
  - Grep
  - Skill
  - 'Bash(gh pr comment *)'
  - 'Bash(gh issue view *)'
disable-model-invocation: true
---

# PR reviewer brief

A reviewer opens a pull request and asks two things: **why does this exist**, and **what
shape is the change**. When the description already answers both, this skill posts
nothing. When it does not, it posts one comment that does.

Target: `$ARGUMENTS` — a pull request URL, or the path of a context already prepared by
`pr-prepare-context`.

When that is empty, stop and say: `pr-reviewer-brief needs a PR URL or a prepared context path.`

## 1. Get the context

Given a path, use it as-is. Given a URL, invoke the `pr-prepare-context` skill and use
the root it reports — stopping after its checkout step. A brief reads source text, so it
needs no installed dependencies.

The root holds:

```
src/                      checkout, detached at the PR head
context/meta.env          OWNER REPO PR_NUMBER BASE_BRANCH BASE_SHA HEAD_SHA
context/pr.json           title, body, author, url, baseRefName, headRefName, labels, state
context/patch.diff        BASE_SHA..HEAD_SHA — the PR's own changes
context/diffstat.txt
context/changed-files.txt
```

`pr.json` holds the description under judgement and the URL to report. `patch.diff` is
the evidence the brief is written from.

An empty `changed-files.txt` means there is nothing to brief: say so and stop.

## 2. Judge the description

Read `body` from `pr.json` and ask whether a reviewer could answer both questions from it
alone:

- **Why does this exist** — the problem it solves, or what becomes possible once it ships.
- **What shape is the change** — where the work landed and how the pieces fit, enough to
  know what to read first.

Both answered → post nothing, report, and stop. An empty body, an unfilled template, a
bare ticket link, or a restatement of the title answers neither.

This is a bar on substance, not on length. A three-sentence body that names the problem
and the shape passes; a long one that narrates the diff file by file does not.

## 3. Gather what the brief needs

- Read `context/patch.diff` in full.
- Read the linked issue when the body names one as `#123` or a same-repo issue URL:
  `gh issue view <number> --repo "$OWNER/$REPO" --json title,body`. That is the only
  source outside the PR.
- Read files under `src/` to the depth it takes to understand the behavior and ownership
  of what changed — the diff shows the hunks, the checkout shows what surrounded them.

## 4. Write the brief

Read `references/reviewer_brief_template.md` and fill it. Read `references/show-me.md`
for the view conventions the **Change outline** uses.

Four rules govern what goes in it:

- **Describe, never evaluate.** State the observable before → after: *"a failed webhook
  signature check now returns 401 instead of 500"*. The words *cleaner*, *improved*, and
  *refactored for clarity* hide the runtime difference the reviewer is looking for. A risk
  verdict belongs to `pr-labels`, and offering one here preempts the review.
- **The why comes from the PR or the issue.** When neither states it, say the PR does not
  say why. A why inferred from the diff is the one thing in this comment that can mislead.
- **Views, not a changelog.** The **Change outline** is a structural sketch — a file tree,
  a call tree, a Mermaid diagram, a pseudocode diff. A file-by-file list is the diff the
  reviewer already has.
- **One screen.** Everything in the comment is there because a reviewer needs it before
  reading the diff.

## 5. Post

Post it as a new comment. Every invocation posts its own comment; no earlier one is
edited or removed.

```
gh pr comment --repo "$OWNER/$REPO" "$PR_NUMBER" --body-file - <<'EOF'
…
EOF
```

The body is exactly this, with the brief in place of the placeholder:

```
🤖🖼️ (This is a quick overview to help the reviewer understand the PR)

---

{the brief}
```

## 6. Report

One line — the comment URL `gh` prints, or, when the description passed:

```
Description covers it; no comment posted.
```
