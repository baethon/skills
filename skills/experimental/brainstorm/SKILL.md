---
name: brainstorm
description: "Brainstorm a good-enough solution direction for a problem through grilling, numbered breadcrumbs, keep/kill/mutate feedback, and final distillation."
disable-model-invocation: true
---

# Brainstorm

Use this when the user wants to explore how to approach a problem, not implement it, write a spec, or fully solve every detail.

The goal is a good-enough solution direction that can later become a spec, ticket, plan, or implementation. Stop before that downstream work starts.

## Shape

`minimum viable grilling -> numbered breadcrumbs -> keep/kill/mutate/park -> deepen -> converge -> distill`

## Process

### 1. Minimum Viable Grilling

Use `/grilling` to clarify the problem only until there is enough context to offer useful starting points.

Ask for:

- the problem to solve
- what outcome would count as useful
- what has already been tried or rejected
- hard constraints and non-goals
- who has to live with the solution

Ask this preference question once:

> What would make this solution bad?

If the user does not know, offer concrete failure modes instead of abstract preference labels:

```text
If you do not know yet, react to these:

[1] It solves the problem but is too complex to explain.
[2] It works once but is hard to repeat.
[3] It depends too much on one person's judgment.
[4] It is technically correct but awkward to use.
[5] It is cheap now but expensive later.
[6] It optimizes the wrong problem.
```

Completion criterion: you can state the problem, the useful outcome, any hard constraints, and at least one way the solution could be bad. If the user cannot answer some parts, proceed and treat the unknowns as open risks.

### 2. Breadcrumbs

Switch out of grilling mode into collaborative synthesis.

Before the first breadcrumb round, remind the user how to respond:

```text
Use these operations by number:

Keep [n]: this part is promising.
Kill [n]: drop this direction.
Mutate [n]: change this part and continue.
Park [n]: preserve this idea, but keep it out of the main line for now.
```

Offer 3 to 6 numbered breadcrumbs. A breadcrumb is a rough solution seed, angle, metaphor, pattern, tactic, or partial approach. It is not a polished proposal.

Rules:

- number every breadcrumb with stable labels like `[1]`, `[2]`, `[3]`
- keep each breadcrumb short enough to react to quickly
- make the options meaningfully different
- include one mildly weird or lateral option when it could reveal a useful angle
- do not ask the user to choose a final answer yet

Completion criterion: the user has numbered options they can keep, kill, mutate, or park.

### 3. Keep, Kill, Mutate, Park

Ask the user to respond by number:

```text
Keep [n]: this part is promising.
Kill [n]: drop this direction.
Mutate [n]: change this part and continue.
Park [n]: preserve this idea, but keep it out of the main line for now.
```

Accept informal feedback too, but translate it into keep, kill, mutate, or park before continuing.

Maintain lineage across rounds:

- kept ideas keep their original number when possible
- mutated ideas get suffixes like `[3a]`, `[3b]`
- new ideas get the next unused number
- killed ideas do not reappear unless the user asks for them

Put promising-but-secondary ideas in a parking lot instead of letting them derail the main line.

Completion criterion: every live breadcrumb is either kept, mutated, parked, or killed.

### 4. Deepen

Build on the surviving ideas. Raise fidelity one step at a time:

- combine compatible ideas
- name tradeoffs
- test the direction against the failure modes from step 1
- surface one or two unresolved questions that matter now
- introduce new breadcrumbs only when they unlock a better direction

Do not turn the session into a full specification. Avoid implementation steps unless they are necessary to judge the approach.

Completion criterion: there is a coherent candidate direction, or the current direction has failed and needs another breadcrumb round.

### 5. Converge

Converge when the user has a solution direction they could hand to a later spec-writing, ticketing, planning, or implementation process.

Do not chase every tiny detail. Push unresolved details into the final output as open questions or deferred decisions.

Completion criterion: the solution is good enough to explain, defend, and continue later.

## Final Output

End with a distilled solution, not a spec.

Use this structure:

```markdown
## Distilled Solution

<one paragraph summary>

## Core Approach

- <main idea>
- <supporting idea>
- <important boundary>

## Why This Fits

- <reason tied to the problem>
- <reason tied to constraints or failure modes>

## Tradeoffs

- <accepted tradeoff>
- <risk or cost>

## Open Questions

- <question intentionally left for later>

## Parking Lot

- <secondary idea worth preserving, if any>
```

If the user asks to continue into specs, tickets, or implementation, stop this skill and suggest the appropriate downstream skill.
