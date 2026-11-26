---
name: baethon-php-standards
description: PHP and Laravel conventions covering style precedence, PER/PSR, Eloquent queries, queues, commands, and tests. Use when writing, modifying, planning, or reviewing PHP code.
---

# PHP standards

## Scope

This skill owns PHP and Laravel conventions. `baethon-generic-coding-standards` owns control flow, side effects, and naming. `focused-implementation` owns scope and abstraction.

During review-only tasks, evaluate only the conventions this skill owns.

## Style precedence

Apply these in order:

1. The project's formatter and linter config, such as Pint, PHP-CS-Fixer, or PHP_CodeSniffer. A Pint install without `pint.json` still defines style through its default `laravel` preset.
2. The project's established conventions.
3. When the project defines no style, [PER Coding Style](https://www.php-fig.org/per/coding-style/) and PSR-4 autoloading.
4. This reference.

Follow the formatter and linter config as you write, and run those tools once, when the work is complete.

Apply these rules only to code you create or materially modify.

## Core checklist

- Use explicit type hints in typed PHP code.
- Use PascalCase for PHP enum cases.
- Use named arguments for boolean literals.

Use [PHP_REFERENCE.md](PHP_REFERENCE.md) for the details of these rules.

Use [LARAVEL_REFERENCE.md](LARAVEL_REFERENCE.md) when the project uses Laravel or the touched code is Laravel-specific.
