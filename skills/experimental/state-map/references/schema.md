# State map source schema

One JSON file describes the map. `build.py` enforces it, so a build that exits 0 is a valid map.

```json
{
  "title": "29029 CRM atlas",
  "countries": [{ "id": "Orders", "name": "Orders" }],
  "entries": [{ "id": "admin-crm", "name": "Admin CRM", "kind": "admin", "summary": "...", "evidence": ["routes/web.php:23"] }],
  "externals": [{ "id": "shopify", "name": "Shopify", "direction": "both", "summary": "...", "evidence": ["app/Adapters/Shopify.php"] }],
  "cities": [{ "id": "order", "name": "Order", "country": "Orders", "summary": "...", "classes": ["app/Models/Order.php"] }],
  "roads": [{
    "id": "order-intake", "name": "Order Intake", "entry": "shopify-webhooks", "externals": ["shopify"], "summary": "...",
    "stops": [{
      "city": "order", "what": "orders/create queues ImportOrder with a 15-minute delay",
      "classes": ["app/Listeners/Orders/ImportNewOrder.php"], "event": "OrderCreated",
      "trigger": [{ "kind": "callback", "from": "shopify", "name": "orders/create", "delay": "15 min" }]
    }]
  }]
}
```

## Map elements

- **Country** is a domain. Its land colour comes from its position in the list.
- **City** is a domain concept, such as Order or Ticket, never a class. `classes` lists the repo-relative paths that implement it. They show as districts when the reader zooms in, together with every stop's `classes`.
- **Entry** (border crossing) is where work starts, such as an admin UI, a webhook endpoint, an API, or the scheduler. `kind` is a short free word shown on the sheet.
- **External** (foreign land) is a system outside the repo. `direction` is `in`, `out`, or `both`.
- **Road** is a named business flow drawn through its stops in order. `entry` is the crossing it starts from and is optional, because a road that starts from a policy or a schedule has none. `externals` draws a ferry to each listed system.

## Stops

A stop is one state transition. Something durable changes, and `event` names that change in the past tense. Use the real event class name when the code has one, otherwise write a past-tense name such as `LineItemsMapped`. A read-only lookup changes nothing, so it is not a stop. Mention it in the city's `summary` instead.

`what` is one line on what happens. `classes` are the paths that do it.

## Triggers

A stop without `trigger` continues inline, in the same unit of work as the stop before it. A stop with `trigger` waits for one of the listed causes, and the map draws a gate before it.

| `kind` | Required fields | Meaning |
|---|---|---|
| `command` | `from`: entry id | A person or client acts at an entry. |
| `callback` | `from`: external id, `name` | An external system calls in, such as a webhook topic. |
| `policy` | `on`: event | A listener reacts to an event. The event must be raised by some stop, or match a class in the build's events glob. |
| `schedule` | `command`, `every`, optional `scans`: event | A scheduled command runs. `scans` names the event whose results it picks up. |
| `queued` | | Work is pushed to a queue and resumes later. |

Any trigger can add `delay` (free text, such as `"15 min"`) or `"queued": true`. A policy or schedule that names an event raised on another road draws a junction between the two roads.

## Status

`status` is `existing` (default) or `proposed`, and it renders on cities and roads. Proposed elements are dashed, and their classes are not path-checked, because that code does not exist yet.

Stops carry no status of their own, so a proposed change is drawn as a proposed road. New behaviour that hooks onto an existing flow is a proposed road whose first stop has a `policy` on the existing event, or a `command` from the entry that starts it. A change that rewrites an existing flow is a proposed road with the new stops, drawn beside the existing road it replaces.
