---
name: baethon-generic-coding-standards
description: Generic coding standards for clear names, simple solutions, and low side-effect code. Use when writing, modifying, planning, or reviewing code in any language.
---

# Generic Coding Standards

## How To Apply

Apply these standards when writing, modifying, planning, or reviewing code in any language.

Apply them to code you create or materially modify. Do not refactor unrelated code only to satisfy these standards.

Formatter output wins over manual formatting preferences. Follow existing local patterns unless intentionally refactoring.

## Core Checklist

- Use descriptive names. Avoid one-letter names and abbreviations unless they are common in the language, framework, or domain.
- Prefer the simplest readable solution that satisfies the task. Avoid clever or fancy approaches unless they are required to meet the goal.
- Prefer functions and callbacks without side effects. Return new values instead of mutating captured variables, input objects, or shared state.
- Allow mutation when avoiding it would make the solution unnecessarily complicated, when an API requires it, or when the existing local pattern clearly uses it.
- Never use one-line `if` statements. Always use braces, put the body on the next line, and put the closing brace on its own line.
- Prefer native list transformation methods over manual loops when filtering, mapping, reducing, or chaining multiple list operations.

## Naming

Choose names that explain the role of the value in the current code.

Accept common conventions such as `i`, `j`, or `k` for small loop indexes, `T` or `K` for generic type parameters, and framework-standard names such as `req` and `res` in Node.js handlers.

Do not shorten names just to reduce typing. Prefer `customer`, `request`, `response`, or `configuration` over vague abbreviations when the longer name makes the code easier to read.

## Simplicity

Start with ordinary control flow and plain data structures. Reach for advanced abstractions, dense chaining, metaprogramming, or highly generic helpers only when they remove real complexity from the task.

Keep the local solution understandable before optimizing for reuse. Extract shared helpers after the repeated shape is clear.

## List Transformations

When the language or framework provides readable list or array transformation methods, prefer them over manual `for` or `foreach` loops for filtering, mapping, reducing, grouping, or sorting.

Chain transformations when the code performs multiple list operations in sequence.

```javascript
const activeCustomerNames = customers
    .filter((customer) => customer.isActive)
    .map((customer) => customer.name);
```

Avoid separate loops that manually build intermediate lists when native transformations express the same pipeline clearly.

Use a loop when it is simpler than the equivalent chain, the language and framework lack readable list helpers, or the operation depends on control flow that would make chaining awkward.

## Conditions

Always write `if` statements with braces and a multi-line body.

```javascript
if (isValid) {
    return value;
}
```

Do not use one-line conditions, even for short branches.

```javascript
if (isValid) return value;
```

## Side Effects

Prefer pure transformations for collection operations, callbacks, and helper functions.

Avoid callbacks that mutate variables from an outer scope when `map`, `filter`, `reduce`, or a straightforward loop can return the result directly.

Use mutation deliberately when it is the clearest option for the codebase, the underlying API is mutation-based, or a pure rewrite would obscure the intent.
