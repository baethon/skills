# PHP reference

## Rules

### 1. Enum cases in SCREAMING_SNAKE_CASE

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

When current requirements need more than a binary choice, model that domain
concept with the PHP construct that fits the surrounding code:

- Replace boolean flags with explicit methods.
- Use an enum for a closed set of modes.
- Use an existing project options pattern when several independent choices travel together.

Do not redesign an API merely because it accepts a boolean.
