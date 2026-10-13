#!/usr/bin/env node
// PreToolUse hook: deny direct edits to session files, which only the scripts may write.
import { readFileSync } from 'node:fs';

const { tool_input: input = {} } = JSON.parse(readFileSync(0, 'utf8'));
const path = input.file_path ?? input.notebook_path ?? '';

if (!path.includes('.scratch/grilling/')) {
  process.exit(0);
}

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: 'Session files are written by the grill-visually scripts. Change tree.json through patch.mjs.',
  },
}));
