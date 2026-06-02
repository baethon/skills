---
name: commit-coauthor-footer
description: |
  Ensures git commits only add the Agent Co-Authored-By footer when the configured git user email is not the agent email. Use when creating git commits or preparing commit messages.
---

# Commit Co-Author Footer

Conditionally add the Agent co-author footer to commit messages.

## Mandatory Trigger

Use this skill for every user request that results in `git commit`, after subject formatting and before creating the final commit message.

Do not skip this check, even when the commit body is short.

## Email Check

Before every commit, use the configured git user email:

!`git config --get user.email`

If the email is exactly `agent@nonhuman.work`, do nothing.

If the email is missing or different, apply the footer rules below.

## Footer

Use exactly:

`Co-Authored-By: Agent <agent@nonhuman.work>`

## Rules

1. Read the email value from the bash context expansion above.
2. If it is exactly `agent@nonhuman.work`, leave the commit message unchanged.
3. If it is missing or different, check whether the commit message already contains the exact footer line.
4. If present, do not add another copy.
5. If missing, append one blank line and the footer line.
6. If the commit body is empty, still apply this skill and decide explicitly whether the footer is required by the email check.

## Scope

- This skill only manages the co-author footer.
- It does not detect commit style.
- It does not format the subject line.
