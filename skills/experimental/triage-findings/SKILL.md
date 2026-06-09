---
name: triage-findings
description: Triage findings from a `prd-self-audit` report or a `review` report into four buckets — amend PRD inline / re-grill / new issue / no-op — and name the downstream skill or edit for each. Non-interactive — produces a single Markdown report, applies no edits, opens no issues, runs no other skills. Use when the user wants to decide what to do with an audit or review report, mentions "triage these findings", "classify these review items", "what do I do with this audit", or invokes `/triage-findings`.
---

# Triage Findings

Bridge between a findings report (from `prd-self-audit` pre-implementation, or a code `review` post-implementation) and the right downstream action. For each finding, classify into one of four buckets and name what happens next.

This skill produces a report. It does NOT edit the PRD, open issues, or invoke `grill-with-docs` / `to-issues`. Those are downstream decisions for the user.

## Inputs

1. **A findings report** — Markdown. Either an audit report (sections: Contradictions / Missing invariants / End-to-end walkthroughs) or a review report (any structure; bug-style findings against a branch). The shape varies; treat each bullet/heading as one finding.
2. **A PRD path** — the document each finding is being judged against.

If the report references ADRs, migrations, accepted follow-up issues, or a `CONTEXT.md`, read those too. The "PRD is right / PRD is wrong / design moved" call often hinges on what an artifact next to the PRD already says.

## Process

Read the report and the PRD end-to-end first. Then, for each finding, apply this rule:

> Would a fresh reader of the PRD now reach a different conclusion than the code (or the report's claim)? If yes → **amend**. If the design itself has moved → **re-grill** that section only. If the PRD is right and the code is wrong → **new issue**. If neither has moved and the PRD already implies the answer → **no-op**.

Bucket each finding into exactly one. Do not stream partial output; produce the report only at the end.

### Amend PRD inline

**Trigger**: PRD contradicts itself, contradicts a referenced artifact (ADR, migration, schema), or contradicts an accepted issue. The fix is mechanical — adjust prose so the PRD reads coherently again.

**For each finding in this bucket**: include line numbers + before-text + after-text as text. Do NOT apply the edit. If the right fix is ambiguous (e.g., two prose sides each have downstream consequences), say so and list the options so the user picks.

### Re-grill

**Trigger**: the design itself has shifted since the PRD was written — an accepted issue rewrites a flow, an ADR supersedes a strategy, a walkthrough's probing question has no answer the PRD implies. The change is too big for inline prose edits; the affected section needs a fresh design pass.

**For each finding in this bucket**: name the PRD section and the scope of the pass ("re-grill §Sync cycle: drain-then-pull replaced the 60s timer in Issue 26"). Stop there. The user runs `grill-with-docs` at their discretion.

### New issue

**Trigger**: the PRD is already correct; the code does not match it (post-implementation), or the finding exposes a build-out gap the PRD specifies but no issue has covered.

**For each finding in this bucket**: a one-paragraph brief suitable to hand to `to-issues` — what's broken, where it lives in the PRD, what "done" looks like. Do NOT open the issue.

### No-op

**Trigger**: the finding is already PRD-compliant. Reviewer raised it in error, or the audit's probing question already has an unambiguous PRD answer.

**For each finding in this bucket**: one-line rationale ("PRD §X line N already states this; finding misread the section"). Note it so future audits/reviews don't re-raise.

## Bucket selection notes

- **Contradictions** almost always go to "amend inline" — unless one side reflects a design shift the PRD never absorbed, which is "re-grill".
- **Missing invariants** split. If the invariant is a clarification the PRD's existing design implies → amend inline (add the invariant). If naming the invariant forces a design choice never made → re-grill.
- **Walkthroughs**: if the probing question has a clear PRD answer → no-op. If the answer needs to be added to PRD prose → amend inline. If it points at an implementation gap → new issue.
- **Review findings**: branch diverges because PRD is now wrong → amend inline. Branch is buggy → new issue. Branch reflects a deliberate design shift never absorbed back → re-grill.
- **Cross-finding resolution**: if an amend-inline edit (typically adding an invariant) makes another finding's probing question unambiguous, mark that other finding as no-op and reference the amend explicitly in the rationale. Avoids duplicate edits and signals to the reader why the no-op is no-op.

## Output

A single Markdown report. One section per bucket, in this order. Empty buckets stay in the document with "(none)".

```markdown
# Triage: <report title> against <PRD path>

## Amend PRD inline
- **<finding label>** — <one-line rationale>
  - Edit at L<n>: before: "<quote>" / after: "<quote>"

## Re-grill
- **<finding label>** — <one-line rationale>
  - Section to re-grill: <§heading> — <scope of the pass>

## New issue
- **<finding label>** — <one-line rationale>
  - Brief: <one paragraph for `to-issues`>

## No-op
- **<finding label>** — <one-line rationale>
```

Hand the report to the user. Do NOT invoke `grill-with-docs`, `to-issues`, or any edit — the user decides whether and when to act on each finding.

For sample triages across all four buckets, see [EXAMPLES.md](EXAMPLES.md).
