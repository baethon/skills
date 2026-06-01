# Laravel Reference

## Rules

### 1. Use Collections Over Arrays

Prefer Laravel Collections for data manipulation:

```php
// Preferred
collect($users)
    ->filter(fn ($user) => $user->active)
    ->map(fn ($user) => $user->name);

// Avoid
$names = [];
foreach ($users as $user) {
    if ($user->active) {
        $names[] = $user->name;
    }
}
```

### 2. Use Eloquent Query Scopes

Extract reusable query logic into scopes:

```php
// Good - in Model
public function scopeActive(Builder $query): Builder
{
    return $query->where('active', true);
}

// Usage
User::active()->get();
```

### 3. Form Requests for Validation

Use Form Request classes instead of inline validation:

```php
// Good
public function store(StoreUserRequest $request)
{
    User::create($request->validated());
}

// Avoid
public function store(Request $request)
{
    $validated = $request->validate([...]);
}
```

### 4. Resource Classes for API Responses

Use API Resources for JSON responses:

```php
// Good
return new UserResource($user);
return UserResource::collection($users);

// Avoid
return response()->json($user->toArray());
```

### 5. Actions for Business Logic

Extract complex business logic into Action classes:

```php
// Good
class CreateOrderAction
{
    public function execute(User $user, array $items): Order
    {
        // Complex logic here
    }
}

// Avoid putting business logic in controllers
```

### 6. Prefer Dependency Injection

Use constructor injection over facades where practical:

```php
// Preferred for testability
public function __construct(
    private readonly UserRepository $users
) {}

// Facades acceptable for simple cases
Cache::get('key');
```

### 7. Namespace Commands by Prefix

Artisan commands go in subdirectories matching their prefix:

```
sync:resume   -> App\Console\Commands\Sync\ResumeCommand.php
users:activate -> App\Console\Commands\Users\ActivateCommand.php
```

### 8. Helper Functions for Jobs and Events

Use helper functions instead of static dispatch:

```php
// Good
dispatch(new ProcessOrder($order));
event(new UserCreated($user));

// Bad
ProcessOrder::dispatch($order);
UserCreated::dispatch($user);
```

### 9. Progress Bars for Batch Operations

Use progress bars when commands process multiple items:

```php
$progress = $this->output->createProgressBar($total);

foreach ($users->lazy() as $user) {
    $this->processUser($user);
    $progress->advance();
}

$progress->finish();
```

### 10. Commands Must Log Start and Finish

All commands should output when they start and finish, even CRON scripts:

```php
public function handle()
{
    $this->info('Starting user sync...');

    // ... work ...

    $this->info('User sync completed.');
}
```

Intermediate messages are discretionary based on complexity.

### 11. Use `#[WithoutRelations]` for Jobs with Models

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

### 12. Always Call `::query()` When Building Queries

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

### 13. Use `$query` Instead of `$q` in Query Builder Callbacks

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

**Rationale:** This aligns with the general coding standard requiring descriptive variable names (see coding-standards.md rule 4). While `$q` is a common shorthand, it's an abbreviation that reduces readability.

### 14. Use Dedicated `make:*` Commands for Scaffolding

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

### 15. Keep `ShouldBeUnique::uniqueId()` Focused on Unique Values

If a job or listener implements `ShouldBeUnique`, `uniqueId()` should return only the values that make the job unique. Constant string prefixes do not improve uniqueness. For multiple values, use separators to keep the key concise.

```php
// BAD
public function uniqueId()
{
    return "order:{$this->orderId}";
}

// GOOD
public function uniqueId()
{
    return $this->orderId;
}

// GOOD
public function uniqueId()
{
    return "{$this->orderId}:{$this->version}";
}
```

### 16. Use Laravel Database Assertion Helpers for Creates and Updates

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

### 17. Use Database Assertions for Deletes

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
