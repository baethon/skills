---
name: to-scenarios
description: Draft Gherkin-flavored test scenarios for a testable issue so `tdd` can execute them as approved spec without per-issue gates. Use when invoked by `/to-issues` for a testable slice, or when adding scenarios to an existing issue.
---

# To Scenarios

Draft executable-quality behavioral scenarios for an issue. The drafted `## Scenarios` block becomes the spec that the `tdd` skill consumes without further approval.

The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not.

## When this runs

- **Called by `to-issues`** for each testable slice after slice breakdown is approved but before publish. Returns the scenarios block to the caller.
- **Standalone** with an issue reference (number, URL, or path). Fetches the issue, drafts scenarios, edits the body to insert `## Scenarios` between `## What to build` and `## Definition of Done`.

## Process

### 1. Gather context

- **Delegated call:** read the slice description, parent plan/PRD, sibling slices, and dependencies from the conversation.
- **Standalone:** fetch the issue from the tracker. Read `## What to build`, any existing body sections, and dependencies in `## Blocked by`. If the issue references a parent plan/PRD, read it.

If the description is too ambiguous to draft scenarios from, do not invent — surface the ambiguity and stop.

### 2. Check testability

Draft scenarios only when the slice has behavior to verify. Use the Test vs Transform/Verify split:

<gets-scenarios>
- Functions with logic that transform input → output
- API endpoints with request/response handling
- Services that coordinate operations
- Validators with conditional rules
- State machines, workflows, pipelines
</gets-scenarios>

<skip-scenarios>
- Enums, constants
- Interfaces, type definitions, DTOs without methods
- Database migrations, config files, build configs (tsconfig, webpack, …)
- Namespace / file refactoring
- Documentation
- Pure UI / styling — verify manually
</skip-scenarios>

For non-testable slices: do not add a `## Scenarios` section. Verification belongs in `## Definition of Done` instead. Return to the caller (or exit, standalone) with that note.

### 3. Re-run guard (standalone only)

If the issue body already contains a `## Scenarios` section: stop and tell the user. Do not overwrite.

The user may override conversationally ("replace them", "add a scenario for X", "merge in this case"). Derive intent from chat and act accordingly. No flag, no prompt.

### 4. Draft scenarios

<coverage>
- **Happy path** — always include one scenario covering the primary success flow.
- **Positive variants** — include when meaningful input variation exists (input shapes, optional fields, multiple valid states).
- **Errors** — include when the slice has meaningful failure modes (invalid input, missing dependencies, external errors). Most slices have some.
- **Regression** — only for explicit bugfix slices. The regression scenario captures the previously-broken behavior.
</coverage>

<required-order>
When categories are present, scenarios appear in this fixed order:

1. Happy path
2. Positive variants
3. Errors
4. Regression
</required-order>

### 5. Output

- **Delegated:** return the `## Scenarios` block as text. The caller embeds it in the issue body before publishing.
- **Standalone:** edit the issue body via the tracker API. Insert `## Scenarios` between `## What to build` and `## Definition of Done`. Do not modify any other section.

## Scenario format

Each scenario is a markdown subsection with a descriptive title and Given/When/Then bullets:

```markdown
## Scenarios

### Scenario: <descriptive title — the behavioral claim this captures>

- **Given** <relevant precondition state>
- **When** <action the user or system performs>
- **Then** <observable outcome>
- **And** <additional outcome>   (optional, repeat as needed)
```

<style-rules>
- **Behavior language only.** Describe what the user does, what the system observes, what changes. Do **not** name specific classes, functions, files, or methods — those are implementation decisions the executor will make from the scenarios.
- **Concrete preconditions.** "A cart with one in-stock item" not "a cart". Preconditions must be set-up-able in a test.
- **Observable outcomes.** `Then` describes what an outside observer can see (response, side effect, state change). Not "the service calls X" — that's implementation.
- **One behavioral claim per scenario.** If a scenario describes two unrelated behaviors, split it.
- **Titles read as claims.** Good: "Checkout fails when an item is out of stock." Bad: "test_checkout_oos" / "Checkout" / "Test 1".
- **One assertion per `Then` when reasonable.** Chain related outcomes with `And`.
- **Parameterized cases.** For multiple equivalent invalid inputs, a single `### Scenario:` with a "Given each of:" bullet list is acceptable. Don't multiply scenarios that only differ in trivial input shape.
</style-rules>

## Example

For a testable slice:

> **What to build:** Add a checkout endpoint that creates an order for the user's cart and decrements inventory.

The drafted block:

```markdown
## Scenarios

### Scenario: User checks out a valid cart

- **Given** a cart containing at least one in-stock item
- **When** the user submits checkout with valid payment details
- **Then** an order is created for the user
- **And** inventory is decremented by the cart quantities
- **And** the cart is cleared

### Scenario: Checkout supports a multi-item cart

- **Given** a cart containing multiple in-stock items
- **When** the user submits checkout with valid payment details
- **Then** a single order is created containing all items
- **And** inventory is decremented per item

### Scenario: Checkout fails when an item is out of stock

- **Given** a cart containing an item that has since gone out of stock
- **When** the user submits checkout
- **Then** the order is not created
- **And** the user is told which items are unavailable
- **And** inventory is unchanged

### Scenario: Checkout fails when payment is declined

- **Given** a valid cart
- **When** the user submits checkout with payment that the processor declines
- **Then** the order is not created
- **And** inventory is unchanged
- **And** the user is told the payment was declined
```

## Relationship to other skills

- **`to-issues`** invokes `to-scenarios` for testable slices after slice breakdown is approved, before publish. Non-testable slices get verification steps in `## Definition of Done` instead, not scenarios.
- **`tdd`** consumes the `## Scenarios` block from the issue body. When present, it treats the scenarios as the approved spec and skips its Phase 1 user gates. Scope rule applied at execution time: scenarios are the minimum; the executor may extend with additional scenarios for edge cases discovered during implementation, noted in the PR description. When the block is absent, `tdd` falls back to its existing interactive Phase 1.
