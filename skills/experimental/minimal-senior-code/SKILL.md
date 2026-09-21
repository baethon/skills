---
name: minimal-senior-code
description: Use when planning an implementation, writing, modifying, or refactoring code to keep scope minimal, validate at trust boundaries, and handle failures explicitly. Not for review-only tasks; language and framework style come from their own standards.
---

# Minimal Senior Code

Plan or write the smallest clear implementation that satisfies the task and the current codebase. Do not build for hypothetical future requirements.

## Precedence

When these rules conflict, prefer:

1. Explicit behavior, acceptance criteria, and required correctness/security/data-integrity constraints.
2. Existing project conventions and architecture.
3. The minimality heuristics below.

## Relationship to coding standards

This skill owns implementation scope, abstraction, trust boundaries, failure behavior, and the tests needed for changed behavior. Language and framework standards own syntax, naming, formatting, and established framework idioms.

A style preference does not by itself justify a new abstraction, dependency, configuration option, defensive branch, or unrelated refactor.

## Keep the implementation direct

- Implement only current requirements. Do not add options, extension points, flags, wrappers, registries, or generic parameters without a current need.
- Prefer direct calls and straightforward control flow over indirection.
- Do not generalize for hypothetical reuse. Extract a function or abstraction when it is reused now, isolates a coherent responsibility, or materially improves readability.
- If inlining an abstraction makes the code easier to understand without losing required semantics, inline it.
- Prefer self-explanatory code. Comments should add context, constraints, or rationale rather than restate obvious operations.

## Keep data shapes local until naming helps

- For a one-off data shape, keep the type or schema close to where it is used, using the language and project's normal idiom.
- Introduce a named type when it is reused, represents invariants or behavior, or forms a meaningful parsing/public boundary.
- Do not create classes or immutable wrappers only to make a shape look more formal. Follow the project's existing type and mutability conventions.

## Validate at trust boundaries

Treat a boundary as the point where untrusted or external data becomes trusted program data: HTTP/CLI input, environment or config, files, messages, third-party APIs, and similar inputs. Persistence reads need extra validation only when the database/schema does not guarantee the assumptions the code relies on.

- Parse and validate once, as early as practical, using tooling already present in the project.
- Reject invalid input instead of silently substituting defaults.
- Inside the trusted core, rely on validated types and invariants; do not repeat the same checks.
- Do not make values optional or nullable when the valid state does not allow absence.

Keep required runtime protections where applicable: authentication/authorization at the relevant boundary, parameterized queries, correct output escaping, and idempotency for retryable external side effects.

Use a database transaction only when operations must commit or roll back as one atomic unit, or when required for isolation or locking. Keep it short; do not include external side effects. When consistency across database changes and external side effects matters, follow the project's existing idempotency, outbox, or equivalent pattern.

## Errors and dependencies

- Fail fast on unexpected errors and broken internal invariants. Do not hide failure behind `0`, `""`, `[]`, `None`, or similar fallbacks.
- Catch only specific errors the code can meaningfully handle. Do not catch broad or root exception types merely to log, default, continue, or attempt generic recovery. Broad catches are reserved for deliberate top-level failure boundaries and must not resume normal execution.
- Do not rely on disableable assertions for required runtime validation or security checks.
- Prefer existing dependencies and patterns. Add a new dependency only when it has a clear current benefit; call it out when you do.
- If an API or option may depend on the installed library version, verify it from the project or documentation when possible.

## Keep changes focused and test behavior

- Avoid unrelated refactors while changing behavior. Small enabling cleanup is fine when it directly supports the requested change.
- When a test harness exists, add or update tests for changed behavior and rejected boundary input. For bug fixes, prefer a regression test when practical.
- Test observable behavior, not private implementation details or internal call structure.
- Never special-case implementation logic only to satisfy known test inputs.

## Before presenting the plan or code

Check that the solution has no speculative abstraction or configuration, validates untrusted data once at the right boundary, preserves required security/integrity checks, follows project conventions, and contains only tests and code needed for the requested behavior.

If you intentionally omit something a reviewer would reasonably expect, mention that omission briefly. Otherwise, do not add a ritual caveat.
