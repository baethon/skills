---
name: state-map
description: Draw an interactive map of state transitions for a whole app, one use case, or a proposed change, as a single HTML page.
disable-model-invocation: true
---

`/state-map <scope>`, where the scope is the whole application, one use case, or a proposed change (a spec file, a ticket, or text).

The map reads like a real map. Domains are countries, domain concepts are cities, and business flows are roads. Each stop on a road is a **state transition**, and a gate before a stop shows the **trigger** it waits for. The field reference is [`references/schema.md`](references/schema.md). Read it before writing any JSON.

You judge and the script renders. Your work ends in a `source.json`, and `scripts/build.py` turns it into the page with no tokens spent on drawing.

## 1. Fix the scope

Pick one mode from the request.

- **Whole app**: every domain, about 25 cities, and every flow that changes state.
- **Use case**: only the roads that make up the named use case, the cities they pass, and their countries. Cities can be finer-grained here, because the 25-city budget does not apply. Keep the neighbouring road when one of the use case's policies reacts to an event raised on it.
- **Proposed change**: a use-case map around what the change touches, plus `status: proposed` elements for the change itself. Ask for the spec if the request names none.

If the user names an earlier `source.json`, start from it.

Work in a temporary folder outside the target repo, such as `$TMPDIR/state-map/<slug>/`. Done when you can state the mode, the target repo path, and the working folder in one line.

## 2. Survey the code

Subagents do the mapping, so your context holds the map rather than the code. You brief them, merge what they write, and judge the result.

1. Dispatch one subagent to lay out the skeleton: countries, cities, entries, externals, and the list of roads with their summaries. It writes `skeleton.json` in the working folder.
2. Dispatch one subagent per group of related roads, in parallel. Each walks its roads from the first trigger to the point where state stops changing, writing one stop per state transition, and saves each road to `roads/<road-id>.json`. A use-case map with one or two roads still gets one subagent.
3. Merge the skeleton and the roads into `source.json`. Where two subagents disagree on a city or an event name, settle it in the merge.

Every brief names the mode, the repo path, the working folder, [`references/schema.md`](references/schema.md), and the stack reference. For Laravel the stack reference is [`references/laravel.md`](references/laravel.md). For other stacks, the subagent finds the equivalents, such as the event registry, listeners, webhook routes, scheduler, and queue markers. Road briefs also carry `skeleton.json` and their road ids. In proposed-change mode, they also carry the spec.

Done when every road ends where state stops changing, every stop has an `event` and the `classes` that cause it, and every trigger was read in code, or in the spec for proposed stops, rather than inferred from a name. Send a road back to its subagent when it falls short. Without subagent support, work through the same briefs yourself, in order.

## 3. Build

```sh
python3 -I <skill-dir>/scripts/build.py source.json <repo> map.html [events-glob]
```

`<skill-dir>` is the folder holding this file.

The events glob lists event classes that no stop raises, such as model events. Laravel uses `app/Events/**/*.php`.

The build prints every problem it finds. Fix the data and rebuild. A missing path means the path is wrong, so find the real class. Done when the build exits 0.

## 4. Publish

`map.html` is self-contained apart from d3 and fonts loaded from public CDNs, so it opens in any browser. When the harness can publish HTML pages, such as claude.ai Artifacts, publish it as built with a one-sentence description of the scope, and republish the same file after later fixes so the link stays the same. Otherwise give the user the path to `map.html`.

If you can't render the page yourself, ask the user to look at the rendered map and report anything that reads wrong.
