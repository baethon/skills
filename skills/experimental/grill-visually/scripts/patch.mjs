#!/usr/bin/env node
// Update tree.json from a partial tree on stdin: node patch.mjs [--session 7f3a | --new] <<'PATCH' {...} PATCH
// --new starts a session and needs "title" in the patch.
// context replaces, facts append, questions and views merge by id (fields replaced whole),
// removeViews deletes views by id. New questions get an id, type "decision" and status "open" when left out.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  GRILL_DIR, parseArgs, fail, slugify, resolveSession, loadSession, saveTree, saveMeta, validateTree,
} from './lib.mjs';

const args = parseArgs(process.argv.slice(2));

let patch;
try {
  patch = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (e) {
  fail(`the patch is not valid JSON: ${e.message}`);
}

const known = ['title', 'context', 'facts', 'questions', 'views', 'removeViews'];
const unknown = Object.keys(patch).filter((key) => !known.includes(key));
if (unknown.length) fail(`unknown patch keys: ${unknown.join(', ')}. Use ${known.join(', ')}.`);

const { dir, tree } = args.new ? createSession(patch.title) : loadSession(resolveSession(args.session === true ? null : args.session));

function createSession(title) {
  if (!title) fail('a new session needs "title" in the patch');
  const session = crypto.randomBytes(2).toString('hex');
  const slug = slugify(title);
  const folder = path.join(process.cwd(), GRILL_DIR, `${session}-${slug}`);
  fs.mkdirSync(folder, { recursive: true });
  saveMeta(folder, { session, slug, round: 0, hash: null, confirmed: false });
  return { dir: folder, tree: { session, slug, title, context: '', views: [], questions: [], facts: [] } };
}

function nextQuestionId(questions, type) {
  const prefix = type === 'term' ? 'T' : 'Q';
  const used = questions.map((q) => q.id)
    .filter((id) => new RegExp(`^${prefix}\\d+$`).test(id))
    .map((id) => Number(id.slice(1)));
  return `${prefix}${Math.max(0, ...used) + 1}`;
}

function mergeQuestions(list, updates) {
  const merged = [...list];
  const added = [];
  for (const update of updates) {
    const index = merged.findIndex((question) => question.id === update.id);
    if (index !== -1) {
      merged[index] = { ...merged[index], ...update };
      continue;
    }
    const type = update.type || 'decision';
    const question = { id: nextQuestionId(merged, type), type, status: 'open', ...update };
    merged.push(question);
    added.push(question.id);
  }
  return { merged, added };
}

function mergeViews(list, updates) {
  const merged = [...list];
  for (const update of updates) {
    if (!update.id) fail(`every patched view needs an id: ${JSON.stringify(update)}`);
    const index = merged.findIndex((view) => view.id === update.id);
    if (index === -1) merged.push(update);
    else merged[index] = { ...merged[index], ...update };
  }
  return merged;
}

const removed = new Set(patch.removeViews || []);
const questions = mergeQuestions(tree.questions || [], patch.questions || []);
const next = {
  ...tree,
  ...('title' in patch ? { title: patch.title } : {}),
  ...('context' in patch ? { context: patch.context } : {}),
  facts: [...(tree.facts || []), ...(patch.facts || [])],
  questions: questions.merged,
  views: mergeViews(tree.views || [], patch.views || []).filter((view) => !removed.has(view.id)),
};

const errors = validateTree(next);
if (errors.length) {
  if (args.new) fs.rmSync(dir, { recursive: true });
  fail(`patch not applied, the tree would be invalid:\n- ${errors.join('\n- ')}`);
}

saveTree(dir, next);
const counts = [
  patch.questions?.length && `${patch.questions.length} questions`,
  patch.views?.length && `${patch.views.length} views`,
  patch.facts?.length && `${patch.facts.length} facts`,
  removed.size && `removed ${removed.size} views`,
  'context' in patch && 'context',
].filter(Boolean);
console.log(`${args.new ? 'Started' : 'Patched'} ${tree.slug} (${tree.session}) in ${path.relative(process.cwd(), dir)}: ${counts.join(', ') || 'nothing'}.`);
if (questions.added.length) console.log(`New questions: ${questions.added.join(', ')}`);
