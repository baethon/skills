---
name: grill-visually
description: Visual grilling session that stress-tests a plan or design through diagrams and clickable decision cards instead of walls of questions, keeping GLOSSARY.md up to date and offering ADRs as decisions settle, and ending in a confirmed shared understanding. Use when the user asks to be grilled visually, wants a visual grill, asks to work through a design with diagrams, or invokes grill-visually by name. It does not write a spec or code; it stops at shared understanding.
disable-model-invocation: true
---

# Grill visually

Interview the user until you reach a shared understanding of a plan, but show each round as a diagram with the open decisions marked on it. The user answers by clicking through a page and pasting one generated block back into the terminal. The session ends when every decision is settled or explicitly deferred and the user confirms. Along the way it produces the same docs as `grill-with-docs`, a GLOSSARY.md updated as terms settle and ADRs for decisions worth recording. It does not produce a spec or code, because those are separate steps the user chooses afterwards.

## Who does what

Scripts do the mechanical round-trip. You do the judgment and the docs.

| Script (in `<skill>/scripts/`, where `<skill>` is the folder holding this file) | What it does |
|---|---|
| `node <skill>/scripts/init.mjs --title "..." [--slug ...]` | Creates `.scratch/grilling/<id>-<slug>/` |
| `node <skill>/scripts/patch.mjs [--session <id>] < patch` | Merges a partial `tree.json` into the tree, validates it, and writes it only when valid |
| `node <skill>/scripts/render.mjs [--session <id>] [--no-open]` | Validates `tree.json`, renders the next round page from the fixed template, prints its path on an `Open:` line, tries to open it |
| `node <skill>/scripts/apply.mjs [--session <id>] [--answers <base64url>] < answers` | Checks the answers belong to this session and the latest round, applies them to `tree.json`, and reports every answer and what needs your judgment, including glossary entries ready to paste |
| `node <skill>/scripts/summary.mjs [--session <id>]` | Prints the shared understanding so far |

Never write or edit round HTML, `meta.json`, or `rounds/`, and never apply an answer block by hand. Change `tree.json` only through `patch.mjs`, so you never re-read the whole tree. If a script refuses, patch according to its message and run it again. The full `tree.json` shape, the patch format and the answer format are in `references/schema.md`; read it before writing the first round.

Run scripts from the project root so `.scratch/grilling/` lands there. `--session` can be left out when only one session exists.

## Session flow

1. **Start.** Load the `domain-modeling` skill. It owns GLOSSARY.md and ADRs: where they live, their format, and when to create them. Run `init.mjs` with a short title. Read the glossary `domain-modeling` points you to, so diagram labels and questions use its terms.

2. **Find facts before asking.** Facts are your job and decisions are the user's. Explore the codebase and docs (use sub-agents if available) and record what matters in `tree.facts` with its source. Don't ask the user anything you could look up. A question that depends on a fact still being looked up waits for a later round; ask the rest now. When the user's plan contradicts the code, make the contradiction a question.

3. **Write the round.** Patch `tree.json` to hold the current picture and the frontier, following the guidance below. Then run `render.mjs` and tell the user that round N is ready, with the absolute HTML path from its `Open:` line so they can open it themselves if no browser appeared, and to paste the copied command into this prompt. Always give the path, because opening the browser often fails silently.

4. **Apply answers.** The page copies a `! node …/apply.mjs --answers …` command, so usually the user runs it and the `apply.mjs` report is already in the conversation. Start from that report. When the user instead pastes a bare block starting with `grill session=`, pass it to `apply.mjs` through a quoted heredoc so nothing in it gets interpreted by the shell:

   ```bash
   node <skill>/scripts/apply.mjs <<'GRILL'
   <pasted block, unchanged>
   GRILL
   ```

   Read the report, then do the judgment work.
   - Write every glossary entry the report prints to the glossary now, as printed. Do the same when you settle a "something else" term answer yourself.
   - Turn each "something else" answer into a decision (set `decision` and status `settled`) or, if it raises a new fork, re-ask it as `open` with new options.
   - When a decision that just settled meets the `domain-modeling` ADR test (hard to reverse, surprising without context, the result of a real trade-off), add a decision card to the next round asking whether to record it, with recording as the recommendation. Write the ADR once that card is accepted.
   - Fold general notes into the picture, recompute the frontier, update the views, add term questions for new vocabulary, and render the next round.

   If an alternative was chosen without a reason and the reason matters later, ask for it in the next round. If `apply.mjs` rejects the block as stale or from another session, tell the user which page to answer instead.

   If the user replies in prose instead of a paste, that's fine. Treat it as conversation, patch `tree.json` and update the docs yourself, and render the next round.

5. **Confirm.** When no question is open, `render.mjs` produces a confirmation page showing the whole settled picture. A pasted `confirm` makes `apply.mjs` print the shared understanding. Reopened questions send you back to step 3; if a reopened term or ADR changes, update the file you already wrote.

6. **Stop.** After confirmation, don't act on the result. Say in one sentence what the user can do next, such as turning it into a spec or going straight to implementation, and wait. The shared understanding now lives in this conversation, the glossary and any ADRs.

After context compaction, run `summary.mjs` and re-read `tree.json` before continuing or converting, because summaries tend to drop reasons and rejected alternatives.

## Designing a round

Work the design tree in rounds. The frontier is every decision whose prerequisites are settled. Ask the whole frontier at once, and nothing that depends on a question still open in the same round (`render.mjs` enforces this through `dependsOn`). Give every question a recommended answer and a one-sentence `why`, worded so that accepting the recommendation is the natural yes, because untouched cards count as accepted.

Start with a boundary view showing what is inside the change, which actors touch it, and which neighbouring systems sit outside. Scope disagreements surface fastest there. Then add views as decisions need them, picking the smallest view that makes the point.

| The decision is about | View (Mermaid) |
|---|---|
| Scope and who's involved | `flowchart` with a subgraph for the boundary |
| What happens in what order | `flowchart` or `sequenceDiagram` |
| What can be true at the same time | `stateDiagram-v2` |
| What data exists | `erDiagram` or `classDiagram` |
| Where code lives and where tests cut | `flowchart` of components with test seams as dashed edges |

Keep each view to about seven nodes; split into an overview and a detail view rather than growing one. Give every view a one-line `legend` saying what an arrow means, because arrows are ambiguous. Title a view by what it shows; round status such as "recommended drawn in" goes stale once questions settle. Remove a view with `removeViews` once no decision needs it, because question rounds lead with the views that have open questions and fold the rest away. Pin each question to the node it affects with `view` and `node`, so the page highlights it on the diagram (this works for `flowchart` views; use node ids that appear in the source). Keep question titles short and put detail in `body` only when the title and options can't carry it.

Prefer showing the recommended answers already drawn into the diagram. The user then reviews a picture of the proposal and only touches what looks wrong.

When domain relationships are in play, use the `body` of a question to pose a concrete edge-case scenario and let the options be the possible outcomes. That is the visual form of the scenario probing `domain-modeling` asks for.

## Vocabulary

Diagram labels force nouns, so watch them. Raise a term question (`type: "term"`, id prefix `T`) when a new domain term appears, when two words are being used for one thing, or when a word is used differently than the glossary says. Flag that last kind clearly in the body, because changing a definition can quietly affect code that relies on the old one. Each option carries the glossary entry it would write; use `replaces` when merging synonyms removes an existing entry. Only terms specific to this project qualify, as `domain-modeling` defines them, otherwise the glossary fills with noise.
