---
name: spec-grid
description: Turn a spec into rule grids (entity state × actor tables, one markable rule per cell with its spec source) so the user can validate it without reading the wall of text. Run after to-spec or on any existing spec.
disable-model-invocation: true
---

# Spec grid

Draw a spec's behaviour as **rule grids**: tables with the states of the spec's main entity as rows and the actors or conditions as columns. Each cell holds one rule and its spec source. The user marks each cell as agree, wrong or not discussed, and pastes the review back. Prose hides invented rules and missing cases, and a grid exposes both because every cell must hold an answer. The script renders and validates the page, and your job is the extraction.

## Steps

1. **Read the spec.** Take the path from the arguments, or ask for it. Also read the files the spec points at, such as open questions. Work from the spec alone, because the grid must show what the spec says, and the codebase would add rules the spec never states.
   Done when you can name the main entity and every actor that touches it.

2. **Choose the grids.** Make one grid per behavioural question the spec answers, such as who sees what, who can do what, or which settings produce which result.
   - Rows are the entity's states as the spec defines them. Put the defining condition in `sub`, e.g. "draft · no collaborators".
   - Columns are actors or surfaces. Split a column by a condition (a date, a lock, a permission) only where the spec treats the two sides differently.
   - Add **edge-state** rows for states the rules produce without naming them. Probe every rule with one actor who is also another actor (the owner invites themselves), the boundary of every date and count, and every exclusion ("not archived", "expiry date after today").
   - A procedure that every path runs, such as the side effects of one shared action, goes in `sequence`.
   - Keep a grid to about eight rows and four columns. Split it before it grows.
   - Data and process decisions (schema, migrations, test plans) belong in `notCovered`, since a grid adds nothing to them.

   Done when every behavioural user story and rule lands in at least one cell. Walk the user stories one by one against the grids to check.

3. **Fill every cell** with the spec's answer for that row and column.
   - `k` is `yes` (shown or allowed), `part` (shown or allowed with limits), `no` (hidden or refused), `na` (the combination cannot occur) or `silent` (the spec gives no answer).
   - `v` is the short answer, `d` one sentence of detail, `s` the source as user story numbers and section headings.
   - Use the spec's own words, so the reader validates the spec and not your paraphrase.
   - Set `derived: true` when the answer follows from combining rules the spec states but the case itself is never written. Its `d` names the rules combined and `s` cites them.
   - A `silent` cell stays blank, with no `d`, `s` or guess, because a guess plants exactly the invented content the user is hunting. List every silent cell in `gaps` as a question.
   - Leave the verdict to the user. Only they know what was agreed, so cells carry the spec's answer and its source, never your opinion of it.

   Done when `render.mjs` passes. It rejects a row with a missing cell, a cell without a source and a silent cell with content.

4. **Render and deliver.** Write the data to `<spec-dir>/spec-grid.json`, then run `node <skill>/scripts/render.mjs <spec-dir>/spec-grid.json`, where `<skill>` is the folder holding this file. Fix what it reports and run it again. It writes `spec-grid.html` beside the JSON. Deliver it using the available preview or file tools, as described below.

5. **Report.** Give the preview, file link or local path, then list the derived cells and the gaps in a few bullets, because there the spec says more or less than the conversation did. Ask the user to mark the grid and paste back the copied review.

6. **Apply the review.** The pasted review lists the cells marked Wrong and Not discussed.
   - For Wrong, use the user's correction, or ask for it, and edit the spec.
   - For Not discussed, ask whether to drop the rule or decide it now, and edit the spec.
   - Answers to gaps become new rules in the spec.

   Then update `spec-grid.json`, render and refresh the delivered preview or file. Done when every review item is resolved in the spec.

## Preview and file delivery

Use the tools available in the current environment rather than assuming a particular tool name:

- **Claude Artifacts:** display the generated HTML as an HTML artifact when supported.
- **ChatGPT Canvas:** put the generated HTML in a coding canvas with HTML/web preview when supported.
- **Other environments or no interactive preview:** attach or link the HTML file when file delivery is available; otherwise give its local path so the user can open it in a browser.

Keep artifacts, canvases and delivered files private by default. When the host exposes visibility controls, set the output to private or the most restrictive available access and verify the setting when possible. If privacy cannot be configured or verified, tell the user; create a public or shared link only when they explicitly request it.

Use the rendered HTML unchanged so the marking controls and Markdown review export work in either preview. If the preview blocks JavaScript, offer the HTML file to open in a browser. If clipboard access is blocked, the page shows the review as selectable text. Update the existing artifact or canvas when possible after a review; provide the current file link or path otherwise. Sharing permissions and URL stability depend on the host.

## Data format

Cell `v`, `d`, `s`, row `name` and `sub`, and grid `note` accept inline HTML such as `<code>`. `sequence`, `gaps` and `notCovered` are optional.

The example below is fictional; use the current spec's terminology and source references for an actual grid.

```json
{
  "title": "Document sharing, one rule per cell",
  "eyebrow": "Example spec · spec.md",
  "grids": [
    {
      "id": "sharing",
      "title": "Documents: who can invite collaborators",
      "note": "Only documents that are not archived.",
      "rowHeader": "Document state",
      "cols": ["Owner, before sharing deadline", "Owner, from sharing deadline", "Collaborator"],
      "rows": [
        { "name": "Draft document", "sub": "no collaborators", "cells": [
          { "k": "yes", "v": "Invites allowed", "d": "The owner can invite a collaborator by email.", "s": "US1 · Invitations" },
          { "k": "no", "v": "Invites closed", "d": "New invitations are refused from the deadline onward.", "s": "US2 · Sharing deadline" },
          { "k": "na", "v": "n/a", "d": "No collaborator yet." }
        ]},
        { "name": "Owner invited themselves", "sub": "collaborator email = owner's", "cells": [
          { "k": "yes", "derived": true, "v": "Invites allowed as owner", "d": "Self-invitations are allowed and preserve ownership, so the owner invitation rule applies.", "s": "US1 · Invitations + US3 · Self-invitations" },
          { "k": "silent" },
          { "k": "silent" }
        ]}
      ]
    }
  ],
  "sequence": {
    "title": "Every invitation does this, from any path",
    "note": "Source: US1 · Invitations.",
    "steps": [{ "v": "Record the invitation", "d": "Document identifier, invitee email and invitation time." }]
  },
  "gaps": [
    { "title": "Self-invitation from the sharing deadline.", "text": "Does the sharing deadline apply when the owner invites themselves?" },
    { "title": "Owner acting as a collaborator.", "text": "Which permissions apply when the owner also has the collaborator role?" }
  ],
  "notCovered": "Schema migrations and the test plan. Read them in spec.md."
}
```
