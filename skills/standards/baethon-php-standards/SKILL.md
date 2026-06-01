---
name: baethon-php-standards
description: PHP and Laravel coding reference for readability, style, tests, Eloquent, queues, commands, validation, and API conventions. Use when writing, modifying, planning, or reviewing PHP code, including Laravel application code.
---

# PHP Standards

## How To Apply

Apply these standards when writing, modifying, planning, or reviewing PHP code.

Use [PHP_REFERENCE.md](PHP_REFERENCE.md) for general PHP conventions.

Use [LARAVEL_REFERENCE.md](LARAVEL_REFERENCE.md) when the project uses Laravel or the touched code is Laravel-specific.

Apply these standards to code you create or materially modify. Do not refactor unrelated code only to satisfy these standards.

Formatter output wins over manual formatting preferences. Follow existing local patterns unless intentionally refactoring.

## Core Checklist

- Prefer readable, explicit code over cleverness.
- Use explicit type hints in typed PHP code.
- Use `SCREAMING_SNAKE_CASE` for PHP enum cases.
- Use named arguments for boolean literals.
- Redesign awkward positional boolean APIs with explicit methods, enums, or options.
- For Laravel code, also apply the Laravel reference.

## Reference Files

- [PHP_REFERENCE.md](PHP_REFERENCE.md): PHP-specific rules and examples.
- [LARAVEL_REFERENCE.md](LARAVEL_REFERENCE.md): Laravel-specific rules and examples.
