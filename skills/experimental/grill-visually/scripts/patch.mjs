#!/usr/bin/env node
// Update tree.json from a partial tree on stdin: node patch.mjs [--session 7f3a] <<'PATCH' {...} PATCH
// context replaces, facts append, questions and views merge by id (fields replaced whole),
// removeViews deletes views by id.
import fs from 'node:fs';
import { parseArgs, fail, resolveSession, loadSession, saveTree, validateTree } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const dir = resolveSession(args.session === true ? null : args.session);
const { tree } = loadSession(dir);

let patch;
try {
  patch = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (e) {
  fail(`the patch is not valid JSON: ${e.message}`);
}

const known = ['context', 'facts', 'questions', 'views', 'removeViews'];
const unknown = Object.keys(patch).filter((key) => !known.includes(key));
if (unknown.length) fail(`unknown patch keys: ${unknown.join(', ')}. Use ${known.join(', ')}.`);

function mergeById(list, updates) {
  const merged = [...list];
  for (const update of updates) {
    if (!update.id) fail(`every patched item needs an id: ${JSON.stringify(update)}`);
    const index = merged.findIndex((item) => item.id === update.id);
    if (index === -1) merged.push(update);
    else merged[index] = { ...merged[index], ...update };
  }
  return merged;
}

const removed = new Set(patch.removeViews || []);
const next = {
  ...tree,
  ...('context' in patch ? { context: patch.context } : {}),
  facts: [...(tree.facts || []), ...(patch.facts || [])],
  questions: mergeById(tree.questions || [], patch.questions || []),
  views: mergeById(tree.views || [], patch.views || []).filter((view) => !removed.has(view.id)),
};

const errors = validateTree(next);
if (errors.length) fail(`patch not applied, the tree would be invalid:\n- ${errors.join('\n- ')}`);

saveTree(dir, next);
const counts = [
  patch.questions?.length && `${patch.questions.length} questions`,
  patch.views?.length && `${patch.views.length} views`,
  patch.facts?.length && `${patch.facts.length} facts`,
  removed.size && `removed ${removed.size} views`,
  'context' in patch && 'context',
].filter(Boolean);
console.log(`Patched ${tree.slug} (${tree.session}): ${counts.join(', ') || 'nothing'}.`);
