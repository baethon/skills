#!/usr/bin/env node
// Render the next round: node render.mjs [--session 7f3a] [--no-open]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseArgs, fail, resolveSession, loadSession, saveMeta, writeJson, readJson,
  validateTree, hashTree, openInBrowser, escapeRegex,
} from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const dir = resolveSession(args.session === true ? null : args.session);
const { tree, meta } = loadSession(dir);

const errors = validateTree(tree);
if (!(tree.questions || []).length) errors.push('tree.questions is empty. Write the first round before rendering.');
if (errors.length) fail(`tree.json is not ready to render:\n- ${errors.join('\n- ')}`);

const hash = hashTree(tree);
const reuse = meta.hash === hash && meta.round > 0 && meta.appliedRound !== meta.round && fs.existsSync(path.join(dir, `round-${meta.round}.html`));
const round = reuse ? meta.round : meta.round + 1;
const htmlFile = path.join(dir, `round-${round}.html`);

if (!reuse) {
  const questions = tree.questions || [];
  const open = questions.filter((q) => q.status === 'open');
  const mode = open.length ? 'questions' : 'confirm';

  // What moved since the previous round.
  const prevFile = path.join(dir, 'rounds', `round-${round - 1}.json`);
  const prev = fs.existsSync(prevFile) ? readJson(prevFile) : { questions: [], views: [] };
  const prevQ = new Map((prev.questions || []).map((q) => [q.id, q]));
  const prevV = new Map((prev.views || []).map((v) => [v.id, v]));
  const changes = {
    settled: questions.filter((q) => q.status === 'settled' && prevQ.get(q.id)?.status !== 'settled').map((q) => q.id),
    deferred: questions.filter((q) => q.status === 'deferred' && prevQ.get(q.id)?.status !== 'deferred').map((q) => q.id),
    reopened: questions.filter((q) => q.status === 'open' && ['settled', 'deferred'].includes(prevQ.get(q.id)?.status)).map((q) => q.id),
    added: questions.filter((q) => !prevQ.has(q.id)).map((q) => q.id),
    views: (tree.views || []).filter((v) => !prevV.has(v.id) || prevV.get(v.id).mermaid !== v.mermaid).map((v) => v.id),
  };

  // Mark nodes that open questions point at, so the diagram shows the frontier.
  const views = (tree.views || []).map((v) => {
    const nodes = open.filter((q) => q.view === v.id && q.node).map((q) => q.node);
    const isFlow = /^\s*(flowchart|graph)\b/.test(v.mermaid);
    const source = isFlow && nodes.length
      ? `${v.mermaid.trimEnd()}\n  classDef grillOpen fill:#FFE873,stroke:#8A6D00,stroke-width:1.5px,stroke-dasharray:5 4,color:#1D2733\n  class ${[...new Set(nodes)].join(',')} grillOpen`
      : v.mermaid;
    return { ...v, source };
  });

  // Show node labels instead of ids on the cards.
  const labelled = questions.map((q) => {
    const view = (tree.views || []).find((v) => v.id === q.view);
    if (!view || !q.node) return q;
    const m = new RegExp(`(?:^|[^A-Za-z0-9_])${escapeRegex(q.node)}\\s*[[({>]+\\s*"?([^\\])}"]+)`).exec(view.mermaid);
    return m ? { ...q, nodeLabel: m[1].trim() } : q;
  });

  const payload = {
    session: tree.session,
    slug: tree.slug,
    title: tree.title,
    context: tree.context || '',
    round,
    hash,
    mode,
    views,
    questions: labelled,
    facts: tree.facts || [],
    changes: round > 1 ? changes : null,
  };

  const template = fs.readFileSync(path.join(here, '..', 'assets', 'round-template.html'), 'utf8');
  const json = JSON.stringify(payload).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const html = template.split('__GRILL_DATA__').join(json).split('__GRILL_TITLE__').join(escapeHtml(`${tree.title}, round ${round}`));
  fs.writeFileSync(htmlFile, html);
  fs.mkdirSync(path.join(dir, 'rounds'), { recursive: true });
  writeJson(path.join(dir, 'rounds', `round-${round}.json`), tree);
  saveMeta(dir, { ...meta, round, hash, renderedAt: new Date().toISOString() });

  console.log(`Rendered round ${round} (${mode === 'confirm' ? 'confirmation' : `${open.length} open`}) tree=${hash}`);
} else {
  console.log(`Tree unchanged since round ${round}, reopening it.`);
}
console.log(`Open: ${htmlFile}`);
if (!args['no-open']) openInBrowser(htmlFile);

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
