// Shared helpers for the grill-visually scripts. No dependencies, Node 18+.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

export const GRILL_DIR = '.scratch/grilling';
export const STATUSES = ['open', 'settled', 'deferred', 'custom'];
export const TYPES = ['decision', 'term'];

export function fail(message) {
  console.error(`grill: ${message}`);
  process.exit(1);
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else { args[key] = next; i++; }
    } else args._.push(token);
  }
  return args;
}

// ---------- sessions ----------

export function listSessions(root = process.cwd()) {
  const dir = path.join(root, GRILL_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'tree.json')))
    .map((d) => path.join(dir, d.name));
}

// Accepts a folder path, a session id ("7f3a"), or nothing when exactly one session exists.
export function resolveSession(ref, root = process.cwd()) {
  if (ref && fs.existsSync(path.join(ref, 'tree.json'))) return path.resolve(ref);
  const sessions = listSessions(root);
  if (!ref) {
    if (sessions.length === 1) return sessions[0];
    if (sessions.length === 0) fail(`no sessions found in ${GRILL_DIR}/. Run init.mjs first.`);
    fail(`several sessions exist, pass --session <id>: ${sessions.map((s) => path.basename(s)).join(', ')}`);
  }
  const match = sessions.filter((s) => path.basename(s).startsWith(`${ref}-`) || path.basename(s) === ref);
  if (match.length === 1) return match[0];
  fail(`no session matches "${ref}". Known: ${sessions.map((s) => path.basename(s)).join(', ') || 'none'}`);
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

export function loadSession(dir) {
  return {
    dir,
    tree: readJson(path.join(dir, 'tree.json')),
    meta: readJson(path.join(dir, 'meta.json')),
  };
}

export function saveTree(dir, tree) { writeJson(path.join(dir, 'tree.json'), tree); }
export function saveMeta(dir, meta) { writeJson(path.join(dir, 'meta.json'), meta); }

export function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'session';
}

// ---------- hashing ----------

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, k) => { acc[k] = stable(value[k]); return acc; }, {});
  }
  return value;
}

export function hashTree(tree) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(tree))).digest('hex').slice(0, 6);
}

// ---------- validation ----------

export function validateTree(tree) {
  const errors = [];
  const err = (m) => errors.push(m);
  if (!tree.session) err('tree.session is missing');
  if (!tree.slug) err('tree.slug is missing');
  if (!tree.title) err('tree.title is missing');

  const views = tree.views || [];
  const viewIds = new Set();
  for (const v of views) {
    if (!v.id) { err('a view has no id'); continue; }
    if (viewIds.has(v.id)) err(`duplicate view id ${v.id}`);
    viewIds.add(v.id);
    if (!v.title) err(`view ${v.id} has no title`);
    if (!v.legend) err(`view ${v.id} has no legend saying what an arrow means`);
    if (!v.mermaid || !String(v.mermaid).trim()) err(`view ${v.id} has no mermaid source`);
  }

  const questions = tree.questions || [];
  const byId = new Map();
  for (const q of questions) {
    if (!q.id) { err('a question has no id'); continue; }
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(q.id)) err(`question id "${q.id}" must be letters and digits, starting with a letter`);
    if (byId.has(q.id)) err(`duplicate question id ${q.id}`);
    byId.set(q.id, q);
  }

  for (const q of questions) {
    const where = `question ${q.id}`;
    if (!TYPES.includes(q.type)) err(`${where}: type must be one of ${TYPES.join(', ')}`);
    if (!STATUSES.includes(q.status)) err(`${where}: status must be one of ${STATUSES.join(', ')}`);
    if (!q.title) err(`${where}: title is missing`);
    if (q.view && !viewIds.has(q.view)) err(`${where}: view "${q.view}" does not exist`);
    if (q.node) {
      const view = views.find((v) => v.id === q.view);
      if (!q.view) err(`${where}: node is set but view is not`);
      else if (view && !new RegExp(`(^|[^A-Za-z0-9_])${escapeRegex(q.node)}([^A-Za-z0-9_]|$)`).test(withoutLabels(view.mermaid))) {
        err(`${where}: node "${q.node}" does not appear in view ${q.view}`);
      }
    }
    for (const dep of q.dependsOn || []) {
      if (!byId.has(dep)) err(`${where}: dependsOn "${dep}" does not exist`);
    }

    const options = q.options || [];
    const optionIds = new Set();
    for (const o of options) {
      if (!o.id || !o.text) err(`${where}: every option needs id and text`);
      if (optionIds.has(o.id)) err(`${where}: duplicate option id ${o.id}`);
      optionIds.add(o.id);
      if (q.type === 'term' && (!o.glossary || !o.glossary.term || !o.glossary.definition)) {
        err(`${where}: term options need glossary.term and glossary.definition (option ${o.id})`);
      }
    }

    if (q.status === 'open') {
      if (options.length === 0) err(`${where}: open questions need at least one option`);
      if (!optionIds.has(q.recommended)) err(`${where}: recommended "${q.recommended}" is not one of its options`);
      if (!q.why) err(`${where}: open questions need "why" for the recommendation`);
      const blocked = (q.dependsOn || []).filter((d) => byId.get(d) && byId.get(d).status !== 'settled');
      if (blocked.length) err(`${where}: is open but depends on unsettled ${blocked.join(', ')}. Move it to a later round.`);
    }
    if (q.status === 'custom') err(`${where}: has a custom answer that has not been interpreted yet. Write its decision and set status "settled", or re-ask it as "open" with new options.`);
    if (q.status === 'settled') {
      if (!q.decision || !q.decision.text) err(`${where}: settled questions need decision.text`);
      if (q.type === 'term' && !(q.decision && q.decision.glossary && q.decision.glossary.term)) {
        err(`${where}: settled term questions need decision.glossary`);
      }
    }
  }

  return errors;
}

// Keeps only text where a node id can appear: drops the diagram header, comments,
// styling and click lines, and label text.
function withoutLabels(mermaid) {
  return mermaid.split('\n')
    .filter((line) => !/^\s*(%%|(flowchart|graph|classDef|class|style|linkStyle|click)\b)/.test(line))
    .join('\n')
    .replace(/"[^"]*"|\[[^\]]*\]|\([^)]*\)|\{[^}]*\}|\|[^|]*\|/g, ' ');
}

export function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ---------- answer DSL ----------

function tokenize(line) {
  const tokens = [];
  const re = /"((?:[^"\\]|\\.)*)"|(\S+)/g;
  let m;
  while ((m = re.exec(line))) {
    if (m[1] !== undefined) tokens.push({ quoted: true, value: m[1].replace(/\\n/g, '\n').replace(/\\(["\\])/g, '$1') });
    else tokens.push({ quoted: false, value: m[2] });
  }
  return tokens;
}

export function quote(text) {
  return `"${String(text).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n')}"`;
}

// Returns { header, answers, notes, confirm, errors }
export function parseAnswers(text) {
  const result = { header: null, answers: [], notes: [], confirm: false, errors: [] };
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  for (const line of lines) {
    const tokens = tokenize(line);
    const [first, ...rest] = tokens;
    if (!first) continue;
    if (first.value === 'grill' && !first.quoted) {
      const header = {};
      for (const t of rest) {
        const [k, v] = t.value.split('=');
        header[k] = v;
      }
      result.header = header;
      continue;
    }
    if (first.value === 'confirm') { result.confirm = true; continue; }
    if (first.value === 'note') {
      if (rest[0] && rest[0].quoted) result.notes.push(rest[0].value);
      else result.errors.push(`note needs quoted text: ${line}`);
      continue;
    }
    const id = first.value;
    const verb = rest[0] && rest[0].value;
    if (verb === 'accept' || verb === 'defer') {
      result.answers.push({ id, verb, note: rest[1] && rest[1].quoted ? rest[1].value : null });
    } else if (verb === 'alt') {
      const option = rest[1] && !rest[1].quoted ? rest[1].value : null;
      if (!option) { result.errors.push(`alt needs an option id: ${line}`); continue; }
      result.answers.push({ id, verb, option, note: rest[2] && rest[2].quoted ? rest[2].value : null });
    } else if (verb === 'other' || verb === 'reopen') {
      if (!(rest[1] && rest[1].quoted && rest[1].value.trim())) { result.errors.push(`${verb} needs quoted text: ${line}`); continue; }
      result.answers.push({ id, verb, note: rest[1].value });
    } else {
      result.errors.push(`cannot read line: ${line}`);
    }
  }
  if (!result.header) result.errors.push('the first line must be the header, e.g. "grill session=7f3a round=3 tree=a41f2c"');
  return result;
}

// ---------- summary ----------

export function summarize(tree, meta) {
  const qs = tree.questions || [];
  const out = [];
  out.push(`# Shared understanding: ${tree.title}`);
  out.push('');
  out.push(`Session ${tree.session} (${tree.slug}), round ${meta.round}, ${meta.confirmed ? 'confirmed' : 'not confirmed yet'}.`);
  if (tree.context) out.push('', tree.context);

  const settled = qs.filter((q) => q.status === 'settled' && q.type === 'decision');
  if (settled.length) {
    out.push('', '## Decisions');
    for (const q of settled) {
      out.push('', `### ${q.id} ${q.title}`, q.decision.text);
      if (q.decision.why) out.push(`Why: ${q.decision.why}`);
      else out.push('Why: not given.');
      if (q.decision.rejected && q.decision.rejected.length) out.push(`Rejected: ${q.decision.rejected.join('; ')}`);
    }
  }
  const terms = qs.filter((q) => q.status === 'settled' && q.type === 'term');
  if (terms.length) {
    out.push('', '## Vocabulary');
    for (const q of terms) {
      const g = q.decision.glossary;
      out.push(`- ${g.term}: ${g.definition}${g.avoid && g.avoid.length ? ` (avoid: ${g.avoid.join(', ')})` : ''}`);
    }
  }
  const deferred = qs.filter((q) => q.status === 'deferred');
  if (deferred.length) {
    out.push('', '## Deferred, do not decide silently');
    for (const q of deferred) out.push(`- ${q.id} ${q.title}${q.answer && q.answer.note ? `: ${q.answer.note}` : ''}`);
  }
  const open = qs.filter((q) => q.status === 'open' || q.status === 'custom');
  if (open.length) {
    out.push('', '## Still open');
    for (const q of open) out.push(`- ${q.id} ${q.title} (${q.status})`);
  }
  if (tree.facts && tree.facts.length) {
    out.push('', '## Facts found');
    for (const f of tree.facts) out.push(`- ${f.text}${f.source ? ` (${f.source})` : ''}`);
  }
  return out.join('\n');
}

// ---------- browser ----------

export function openInBrowser(file) {
  const cmd = process.platform === 'darwin' ? ['open', [file]]
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', file]]
      : ['xdg-open', [file]];
  try {
    const child = spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore' });
    child.on('error', () => {});
    child.unref();
  } catch { /* the path is printed anyway */ }
}
