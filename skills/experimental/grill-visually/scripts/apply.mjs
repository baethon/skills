#!/usr/bin/env node
// Apply pasted answers: node apply.mjs [--session 7f3a] < answers.txt
// The session is taken from the paste header when --session is not given.
import fs from 'node:fs';
import {
  parseArgs, fail, resolveSession, loadSession, saveTree, saveMeta,
  parseAnswers, summarize,
} from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const parsed = parseAnswers(fs.readFileSync(0, 'utf8'));
if (parsed.errors.length) fail(`could not read the answers:\n- ${parsed.errors.join('\n- ')}`);

const { header } = parsed;
const dir = resolveSession(args.session && args.session !== true ? args.session : header.session);
const { tree, meta } = loadSession(dir);

if (header.session !== tree.session) {
  fail(`these answers belong to session ${header.session}, but this is ${tree.session} (${tree.slug}). Paste them into the right conversation.`);
}
if (Number(header.round) !== meta.round || header.tree !== meta.hash) {
  fail(`these answers come from round ${header.round} (tree=${header.tree}), but the latest round is ${meta.round} (tree=${meta.hash}). Ask the user to answer the latest page: ${dir}/round-${meta.round}.html`);
}
if (meta.appliedRound === meta.round) {
  fail(`round ${meta.round} answers were already applied. Update tree.json and run render.mjs, then ask the user to answer the new page.`);
}

const byId = new Map((tree.questions || []).map((q) => [q.id, q]));
const report = { settled: [], terms: [], deferred: [], custom: [], reopened: [], noReason: [], skipped: [] };

for (const a of parsed.answers) {
  const q = byId.get(a.id);
  if (!q) { report.skipped.push(`${a.id}: no such question`); continue; }
  const answer = { verb: a.verb, option: a.option || null, note: a.note, round: meta.round };

  if (a.verb === 'reopen') {
    if (!['settled', 'deferred'].includes(q.status)) { report.skipped.push(`${a.id}: only settled or deferred questions can be reopened`); continue; }
    (q.history ||= []).push({ answer: q.answer || null, decision: q.decision || null, reopened: { round: meta.round, reason: a.note } });
    q.status = 'open';
    q.answer = null;
    q.decision = null;
    q.reopened = { round: meta.round, reason: a.note };
    report.reopened.push(`${a.id}: ${a.note}`);
    continue;
  }

  if (q.status !== 'open') { report.skipped.push(`${a.id}: is ${q.status}, not open`); continue; }
  q.answer = answer;
  delete q.reopened;

  if (a.verb === 'accept' || a.verb === 'alt') {
    const chosenId = a.verb === 'accept' ? q.recommended : a.option;
    const chosen = q.options.find((o) => o.id === chosenId);
    if (!chosen) { q.answer = null; report.skipped.push(`${a.id}: option ${chosenId} does not exist`); continue; }
    const why = [a.verb === 'accept' ? q.why : null, a.note].filter(Boolean)
      .join(' ') || null;
    q.decision = {
      text: chosen.text,
      why,
      rejected: q.options.filter((o) => o.id !== chosenId).map((o) => o.text),
      ...(chosen.glossary ? { glossary: chosen.glossary } : {}),
    };
    q.status = 'settled';
    if (q.type === 'term') report.terms.push(q.decision.glossary);
    report.settled.push(`${a.id} ${a.verb === 'accept' ? 'accept' : `alt ${chosenId}`}`);
    if (!why) report.noReason.push(a.id);
  } else if (a.verb === 'defer') {
    q.status = 'deferred';
    q.decision = null;
    report.deferred.push(a.id + (a.note ? `: ${a.note}` : ''));
  } else if (a.verb === 'other') {
    q.status = 'custom';
    q.decision = null;
    report.custom.push(`${a.id}: ${a.note}`);
  }
}

const lines = [`Applied round ${meta.round} answers to ${tree.slug} (${tree.session}).`];
const add = (label, list) => { if (list.length) lines.push(`${label}: ${list.join(' | ')}`); };
add('Settled', report.settled);
add('Deferred', report.deferred);
add('Reopened', report.reopened);
add('Needs your interpretation (write decision, then status "settled", or re-ask as "open")', report.custom);
for (const g of report.terms) {
  lines.push(`Term settled, write it to the glossary now: ${g.term}: ${g.definition}${g.avoid?.length ? ` (avoid: ${g.avoid.join(', ')})` : ''}${g.replaces?.length ? ` (replaces: ${g.replaces.join(', ')})` : ''}`);
}
add('Alternative chosen without a reason (ask if it matters)', report.noReason);
add('Skipped', report.skipped);
for (const n of parsed.notes) lines.push(`General note from the user: ${n}`);

meta.appliedRound = meta.round;
const stillOpen = (tree.questions || []).filter((q) => ['open', 'custom'].includes(q.status));
if (parsed.confirm && !report.reopened.length && !stillOpen.length) {
  meta.confirmed = true;
  saveTree(dir, tree);
  saveMeta(dir, meta);
  lines.push('Confirmed. Shared understanding reached.', '', summarize(tree, meta));
  console.log(lines.join('\n'));
  process.exit(0);
}
if (parsed.confirm) lines.push('Confirm ignored because questions were reopened or are still open.');

saveTree(dir, tree);
saveMeta(dir, meta);
lines.push('Next: update tree.json (interpret custom answers, add the new frontier, update views), then run render.mjs.');
console.log(lines.join('\n'));
