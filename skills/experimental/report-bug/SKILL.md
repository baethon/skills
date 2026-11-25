---
name: report-bug
description: Write a bug report that a cold reader understands without this session. Use when filing a defect found in session work, such as an audit finding, a review comment, or a bug found mid-task.
---

# Report bug

The reader is a teammate who was not in this session and opens the issue three weeks from now. Call them the **cold reader**. They see only the issue, its comments, and the repo. The session, the conversation, and any report you produced in it are gone for them.

## Steps

1. **Gather.** For each issue, collect what the cold reader needs that exists only in this session, such as an audit excerpt, command output, or reproduction steps. When there is any, save it as `<n>.source.md` in the scratchpad. Record the commit SHA with `git rev-parse HEAD` when `git branch -r --contains HEAD` lists a remote branch; otherwise record no SHA. Done when every claim you plan to make traces to the repo or to a source file.
2. **Draft** each issue as `<n>.md` in the scratchpad, in the format below.
3. **Cold read.** Dispatch a fresh subagent (not a fork) for the whole batch with the prompt below and the draft and source paths. Done when it reports no gaps for every draft and its two sentences match the problem you meant.
4. **Fix** each draft that failed and run the cold read again on those drafts only, with a new fresh subagent. After two fix rounds, show the remaining gaps to the user and ask how to proceed.
5. **File.** File blockers before the issues they block. Create each issue with its `Title:` line as the title and the rest as the body, and link each dependent issue to its blocker with the tracker's blocked-by relation. When it has a source file, post that file as the issue's first comment. Done when every issue is filed, linked, and every source file is posted.

## Format

```markdown
Title: <title>

## Problem

## Why it matters

## Details

> Notes for the agent doing the work.

Commit: <sha>
```

Drop the `Commit:` line when Gather recorded no SHA.

The part above `## Details` is for a human deciding whether and when to do the work:

- **Title** names what is wrong in the repo's terms, in under 70 characters, such as "`report-bug` format has no title line".
- **Problem** says what is wrong and how someone would notice it, such as a failing command, a user-visible bug, or a confusing API.
- **Why it matters** says what happens if nobody fixes it.
- Describe the problem only. The fix, its effort, and its priority belong to whoever picks up the issue.
- Write plain English: short sentences, active voice, one idea per sentence.
- Use one term per concept. Take the name the repo uses and keep it.
- Keep it short. Cut anything the reader does not need to decide.
- Every reference points at something the cold reader can open: a file, a URL, an issue number, or the source comment. Name the dependency explicitly, such as "Blocked by #312", or by draft path when the blocker is in this batch.

The `## Details` section is for the agent doing the work. It may be dense: file:line references at the commit (symbol names alone when there is no commit), exact symbol and rule names, and commands that reproduce the problem.

## Cold-read prompt

```
You are a developer on this repository. You have never seen these issue drafts or the work that produced them. Each draft `<n>.md` may have a `<n>.source.md` that will be posted as its first comment.

For each draft:
1. Explain in two sentences what the problem is and why it matters.
2. List every reference or claim you could not follow or verify from the draft, its source file, and the repository. A dependency named by another draft's path in this batch counts as resolved.

Reply with, per draft: the path, your two sentences, and the gap list, or "no gaps".
```
