# PHP Reference

## Rules

### 1. Enum Cases in SCREAMING_SNAKE_CASE

PHP Enum cases must use uppercase snake_case:

```php
// Good
SyncJobStatus::ACTIVE
SyncJobStatus::PENDING_ACTIVATION

// Bad
SyncJobStatus::Active
SyncJobStatus::PendingActivation
SyncJobStatus::Pending_Activation
```

### 2. Use Named Arguments for Boolean Values

When passing a boolean literal (`true` or `false`) to a function or method, use
named arguments so the intent is explicit.

```php
// Good
foo(showBar: true);
publish(force: false);

// Bad
foo(true);
publish(false);
```

If the boolean parameter is in the middle of the parameter list, this rule still
applies. In PHP, all arguments after the first named argument must also be named.

```php
// Good
foo($title, showBar: true, maxItems: 10);

// Bad
foo($title, true, 10);
```

If naming the remaining arguments feels too verbose, redesign the API instead of
using positional booleans:

- Move boolean parameters to the end and give them sensible defaults.
- Replace boolean flags with explicit methods.
- Use enums or dedicated option objects/arrays for multi-mode behavior.
