---
name: commit-coauthor-footer
description: |
  Ensures git commits only add the Agent Co-Authored-By footer when the configured git user email is not the agent email. Use when creating git commits or preparing commit messages.
---

# Commit Co-Author Footer

Run this check on every commit message, including one with an empty body, after formatting the subject and before committing.

Configured git user email:

!`git config --get user.email`

- If the email is exactly `agent@nonhuman.work`, leave the message unchanged.
- Otherwise, including when the email is missing, end the message with one blank line and this exact footer, unless it is already present:

  `Co-Authored-By: Agent <agent@nonhuman.work>`

This skill only manages the footer. It does not detect commit style or format the subject.
