---
name: baethon-php-standards
description: PHP and Laravel reference for syntax, naming, Eloquent, queues, commands, validation, and test conventions. Use when writing, modifying, planning, or reviewing PHP code. It governs PHP and Laravel conventions only.
---

# PHP standards

## Scope

This skill owns PHP and Laravel conventions. It does not decide feature scope, architecture, or whether the current behavior needs a new abstraction.

When `minimal-senior-code` also applies, that skill owns those implementation decisions. Do not add a class, layer, or dependency only to match an example in these references.

During review-only tasks, evaluate only the conventions this skill owns.

Use [PHP_REFERENCE.md](PHP_REFERENCE.md) for general PHP conventions.

Use [LARAVEL_REFERENCE.md](LARAVEL_REFERENCE.md) when the project uses Laravel or the touched code is Laravel-specific.

Apply these rules in this order:

1. Formatter output.
2. Established local conventions.
3. This reference.

Apply them only to code you create or materially modify.

## Core checklist

- Use explicit type hints in typed PHP code.
- Use `SCREAMING_SNAKE_CASE` for PHP enum cases.
- Use named arguments for boolean literals.
- For Laravel code, also apply the Laravel reference.

## Reference files

- [PHP_REFERENCE.md](PHP_REFERENCE.md): PHP-specific rules and examples.
- [LARAVEL_REFERENCE.md](LARAVEL_REFERENCE.md): Laravel-specific rules and examples.
