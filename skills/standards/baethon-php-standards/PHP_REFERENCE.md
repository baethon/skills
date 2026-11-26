# PHP reference

## Rules

### 1. Enum cases in PascalCase

PHP enum cases use PascalCase:

```php
// Good
SyncJobStatus::Active
SyncJobStatus::PendingActivation

// Bad
SyncJobStatus::Pending_Activation
```

Use `SCREAMING_SNAKE_CASE` only when the project's existing enums already use
it, such as `SyncJobStatus::PENDING_ACTIVATION`.

### 2. Use named arguments for boolean values

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
