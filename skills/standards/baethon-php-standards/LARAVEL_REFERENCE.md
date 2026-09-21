# Laravel reference

## Rules

These rules describe Laravel idioms, not required architecture. Follow the project's established pattern. Introduce a scope, Form Request, resource, action, or injected dependency only when the current behavior benefits from that boundary.

### 1. Prefer collections for collection pipelines

Use Laravel Collections when the value is already a collection or several collection operations form a readable pipeline. Keep an array or loop when converting it would add work or hide control flow.

```php
// Collection pipeline
collect($users)
    ->filter(fn ($user) => $user->active)
    ->map(fn ($user) => $user->name);

// Direct loop when branching is clearer
$names = [];
foreach ($users as $user) {
    if ($user->active) {
        $names[] = $user->name;
    }
}
```

### 2. Use Eloquent query scopes for named constraints

Extract a query constraint into a scope when it is reused or names a domain concept. Keep a one-off query local when the scope would only move the same expression elsewhere.

```php
// Good - in Model
public function scopeActive(Builder $query): Builder
{
    return $query->where('active', true);
}

// Usage
User::active()->get();
```

### 3. Use Form Requests at an established validation boundary

Use a Form Request when the application already uses them for controller input, or when authorization, reuse, or a substantial rule set makes the request a useful boundary. Inline validation is acceptable for a small one-off endpoint when that matches the surrounding code.

```php
// Form Request boundary
public function store(StoreUserRequest $request): void
{
    User::create($request->validated());
}

// Inline validation for a small one-off endpoint
public function store(Request $request): void
{
    $validated = $request->validate([...]);
}
```

### 4. Use resource classes for stable API transformations

Use an API Resource when the response is a stable public shape, needs transformation, is reused, or the application already standardizes on resources. Return a direct JSON response for a small one-off shape when that matches the surrounding code.

```php
// Resource for a stable or reused API shape
return new UserResource($user);
return UserResource::collection($users);

// Direct one-off response
return response()->json($user->toArray());
```

### 5. Use actions for coherent business operations

Extract an action when a business operation is complex, reused, or already represented by actions in the application. Keep straightforward endpoint-specific behavior in the existing service or controller when another class would only add indirection.

```php
// Good
class CreateOrderAction
{
    public function execute(User $user, array $items): Order
    {
        // Coherent business operation
    }
}
```

### 6. Follow the application's dependency style

Use constructor injection for collaborators that need substitution, explicit lifetime management, or match the surrounding code. Facades are acceptable in facade-driven code and for simple framework services.

```php
// Injected collaborator
public function __construct(
    private readonly UserRepository $users
) {}

// Facade in facade-driven code
Cache::get('key');
```

### 7. Namespace commands by prefix

Artisan commands go in subdirectories matching their prefix:

```
sync:resume   -> App\Console\Commands\Sync\ResumeCommand.php
users:activate -> App\Console\Commands\Users\ActivateCommand.php
```

### 8. Use helper functions for jobs and events

Use helper functions instead of static dispatch:

```php
// Good
dispatch(new ProcessOrder($order));
event(new UserCreated($user));

// Bad
ProcessOrder::dispatch($order);
UserCreated::dispatch($user);
```

### 9. Use progress bars for interactive batch operations

Use a progress bar when an interactive command processes enough items that visible progress helps the operator. Do not add one to a short or non-interactive command.

```php
$progress = $this->output->createProgressBar($total);

foreach ($users->lazy() as $user) {
    $this->processUser($user);
    $progress->advance();
}

$progress->finish();
```

### 10. Commands must log start and finish

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

### 11. Use `#[WithoutRelations]` for jobs with models

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

### 12. Always call `::query()` when building queries

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

**Rationale:** Starting with `::query()` makes it visually clear that a query is being built and maintains consistency with method chaining style.

### 13. Use `$query` instead of `$q` in query builder callbacks

Always use the full variable name `$query` in query builder callbacks, not `$q`:

```php
// Good
Build::query()
    ->when($importId !== null, fn ($query) => $query->where('last_import_id', $importId))
    ->when($limit !== null, fn ($query) => $query->limit((int) $limit))
    ->get();

// Bad - violates descriptive variable names rule
Build::query()
    ->when($importId !== null, fn ($q) => $q->where('last_import_id', $importId))
    ->when($limit !== null, fn ($q) => $q->limit((int) $limit))
    ->get();
```

**Rationale:** This aligns with the generic standard requiring descriptive names. While `$q` is a common shorthand, it reduces readability.

### 14. Use dedicated `make:*` commands for scaffolding

Always use Laravel's dedicated Artisan `make:*` commands when creating migrations, models, factories, commands, and seeders.

```bash
# Good
php artisan make:migration create_orders_table
php artisan make:model Order
php artisan make:factory OrderFactory
php artisan make:seeder OrderSeeder
php artisan make:command ListOrders
```

Do not create these files manually. Using dedicated commands ensures consistent file structure, naming conventions, and framework integration.

### 15. Keep `ShouldBeUnique::uniqueId()` focused on unique values

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

### 16. Use Laravel database assertion helpers for creates and updates

When a unit test verifies that a record was created or updated in the database, use Laravel database assertion helpers such as `assertDatabaseHas()` instead of refreshing the model only to assert persisted scalar properties.

In Pest, use the function helper. In PHPUnit-style tests, use the test-case assertion method.

```php
// Good in Pest
assertDatabaseHas('users', [
    'id' => $user->id,
    'name' => 'Updated Name',
]);

// Good in PHPUnit-style tests
$this->assertDatabaseHas('users', [
    'id' => $user->id,
    'name' => 'Updated Name',
]);

// Avoid
$user->refresh();

$this->assertSame('Updated Name', $user->name);
```

**Allowed exceptions:**
- Checking a complex property that is easier or safer to verify through the refreshed model, such as a value cast to a DTO.
- Re-using the refreshed entity to verify other behavior in the same test.

**Rationale:** Laravel database assertion helpers make the persistence check explicit and avoid coupling the assertion to model rehydration when the test only needs to confirm database state.

### 17. Use database assertions for deletes

When a unit test verifies that a record was deleted or soft-deleted, use Laravel database assertion helpers such as `assertDatabaseMissing()` and `assertSoftDeleted()` instead of refreshing the model just to inspect persistence state.

In Pest, use the function helper. In PHPUnit-style tests, use the test-case assertion method.

```php
// Good in Pest
assertDatabaseMissing('users', [
    'id' => $user->id,
]);

assertSoftDeleted('users', [
    'id' => $user->id,
]);

// Good in PHPUnit-style tests
$this->assertDatabaseMissing('users', [
    'id' => $user->id,
]);

$this->assertSoftDeleted('users', [
    'id' => $user->id,
]);

// Avoid
$user->refresh();
```

**Allowed exception:**
- Re-using the refreshed entity to verify other behavior in the same test.

**Rationale:** Laravel database assertion helpers state the persistence expectation directly and keep deletion checks focused on database state.
