#!/usr/bin/env node
// Print the shared understanding so far: node summary.mjs [--session 7f3a]
// Use it after context compaction, or when the user asks where things stand.
import { parseArgs, resolveSession, loadSession, summarize } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const dir = resolveSession(args.session === true ? null : args.session);
const { tree, meta } = loadSession(dir);
console.log(summarize(tree, meta));
console.log(`\nState lives in ${dir}/tree.json`);
