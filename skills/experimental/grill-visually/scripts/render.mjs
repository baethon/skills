#!/usr/bin/env node
// Render the next round: node render.mjs [--session 7f3a] [--no-open]
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  PAGE_FILE, PREVIOUS_FILE, parseArgs, fail, resolveSession, loadSession, saveMeta, writeJson, readJson,
  validateTree, hashTree, openInBrowser,
} from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const dir = resolveSession(args.session === true ? null : args.session);
const { tree, meta } = loadSession(dir);

const errors = validateTree(tree);
if (!(tree.questions || []).length) errors.push('tree.questions is empty. Write the first round before rendering.');
for (const q of (tree.questions || []).filter((q) => q.status === 'custom')) {
  errors.push(`question ${q.id}: has a custom answer that has not been interpreted yet. Write its decision and set status "settled", or re-ask it as "open" with new options.`);
}
if (errors.length) fail(`tree.json is not ready to render:\n- ${errors.join('\n- ')}`);

// An unchanged, unanswered round is reopened as is, so restarting the server keeps the user's answers valid.
const hash = hashTree(tree);
const pageFile = path.join(dir, PAGE_FILE);
const reuse = meta.hash === hash && meta.round > 0 && meta.appliedRound !== meta.round && fs.existsSync(pageFile);
const round = reuse ? meta.round : meta.round + 1;

if (!reuse) {
  const questions = tree.questions || [];
  const open = questions.filter((q) => q.status === 'open');
  const mode = open.length ? 'questions' : 'confirm';

  // What moved since the previous round.
  const prevFile = path.join(dir, PREVIOUS_FILE);
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

  const payload = {
    session: tree.session,
    slug: tree.slug,
    title: tree.title,
    context: tree.context || '',
    round,
    mode,
    views,
    questions,
    facts: tree.facts || [],
    changes: round > 1 ? changes : null,
  };

  writeJson(pageFile, payload);
  writeJson(prevFile, tree);
  saveMeta(dir, { ...meta, round, hash });

  console.log(`Rendered round ${round} (${mode === 'confirm' ? 'confirmation' : `${open.length} open`})`);
} else {
  console.log(`Tree unchanged since round ${round}, reopening it.`);
}
const { url, started } = await ensureServer();
console.log(`Open: ${url}`);
if (started && !args['no-open']) openInBrowser(url);

// Reuses the session's running server, so an open tab reloads itself instead of a new one opening.
async function ensureServer() {
  const serverFile = path.join(dir, 'server.json');
  const running = fs.existsSync(serverFile) ? readJson(serverFile) : null;
  if (running && await isUp(running.url)) return { url: running.url, started: false };

  fs.rmSync(serverFile, { force: true });
  spawn(process.execPath, [path.join(here, 'server.mjs'), '--session', dir], { detached: true, stdio: 'ignore' }).unref();
  for (let i = 0; i < 50; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (fs.existsSync(serverFile)) return { url: readJson(serverFile).url, started: true };
  }
  fail('the round is rendered, but its server did not start.');
}

async function isUp(url) {
  try {
    return (await fetch(`${url}state`, { signal: AbortSignal.timeout(1000) })).ok;
  } catch (error) {
    if (error.name === 'TimeoutError' || error.cause?.code === 'ECONNREFUSED') return false;
    throw error;
  }
}

