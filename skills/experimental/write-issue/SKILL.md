---
name: write-issue
description: Write a GitHub issue that a cold reader understands without this session. Use when filing an issue from session work, such as audit findings, review comments, or a bug found mid-task. When another skill defines the issue format, such as `to-tickets` or `to-spec`, follow that skill instead.
---

# Write issue

The reader is a teammate who was not in this session and opens the issue three weeks from now. Call them the **cold reader**. They see only the issue, its comments, and the repo. The session, the conversation, and any report you produced in it are gone for them.

## Steps

1. **Gather.** For each issue, collect what the cold reader needs that exists only in this session, such as an audit excerpt, command output, or the reasoning behind a recommendation. Save it as `<n>.source.md` in the scratchpad. Record the commit SHA with `git rev-parse HEAD`. Done when every claim you plan to make traces to the repo at that SHA or to a source file.
2. **Draft** each issue as `<n>.md` in the scratchpad, in the format below.
3. **Cold read.** Dispatch one subagent for the whole batch with the prompt below and the draft and source paths. Done when it reports no gaps for every draft.
4. **Fix** each draft with gaps and run the cold read again on those drafts only.
5. **File.** Create each issue. When it has a source file, post that file as the issue's first comment. Done when every issue is filed and every source file is posted.

## Format

```markdown
## Problem

## Why it matters

## Recommendation

## Details

> Notes for the agent doing the work.

Commit: <sha>
```

The part above `## Details` is for a human deciding whether and when to do the work:

- **Problem** says what is wrong and how someone would notice it, such as a failing command, a user-visible bug, or a confusing API.
- **Why it matters** says what happens if nobody fixes it.
- **Recommendation** says fix, defer, or drop. Add the blast radius (what the change touches) and whether it is a one-way or two-way door (hard or easy to undo). Both are quick estimates from what you already know.
- Write plain English: short sentences, active voice, one idea per sentence.
- Use one term per concept. Take the name the repo uses and keep it.
- Keep it short. Cut anything the reader does not need to decide.
- Every reference points at something the cold reader can open: a file, a URL, an issue number, or the source comment. Name the dependency explicitly, such as "Blocked by #312".

The `## Details` section is for the agent doing the work. It may be dense: file:line references at the commit, exact symbol and rule names, commands that verify the fix, and a "Done when" checklist.

## Cold-read prompt

```
You are a developer on this repository. You have never seen these issue drafts or the work that produced them. Each draft `<n>.md` may have a `<n>.source.md` that will be posted as its first comment.

For each draft:
1. Explain in two sentences what the problem is and why it matters.
2. List every reference or claim you could not follow or verify from the draft, its source file, and the repository.

Reply with, per draft: the path, your two sentences, and the gap list, or "no gaps".
```
