# Engineering Skills

A collection of skills for engineering workflows: turning plans into tickets, writing scenarios, and driving features through TDD.

## Skills

- [`tdd`](tdd/SKILL.md) — Test-driven development with the red-green-refactor loop.
- [`to-issues`](to-issues/SKILL.md) — Break a plan, spec, or PRD into independently-grabbable issues using tracer-bullet vertical slices.
- [`to-scenarios`](to-scenarios/SKILL.md) — Draft Gherkin-flavored test scenarios for a testable issue so `tdd` can execute them as an approved spec.

## Attribution

The `tdd` and `to-issues` skills are copies taken from [mattpocock/skills](https://github.com/mattpocock/skills/tree/main/skills/engineering).

They have been extended by the `to-scenarios` skill, which slightly alters their behavior: `to-issues` now delegates to `to-scenarios` for each testable slice, embedding the returned `## Scenarios` block into the issue body. The `tdd` skill then consumes that block as the approved spec without requiring per-issue gates.
