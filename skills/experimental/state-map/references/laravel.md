# Trigger sources in Laravel

Where each trigger kind shows up in a Laravel codebase. Pass `app/Events/**/*.php` as the build's events glob.

- **policy**: listeners. With event discovery on (`shouldDiscoverEvents()` in `EventServiceProvider`), a listener is any class whose `handle()` type-hints the event. Otherwise read `$listen` in `EventServiceProvider`. Also check model observers and `booted()` closures.
- **Model events**: `$dispatchesEvents` on a model maps lifecycle hooks to event classes, such as `'created' => OrderCreated::class`. These events are raised by Eloquent, not by a stop, which is why the events glob exists.
- **callback**: webhook routes and their controllers or listeners. Packages often turn a webhook into a generic event plus a topic attribute, such as `#[Topic('orders/create')]` on a listener for `ShopifyWebhookReceived`. Use the topic as the trigger `name`.
- **command**: routes in `routes/web.php` and `routes/api.php`, then the controller action. Artisan commands a person runs by hand count too, with a `cli` entry.
- **schedule**: `schedule()` in `app/Console/Kernel.php` gives `command` and `every`.
- **queued**: a job or listener that `implements ShouldQueue`, `dispatch()` rather than `dispatch_sync()`, and each link of `->chain()`. `->delay()` and `$delay` give `delay`.
