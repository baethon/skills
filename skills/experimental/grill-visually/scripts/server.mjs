#!/usr/bin/env node
// Serve one session's latest round: node server.mjs --session <folder>
// render.mjs starts it; there's no need to run it by hand.
// It stops once the session is confirmed, or after an hour with no requests.
// GET /       the latest round page
// GET /state  {round, applied, confirmed}, polled by the page to reload itself and to see the confirmation
// POST /apply runs apply.mjs on a base64url answers body and returns its report
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs, fail, resolveSession, readJson, writeJson } from './lib.mjs';

const IDLE_LIMIT_MS = 60 * 60 * 1000;
const MAX_BODY_BYTES = 1024 * 1024;

const here = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
if (!args.session || args.session === true) fail('pass --session <folder>');
const dir = resolveSession(args.session);
const serverFile = path.join(dir, 'server.json');
let lastRequest = Date.now();

const server = http.createServer((req, res) => {
  lastRequest = Date.now();
  // Only answer requests addressed to this loopback port, so a DNS-rebound site can't read the session.
  if (req.headers.host !== `127.0.0.1:${server.address().port}`) return send(res, 403, 'Forbidden host.');
  if (req.method === 'GET' && req.url === '/') return sendRound(res);
  if (req.method === 'GET' && req.url === '/state') return sendState(res);
  if (req.method === 'POST' && req.url === '/apply') return applyAnswers(req, res);
  send(res, 404, 'Not found.');
});

server.listen(0, '127.0.0.1', () => {
  writeJson(serverFile, { pid: process.pid, url: `http://127.0.0.1:${server.address().port}/` });
});

// ponytail: idle timeout instead of lifecycle tracking; an open tab polls, so it keeps the server alive.
// Without an open tab, a confirmed session is noticed here instead of in sendState.
setInterval(() => {
  if (Date.now() - lastRequest < IDLE_LIMIT_MS && !readMeta().confirmed) return;
  stop();
}, 60 * 1000).unref();
process.on('SIGTERM', stop);
process.on('SIGINT', stop);

function stop() {
  const current = fs.existsSync(serverFile) ? readJson(serverFile) : null;
  if (current?.pid === process.pid) fs.rmSync(serverFile);
  process.exit(0);
}

function readMeta() {
  return readJson(path.join(dir, 'meta.json'));
}

function sendRound(res) {
  const { round } = readMeta();
  const file = path.join(dir, `round-${round}.html`);
  if (!fs.existsSync(file)) return send(res, 404, 'No round rendered yet.');
  send(res, 200, fs.readFileSync(file), 'text/html; charset=utf-8');
}

function sendState(res) {
  const meta = readMeta();
  const state = { round: meta.round, applied: meta.appliedRound === meta.round, confirmed: !!meta.confirmed };
  // The page has now seen the confirmation, so the session needs no server.
  if (state.confirmed) res.on('finish', stop);
  send(res, 200, JSON.stringify(state), 'application/json');
}

function applyAnswers(req, res) {
  // Browsers always send Origin on POST and curl never does, so this keeps web pages from submitting answers.
  if (req.headers.origin) return send(res, 403, 'Answers are applied from the terminal, not the browser.');

  const chunks = [];
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) req.destroy();
    else chunks.push(chunk);
  });
  req.on('end', () => {
    const answers = Buffer.concat(chunks).toString('utf8').trim();
    const apply = path.join(here, 'apply.mjs');
    execFile(process.execPath, [apply, '--session', dir, '--answers', answers], (error, stdout, stderr) => {
      send(res, error ? 422 : 200, stdout + stderr);
    });
  });
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}
