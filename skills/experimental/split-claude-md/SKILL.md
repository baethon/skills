---
name: split-claude-md
description: >
  Split a bloated project CLAUDE.md into tiered context — always-loaded rules stay, path-scoped rules become .claude/rules/*.md with paths: frontmatter, occasional reference moves to docs/agents/*.md. Proposes the full breakdown for approval before it writes anything. Use when the user invokes /split-claude-md.
disable-model-invocation: true
---

# Split CLAUDE.md

`CLAUDE.md` is RAM, not disk. Every line costs tokens on every turn, whether it
applies or not. This skill moves each line to the tier that matches how often
the agent needs it.

Target: the root `CLAUDE.md` of the current project. Leave nested `CLAUDE.md`
files and `AGENTS.md` alone.

## The ladder

Walk every chunk of `CLAUDE.md` down these rungs. Stop at the first rung that
holds. A *chunk* is a heading or a standalone bullet.

0. **Already the model's default behavior** → drop. Nothing is written.
1. **Needed every turn** → keep in `CLAUDE.md`. Test: the agent breaks this
   rule if it does not see the rule before it decides what to write.
2. **Applies only inside files that match a glob** → `.claude/rules/<topic>.md`
   with `paths:` frontmatter:

   ```markdown
   ---
   paths: ["app/**/*.php", "tests/**/*.php"]
   ---

   Rule text goes here.
   ```

   A `paths:` glob fires when the agent touches a matching file. A rule that
   governs *where* new code goes stays on rung 1 — the file does not exist yet
   when the agent decides. Only a rule about what goes *inside* a matching file
   drops to rung 2.

3. **A procedure with steps, a script, or a template** → a skill. Report the
   candidate; write no skill. If the user asks for the skill afterwards, use the
   `writing-for-agents` skill to write it when that skill is available.
4. **Long, human-readable, needed sometimes** → `docs/agents/<topic>.md`.

Rungs 2 and 4 differ by scope, not by length: a rule tied to file paths is
rung 2 even when it is short.

### Worked examples

| chunk | rung | why |
| --- | --- | --- |
| "Never commit directly to `main`." | 1 | The agent commits before it reads a doc. |
| "Run `make check` before you report a task complete." | 1 | No trigger fires it. It shapes every turn. |
| "This project uses pnpm, not npm." | 1 | The agent types `npm install` by reflex. |
| "Deploy pipeline: 6 stages, env vars, rollback." | 4 | Long. "Deploying" is a trigger the agent knows. |
| "Database schema overview, 12 tables." | 4 | Read on demand, when the task touches queries. |
| "Prefer clear variable names." | 0 | Default behavior. |
| "Use type hints on all PHP methods." | 2 | Scoped to `**/*.php`. |

The last three rows are the same length and sit on three different rungs.
Length is not the signal. The trigger is.

## Steps

### 1. Triage

Read the root `CLAUDE.md`. If it does not exist, report that and stop — even
when `AGENTS.md` exists, because this skill does not touch that file.

Put each chunk on a rung. If every chunk lands on
rung 1, report that no split earns its cost and stop. Make no edits and read
nothing more.

### 2. Inventory

Read, in this order:

- every `.claude/rules/*.md` in full — the skill appends to these files, so it
  must know what they already say.
- the frontmatter of the skills that live in the project — enough to spot a
  chunk that a project skill already covers. Ignore the global skills in
  `~/.claude/skills`. A global skill is absent on another machine, so a chunk
  that only a global skill covers stays in the project.
- `CONTEXT.md` for the domain vocabulary. If `CONTEXT-MAP.md` exists, read each
  `CONTEXT.md` that it names.

### 3. Verify the globs

Match every proposed `paths:` glob against the real directory layout. A glob
that matches no file makes a dead rule file: drop the rule and keep the chunk
in `CLAUDE.md`.

If the current directory is not a project root, `.claude/rules` does not load.
Use rungs 1, 3 and 4 only, and say so in the proposal.

### 4. Propose

Print one table, then wait for approval:

| source section | destination | rung | what it becomes |

Below the table, add two lists:

- **Dropped as no-op** — the rung-0 chunks.
- **Already covered by** — chunks that a project skill holds.

Account for every heading and every bullet of the original file. Nothing moves
silently.

### 5. Apply

Apply the plan as the user amended it. Echo what changed in one line.

Write only files that are clean in git — git is the backup. If a target file
holds uncommitted changes, report it and ask once whether to continue.

Writing rules:

- Delete every moved chunk from `CLAUDE.md`. Only rung-1 chunks and the
  pointers stay. A chunk that lives in two files costs tokens in both.
- Append to an existing file. Never replace it.
- Start each `docs/agents/*.md` with one line that states what the file covers
  and when to read it.
- Keep the headings that `CLAUDE.md` already has. List one pointer per
  `docs/agents/*.md` file under the section that already holds the pointers. If
  no such section exists, add a `## Reference` section at the end of the file.
  Each pointer states its trigger condition: "writing tests → read
  `docs/agents/testing.md`". A pointer without a trigger fires at random.
- List no pointer for a `.claude/rules/*.md` file. Those files load on their
  own.

### 6. Report

The run is complete when every approved file is written and `CLAUDE.md` is
updated. There is no length target.

If `AGENTS.md` exists, close with a warning that this run did not update it.

## Style

Write every generated file in Simplified Technical English:

- One idea per sentence.
- Active voice, present tense.
- Imperative mood for instructions.
- One term per concept. Do not switch between synonyms.

Rewriting for compactness is expected — the new files are not copies.

Use the terms from `CONTEXT.md` exactly as that file defines them. A domain
term wins over any simpler word.
