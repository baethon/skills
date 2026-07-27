---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

# Implement

## Process

### 1. Understand The Work

Read the spec or ticket and inspect the relevant code before editing. Identify the acceptance criteria, existing patterns, and seams where `/tdd` can be used.

Completion criterion: you can state what behavior must change, what must stay the same, and which files or areas are likely involved.

### 2. Plan Commit Slices

Decide whether the work is atomic or should be split into multiple commit slices.

Use one slice when the ticket is a single small behavior change.

Use multiple slices when the ticket contains separable outcomes, such as:
- prefactoring that makes the change easy
- schema, model, or contract changes
- backend behavior
- UI behavior
- tests or verification scaffolding
- cleanup after the behavior is green

Each slice must be independently explainable, keep the branch green, and avoid mixing unrelated concerns.

Prefer vertical, verifiable slices. Use horizontal layer-only slices only when that is the safest way to keep the branch green.

Completion criterion: before editing, you have either one atomic slice or a short ordered list of slices, each with its own verification target.

### 3. Delegate One Slice At A Time

For each planned slice, launch a fresh implementation subagent. Give the subagent:

- the slice goal
- the relevant acceptance criteria and constraints
- the files, patterns, or seams already discovered
- the focused verification target
- the requirement to commit only files that belong to the slice

The subagent owns the slice:

1. Use `/tdd` when the seam identified in step 1 fits test-first work; otherwise state why it does not fit.
2. Make the smallest change that completes the slice.
3. Run the focused test, typecheck, or verification command for the slice.
4. Review the diff for that slice.
5. Commit only the files that belong to that slice.
6. Return the commit hash, verification result, and any remaining risks or blockers.

After the subagent returns, inspect the reported commit and check `git status --short` before launching the next slice. If the subagent reports a blocker, verification failure, or unexpected uncommitted work, stop and report the blocker.

Completion criterion: every planned slice has a reported commit and focused verification result, or you have stopped and reported the blocker.

### 4. Final Verification

After all slice commits, run the broadest practical project verification once. Prefer the full test suite plus typecheck when available.

Completion criterion: final verification has passed, or failures and unavailable checks are reported with the relevant output.

### 5. Review The Work

Use `/code-review` to review the completed work.

Completion criterion: review findings are fixed, intentionally deferred with explanation, or reported as blockers.
