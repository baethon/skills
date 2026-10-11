#!/usr/bin/env node
// Start a grilling session: node init.mjs --title "Invite a teammate" [--slug invite-teammate]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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

console.log(JSON.stringify({
  session: id,
  folder: path.relative(root, dir),
}, null, 2));
