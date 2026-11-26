# Laravel reference

## Rules

### 1. Namespace commands by prefix

Artisan commands go in subdirectories matching their prefix:

```
sync:resume   -> App\Console\Commands\Sync\ResumeCommand.php
users:activate -> App\Console\Commands\Users\ActivateCommand.php
```

### 2. Use helper functions for jobs and events

Use helper functions instead of static dispatch:

```php
// Good
dispatch(new ProcessOrder($order));
event(new UserCreated($user));

// Bad
ProcessOrder::dispatch($order);
UserCreated::dispatch($user);
```

### 3. Use progress bars for interactive batch operations

Use a progress bar when an interactive command processes enough items that visible progress helps the operator. Do not add one to a short or non-interactive command.

```php
$progress = $this->output->createProgressBar($total);

foreach ($users->lazy() as $user) {
    $this->processUser($user);
    $progress->advance();
}

$progress->finish();
```

### 4. Commands must log start and finish

All commands should output when they start and finish, even CRON scripts:

```php
public function handle(): void
{
    $this->info('Starting user sync...');

    // ... work ...

    $this->info('User sync completed.');
}
```

Intermediate messages are discretionary based on complexity.

### 5. Use `#[WithoutRelations]` for jobs with models

When creating or updating a job that accepts a model instance, add the `#[WithoutRelations]` attribute to prevent eager-loaded relationships from being serialized:

```php
// Good
use Illuminate\Queue\Attributes\WithoutRelations;

#[WithoutRelations]
class ProcessUserJob
{
    public function __construct(
        public User $user
    ) {}
}

// Avoid - relationships will be serialized unnecessarily
class ProcessUserJob
{
    public function __construct(
        public User $user
    ) {}
}
```

This reduces memory usage and prevents unintended data serialization.

### 6. Always call `::query()` when building queries

When using models to build queries, always call `::query()` first for consistency and clarity:

```php
// Good
User::query()
    ->where('name', 'Jon')
    ->get();

User::query()
    ->firstOrCreate($attributes);

// Bad
User::where('name', 'Jon')->get();
User::firstOrCreate($attributes);
```

**Allowed exceptions (only these two methods):**
- `Model::find($id)`
- `Model::findOrFail($id)`

```php
// Exceptions - allowed without ::query()
$user = User::find($id);
$user = User::findOrFail($id);
```

### 7. Use dedicated `make:*` commands for scaffolding

Always use Laravel's dedicated Artisan `make:*` commands when creating migrations, models, factories, commands, and seeders.

```bash
# Good
php artisan make:migration create_orders_table
php artisan make:model Order
php artisan make:factory OrderFactory
php artisan make:seeder OrderSeeder
php artisan make:command ListOrders
```

Do not create these files manually.

### 8. Keep `ShouldBeUnique::uniqueId()` focused on unique values

If a job or listener implements `ShouldBeUnique`, `uniqueId()` should return only the values that make the job unique. Constant string prefixes do not improve uniqueness. For multiple values, use separators to keep the key concise.

```php
// BAD
public function uniqueId(): string
{
    return "order:{$this->orderId}";
}

// GOOD
public function uniqueId(): string
{
    return (string) $this->orderId;
}

// GOOD
public function uniqueId(): string
{
    return "{$this->orderId}:{$this->version}";
}
```

### 9. Use database assertion helpers for persistence checks

When a unit test verifies that a record was created, updated, deleted, or soft-deleted, use Laravel database assertion helpers such as `assertDatabaseHas()`, `assertDatabaseMissing()`, and `assertSoftDeleted()` instead of refreshing the model to inspect persisted state.

In Pest, use the function helper. In PHPUnit-style tests, use the test-case assertion method.

```php
// Good in Pest
assertDatabaseHas('users', [
    'id' => $user->id,
    'name' => 'Updated Name',
]);

assertSoftDeleted('users', [
    'id' => $user->id,
]);

// Good in PHPUnit-style tests
$this->assertDatabaseMissing('users', [
    'id' => $user->id,
]);

// Avoid
$user->refresh();

$this->assertSame('Updated Name', $user->name);
```

**Allowed exceptions:**
- Checking a complex property that is easier or safer to verify through the refreshed model, such as a value cast to a DTO.
- Re-using the refreshed entity to verify other behavior in the same test.
