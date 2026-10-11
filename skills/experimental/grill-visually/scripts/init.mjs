#!/usr/bin/env node
// Start a grilling session: node init.mjs --title "Invite a teammate" [--slug invite-teammate]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { GRILL_DIR, parseArgs, fail, slugify, saveTree, saveMeta } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.title || args.title === true) fail('pass --title "What this session is about"');

const root = process.cwd();
const slug = slugify(args.slug && args.slug !== true ? args.slug : args.title);
const id = crypto.randomBytes(2).toString('hex');
const dir = path.join(root, GRILL_DIR, `${id}-${slug}`);
fs.mkdirSync(path.join(dir, 'rounds'), { recursive: true });

saveTree(dir, {
  session: id,
  slug,
  title: args.title,
  context: '',
  views: [],
  questions: [],
  facts: [],
});
saveMeta(dir, { session: id, slug, round: 0, hash: null, confirmed: false });

// git check-ignore exits 0 when ignored, 1 when not, 128 outside a repository.
function gitignoreStatus() {
  const { status } = spawnSync('git', ['check-ignore', '-q', path.relative(root, dir)], { cwd: root });
  if (status === 0) return 'ignored';
  if (status === 1) return 'not ignored (ask once whether to add .grill/ to .gitignore)';
  return 'not a git repository';
}

console.log(JSON.stringify({
  session: id,
  folder: path.relative(root, dir),
  gitignore: gitignoreStatus(),
}, null, 2));
