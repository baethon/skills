# tree.json and answers

## Session folder

```
.grill/<id>-<slug>/
  tree.json        # the only file you edit
  meta.json        # written by scripts: round, hash, confirmed
  round-N.html     # rendered pages, one per round
  rounds/round-N.json   # snapshot of tree.json per round, used for "since last round"
```

## tree.json

```json
{
  "session": "7f3a",
  "slug": "invite-teammate",
  "title": "Invite a teammate",
  "context": "One or two sentences on what is being decided and why now.",
  "views": [
    {
      "id": "flow",
      "title": "Invite flow",
      "legend": "Arrow means happens before.",
      "mermaid": "flowchart LR\n  invite[Admin invites] --> sent[Invite sent] --> accept[Invitee accepts] --> join[Joins workspace]"
    }
  ],
  "questions": [
    {
      "id": "Q1",
      "type": "decision",
      "title": "Who can invite?",
      "body": "Optional detail when the title and options are not enough.",
      "view": "flow",
      "node": "invite",
      "dependsOn": [],
      "options": [
        { "id": "A", "text": "Admins only" },
        { "id": "B", "text": "Any member" }
      ],
      "recommended": "A",
      "why": "Seats are billed, so inviting is a spending decision.",
      "status": "open"
    },
    {
      "id": "T1",
      "type": "term",
      "title": "What is a seat?",
      "term": { "kind": "new" },
      "options": [
        { "id": "A", "text": "A paid slot", "glossary": { "term": "Seat", "definition": "A paid slot in a workspace, held by at most one member.", "avoid": ["license"] } },
        { "id": "B", "text": "A person", "glossary": { "term": "Seat", "definition": "A member who is billed." } }
      ],
      "recommended": "A",
      "why": "Billing counts slots, not people; a slot can sit empty.",
      "status": "open"
    }
  ],
  "facts": [
    { "text": "Invites are emailed by the notifications service.", "source": "services/notify/README.md" }
  ]
}
```

### Questions

- `id` letters and digits. Use `Q1, Q2…` for decisions and `T1, T2…` for terms. Never reuse an id.
- `type` is `decision` or `term`.
- `status` is one of these.
  - `open` means on the frontier and shown as a card. Needs `options`, `recommended` and `why`, and every `dependsOn` question must be `settled`.
  - `settled` needs `decision`. `apply.mjs` writes it for accept and alt answers.
  - `deferred` means explicitly left open. It stays visible and must not be decided silently later.
  - `custom` means the user chose "something else". `apply.mjs` sets it; you must resolve it before the next render, either by writing `decision` and setting `settled`, or by re-asking it as `open` with new options.
- `decision` is `{ "text", "why", "rejected": [..], "glossary"? }`. Write the same shape when you settle a custom answer. Term decisions need `glossary`.
- `answer` and `history` are written by `apply.mjs`. Leave them alone.
- `view` and `node` pin a question to a diagram node. The node id must appear in that view's Mermaid source as an id, not only inside a label. Highlighting works for `flowchart` and `graph` views.
- Term questions take `term.kind` (`new`, `synonym`, `conflict`) and, for conflicts, `term.existing` with the current glossary text. Options carry `glossary: { term, definition, avoid?, replaces? }`, the entry you would write if that option wins. `replaces` lists terms whose entries go away, for merging synonyms. The scripts never touch the glossary: `apply.mjs` reports each settled term and you write it, following the `domain-modeling` skill.

To change your mind about a settled question without the user asking, set it back to `open`, clear `decision`, and say why in `body`.

Every view needs `id`, `title`, `legend` and `mermaid`. `render.mjs` refuses a tree with no questions.

## Answer block

The page generates this; the user pastes it into the terminal.

```
grill session=7f3a round=3 tree=a41f2c
Q1 accept
Q2 accept "Matches how billing already works"
Q3 alt B "SSO invites are a separate project"
Q4 other "Expire after 7 days, not 30"
Q5 defer "Needs legal input"
Q6 reopen "Turns out guests exist"
note "Keep the first version small"
confirm
```

- The header must match the session and the latest rendered round, otherwise `apply.mjs` refuses it.
- `accept` takes the recommended option, `alt X` takes option X, both with an optional note. For `alt` the note becomes the decision's reason; for `accept` it is appended to the recommendation's `why`.
- Each round's answers apply once. A second paste for the same round is refused until `render.mjs` opens the next round.
- `other` and `reopen` need text. `reopen` works on settled and deferred questions.
- `confirm` only appears on the confirmation page and only counts when nothing is reopened or open.
- Strings are double-quoted with `\"`, `\\` and `\n` escapes.
