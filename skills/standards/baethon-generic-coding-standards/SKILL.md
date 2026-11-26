---
name: baethon-generic-coding-standards
description: Language-agnostic standards for top-to-bottom control flow, side effects, and naming. Use when writing, modifying, planning, or reviewing code.
---

# Generic coding standards

## Scope

This skill owns how code reads, covering control flow, side effects, and naming. `focused-implementation` owns scope, abstraction, validation, and error handling. Language skills own syntax and framework idioms.

Apply these rules in this order:

1. The project's formatter, linter, and established conventions.
2. This reference.

Follow the formatter and linter config as you write, and run those tools once, when the work is complete.

Apply these rules only to code you create or materially modify. During review-only tasks, evaluate only the conventions this skill owns.

Tool choice is free. A loop, a pipeline, and a collection library are equally valid; pick whichever best serves the rules below.

## Read top to bottom

A reader follows each function from first line to last without holding pending branches in their head.

- Use guard clauses for the alternative path, so the main path stays at the top level.
- Treat 3+ levels of nesting (loops, conditions, callbacks) as a refactor signal. Extract the nested block into a named function.
- When a function performs 3+ distinct steps, such as fetching, transforming, and persisting, extract each step into a named function so the orchestrator reads as a summary.
- Place callers above the functions they call, so a file reads from summary to detail.
- Name intermediate values when calls nest more than two deep, such as `send(format(load(id)))`.
- Handle each condition in one place. Add a separate guard only when its behaviour differs, such as a different return, log, or exception.

```javascript
// Avoid
function remindOverdue(invoices) {
    for (const invoice of invoices) {
        if (!invoice.paid) {
            if (invoice.dueDate < Date.now()) {
                for (const contact of invoice.customer.contacts) {
                    mailer.send(contact.email, render(invoice));
                }
            }
        }
    }
}

// Preferred
function remindOverdue(invoices, now) {
    for (const invoice of overdueInvoices(invoices, now)) {
        sendReminder(invoice);
    }
}

function overdueInvoices(invoices, now) {
    return invoices.filter((invoice) => !invoice.paid && invoice.dueDate < now);
}

function sendReminder(invoice) {
    for (const contact of invoice.customer.contacts) {
        mailer.send(contact.email, render(invoice));
    }
}
```

## Keep side effects at the edges

A side effect is anything beyond returning a value, such as I/O, database writes, logging, or changing state the function does not own.

- Follow functional core, imperative shell. Keep calculations pure, and let the shell gather input, call the core, and apply the result.
- Pass the current time, random values, and configuration into a calculation as arguments.
- Return a new value instead of changing an argument or a captured variable.
- Follow command-query separation. A command may return what it created or changed, such as `createOrder(): Order`, and an API contract may require both, such as `pop()`.
- Name effectful functions with a verb that announces the effect, such as `save`, `send`, or `charge`. Keep effects in plain statements and loops, where the reader expects them, and keep `map`, `filter`, getters, and predicates pure.

Mutation of a value the function created itself, such as building a result array in a loop, stays fine. Mutating large structures in place is acceptable in performance-critical code, with a comment saying why.

## Naming

Choose names that explain the role of the value in the current code. Accept common conventions such as `i` for loop indexes, `T` for type parameters, and framework-standard names such as `req` and `res`. Prefer `customer`, `request`, or `configuration` over abbreviations.

A function name tells the caller whether the value can be absent:

- `get*` returns the value or throws when it is missing, such as `getUser(id): User`. Collection getters return an empty collection.
- `find*` returns `null`, `Optional`, or `Maybe` when the value legitimately may not exist, such as `findUser(email): User | null`.

## Layout

The formatter owns layout. Where it leaves braces unspecified in a braced language, write every `if` and loop with braces and a multi-line body.
