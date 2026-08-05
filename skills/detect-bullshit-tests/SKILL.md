---
name: detect-bullshit-tests
description: Find bullshit tests — tests that don't check behavior or assert truisms. Use when the user wants to audit tests on a branch, in a diff, or in files they point at, or asks to find worthless/fake/tautological tests.
model: opus
---

A **bullshit test** looks like coverage but proves nothing. It passes whether or not the code under test is correct, so it protects nothing and lies about the safety net. Two flavours:

- **No behavior checked** — the test exercises code but never asserts on the result that matters, or asserts something that holds regardless of the code being right.
- **Truism** — the assertion restates the language, the framework, or the test's own setup; it can never fail while those hold.

Your job: scan the target tests, flag every bullshit test with the reason, and end with a results list carrying a suggested action per finding.

## Scope

Default target: **test files changed on the current branch** vs the main branch. Get them with `git diff --name-only <main>...HEAD` filtered to test paths. If the user pointed at specific files, directories, or a different range, use that instead.

Read every targeted test in full — the setup decides whether an assertion is a truism, so an assertion line alone never settles it.

## What counts as bullshit

Judge each test against these classes. A test is bullshit if it matches one; quote the offending line in the finding.

- **Asserts a constant or literal against itself** — `assertEquals(5, 5)`, asserting a hard-coded expected against the same hard-coded value with no code between them.
- **Asserts on setup, not output** — checks that a value you just assigned still holds, or that a factory-made model has the attributes the factory set. The code under test never ran, or its result is never inspected.
- **Mock theater** — the only assertion is that a mock returned what you stubbed it to return, or that a mock was called with arguments you passed one line earlier. It tests the mock framework, not the code.
- **Vacuous assertion** — `assertTrue(true)`, `assertNotNull` on a freshly constructed object, `assertInstanceOf` on a return type the signature already guarantees, asserting a collection is an array.
- **Runs without asserting** — calls the method and asserts nothing (or only "no exception thrown" for code that has no throwing path). Green means "it didn't crash", not "it's correct".
- **Framework tautology** — asserts behavior owned by the framework/ORM/stdlib, not by this codebase: that a saved model has an id, that a getter returns the value passed to the setter, that a validation rule the framework ships works.
- **Snapshot/echo of the implementation** — the expected value is computed by copying the implementation's logic into the test, so both change together and the test can never catch a regression.

A test that mixes real assertions with a truism is **not** bullshit — flag only tests whose value rests entirely on the bullshit. Note weak-but-real tests separately as low priority; do not pad the list.

## Report

List findings most-worthless first. For each:

- **`file:line`** — the test method and the offending assertion.
- **Class** — which class above it matches.
- **Why** — one line: what makes it pass regardless of correctness.
- **Suggested action** — one of:
  - **Delete** — pure truism with no salvageable intent (`assertTrue(true)`, framework tautology).
  - **Rewrite to assert behavior** — the test targets real code but checks the wrong thing; name the behavior it should assert instead.
  - **Replace mock with real assertion** — mock theater where the real output is checkable.
  - **Merge/keep** — weak but real; leave it or fold it into a stronger test.

End with a one-line count: `N bullshit, M weak-but-real, across K files`. If nothing is bullshit, say so plainly rather than manufacturing findings.
