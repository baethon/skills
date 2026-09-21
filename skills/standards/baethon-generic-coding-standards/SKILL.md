---
name: baethon-generic-coding-standards
description: Language-agnostic reference for names, control-flow style, collection expressions, and visible side effects. Use when writing, modifying, planning, or reviewing code. It governs style only.
---

# Generic coding standards

## Scope

This skill owns expression-level style. It does not decide feature scope, architecture, abstraction, validation placement, error strategy, or test scope.

When `minimal-senior-code` also applies, that skill owns those implementation decisions. This skill supplies the language-agnostic conventions used to express them.

During review-only tasks, evaluate only the conventions this skill owns.

Apply these rules in this order:

1. Formatter output.
2. Established local conventions.
3. This reference.

Apply them only to code you create or materially modify.

## Naming

Choose names that explain the role of the value in the current code.

Accept common conventions such as `i`, `j`, or `k` for small loop indexes, `T` or `K` for generic type parameters, and framework-standard names such as `req` and `res` in Node.js handlers.

Do not shorten names just to reduce typing. Prefer `customer`, `request`, `response`, or `configuration` over vague abbreviations when the longer name makes the code easier to read.

## Collection expressions

Use native list or array transformations when they express filtering, mapping, reducing, grouping, or sorting more clearly than a loop and fit the local style.

Use a loop when it makes branching, early exits, or state changes easier to follow. Do not force a chain or introduce intermediate collections only to avoid a loop.

```javascript
const activeCustomerNames = customers
    .filter((customer) => customer.isActive)
    .map((customer) => customer.name);
```

## Control flow

In languages with braced control flow, always write `if` statements with braces and a multi-line body.

```javascript
// Preferred
if (isValid) {
    return value;
}
```

```javascript
// Avoid
if (isValid) return value;
```

In languages with braced control flow, always write `for`, `foreach`, `while`, and similar loops with braces and a multi-line body.

```javascript
// Preferred
for (const customer of customers) {
    sendEmail(customer);
}
```

```javascript
// Avoid
for (const customer of customers) sendEmail(customer);
```

## Visible side effects

Prefer returning a value over mutating captured variables, input objects, or shared state when both forms are equally direct.

Keep deliberate mutation when it matches the project or API, avoids unnecessary copying, or makes the flow easier to read. Make the mutation visible at the call site rather than hiding it inside a callback.
