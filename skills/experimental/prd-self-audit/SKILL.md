---
name: prd-self-audit
description: Audit a PRD before implementation for internal contradictions, missing cross-cutting invariants, and concrete end-to-end walkthroughs that should be traced to surface module-seam bugs at design time. Non-interactive — produces a single report and modifies nothing. Use when the user wants to sanity-check a PRD before issuing it, mentions "audit the PRD", "check the PRD for contradictions", "what's missing in this PRD", or invokes `/prd-self-audit`.
---

# PRD Self-Audit

Run at PRD-time, BEFORE implementation begins. Purpose: catch the class of defects that are visible from PRD prose alone but routinely missed because reviewers re-read the PRD section-by-section, not whole. Cost: one careful read. Payoff: fewer module-seam bugs surfaced during review.

This skill produces a report. It does NOT edit the PRD, open issues, or interview the user. For interactive design grilling use `grill-with-docs`. For amending the PRD after the audit, the user edits inline or re-grills.

## Inputs

A PRD file path. If the PRD references ADRs, a `CONTEXT.md`, or schema migrations, read those too — contradictions often live in the gap between PRD prose and a referenced artifact.

## Process

Run three passes over the PRD, sequentially. Each pass benefits from the previous one being fresh in mind. Produce the report only at the end; do not stream partial findings.

### Pass 1 — Contradictions

Re-read the entire PRD looking for claims that conflict. Targets:

- **Prose vs prose** — one section says "single write path", another says "legacy endpoints stay in place."
- **Prose vs schema** — prose says "dangling is allowed", a referenced migration uses `nullOnDelete()`.
- **Prose vs ADR** — prose describes a strategy that an ADR has already superseded.
- **Stated invariant vs example flow** — an invariant claims atomicity but a walkthrough shows partial application.

Cite the exact line numbers or section headings on both sides. If a referenced artifact disagrees, name the artifact and the line.

**Severity gate.** Only flag a contradiction if the two sides would plausibly ship as **different code or different persisted state** — i.e. an implementer reading one side vs the other would build the feature differently, or the same code would behave differently at runtime. Skip:

- Copy-edit issues: typos, self-defeating sentences, ambiguous wording that has one obvious intended reading.
- Style nits: hardcoded strings where a named helper exists, prose that treats two cases as "identical" when the asymmetry is already captured by another finding, naming-convention deviations.
- Tone/structure: section ordering, missing headings, repetition.

These belong in normal code review, not a pre-implementation audit. If in doubt, ask: "would two competent implementers actually diverge here?" If no, drop it.

### Pass 2 — Missing invariants

List cross-cutting rules the PRD relies on but never names. These usually live at module seams. Targets:

- **Identity / ordering** — cursors, sequence numbers, causal chains.
- **Atomicity / rollback** — what is all-or-nothing, what is not.
- **Terminal states** — which response codes/states never recover (e.g. "422 is terminal").
- **Monotonicity** — things that only grow / never shrink / never reorder.
- **Single source of truth** — which side owns which field on conflict.

Propose **3–5** explicit invariants in the form "<rule>. Reason: <why violating it would corrupt data>." Aim for the minimum set that prevents seam bugs, not comprehensive coverage. If the PRD is small (one resource, one endpoint), the lower end is fine. Reviewers must be able to check each one directly against a diff later.

### Pass 3 — End-to-end walkthroughs

List **2–4** concrete scenarios that cross module boundaries. Pick the ones most likely to surface a real seam bug — do not pad to hit a count. Targets:

- **Crash / reopen** — user does X offline, app crashes, reopens, syncs.
- **Race** — action A is mid-flight when action B starts.
- **Failure across the seam** — validation fails server-side after the client optimistically applied.
- **Edge of stated scope** — interaction at the boundary of "out of scope". Does behaviour degrade gracefully?

Each walkthrough: 2–4 step sequence followed by a one-line probing question ("what does the cursor read at step 3?"). The PRD should imply an unambiguous answer — if it does not, that is the finding.

## Output

A single Markdown report, three sections, in pass order:

```markdown
# PRD Self-Audit: <PRD title>

## Contradictions
- **§<heading> (L<n>) vs §<heading> (L<m>)** — <one-line summary>
  - Side A: <quote>
  - Side B: <quote>

## Missing invariants
- <Invariant statement>. Reason: <one line>.

## End-to-end walkthroughs to trace
- **<Scenario name>**: <step 1> → <step 2> → <step 3>. Probing question: <…>
```

Hand the report to the user. Do NOT edit the PRD or open issues — that decision belongs to the user and downstream skills.

For a quality bar reference — depth, specificity, three-sided contradictions, probing-question shape — see [EXAMPLES.md](EXAMPLES.md).
