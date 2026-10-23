---
name: baethon-deslop
description: Deslop a diff by removing unnecessary ceremony and correcting coding-standard drift. Use when asked to clean up AI-generated code or simplify an overengineered change.
---

# Deslop

Remove code that adds ceremony without adding meaning. Optimize for readability, not line count.

## Options

Recognize `--auto` anywhere in the skill arguments; use the remaining arguments to determine scope. With `--auto`, complete cleanup, verification, and commit before reporting, without asking for confirmation. Otherwise, apply the cleanup and report without committing.

## 1. Fix the scope

Use the user's files or comparison base. Otherwise, compare against the merge-base with the repository's default branch and include staged and unstaged changes.

Identify every changed file in scope. Read its changes and enough surrounding code to establish the contracts and local conventions they rely on.

In `--auto` mode, inspect existing staged and unstaged work before editing so the cleanup commit can isolate this run's changes.

## 2. Load the rules

- Load `baethon-generic-coding-standards` for naming, control flow, collection expressions, and visible side effects.
- For PHP, load `baethon-php-standards` and its applicable references for PHP and Laravel conventions.
- Load `minimal-senior-code` for abstraction, validation, failure behavior, and test scope.

Use these references as the source of truth, including their precedence rules.

## 3. Make each part earn its place

Review every changed file against the applicable rules. For each comment, abstraction, defensive branch, fallback, or intermediate value that looks unnecessary, establish what purpose it serves and whether a more direct expression preserves that purpose.

Apply the smallest clear simplification. Keep useful boundaries, required protections, and deliberate framework idioms. Correct standards drift in the changed code without expanding into an adjacent style migration.

Preserve observable behavior and public contracts, including failure behavior. Report suspected bugs or behavior-changing simplifications separately unless the user authorized those fixes.

Finish when every changed file has been reviewed and each identified candidate has either been simplified, retained for a concrete purpose, or left as a finding requiring a behavior change. A clean diff may need no edits.

## 4. Verify

Run the relevant formatter and focused checks using the project's existing tooling. Review the final diff for accidental behavior changes and scope creep; resolve any introduced failures before finishing.

## 5. Commit (`--auto` only)

After verification, inspect `git status`, `git diff`, and `git log --oneline -10`. Stage and commit only this run's edits, excluding unrelated work even if already staged. Follow the repository's commit style and load `commit-coauthor-footer` before preparing the commit message. If this run produced no changes, skip the commit.

## 6. Report

Summarize the cleanup and verification in 1–3 sentences. Mention checks that could not run and findings that need the user's attention. In `--auto` mode, include the commit hash or explain why the commit could not complete; state when no changes were needed.
