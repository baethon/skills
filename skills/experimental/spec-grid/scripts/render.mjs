#!/usr/bin/env node
// Usage: node render.mjs <grid.json>
// Validates the grid data and writes <grid>.html next to it.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KINDS = ["yes", "part", "no", "na", "silent"];

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node render.mjs <grid.json>");
  process.exit(1);
}

const data = JSON.parse(readFileSync(inputPath, "utf8"));
const errors = validate(data);
if (errors.length) {
  console.error(`Grid data is invalid:\n${errors.map(e => `- ${e}`).join("\n")}`);
  process.exit(1);
}

const template = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../assets/grid-template.html"), "utf8");
const json = JSON.stringify(data).replace(/</g, "\\u003c");
const html = template
  .replace("__TITLE__", () => escapeHtml(stripTags(data.title)))
  .replace("/*__DATA__*/null", () => json);

const outputPath = inputPath.replace(/\.json$/, "") + ".html";
writeFileSync(outputPath, html);

const cells = data.grids.flatMap(grid => grid.rows.flatMap(row => row.cells));
console.log(`Wrote ${outputPath}`);
console.log(`Cells: ${cells.length} · derived: ${cells.filter(c => c.derived).length} · silent: ${cells.filter(c => c.k === "silent").length}`);

function validate(data) {
  const errors = [];
  if (typeof data.title !== "string" || !data.title) errors.push("title is required");
  if (!Array.isArray(data.grids) || !data.grids.length) return [...errors, "grids must be a non-empty array"];

  const gridIds = new Set();
  data.grids.forEach((grid, g) => {
    const at = `grids[${g}] (${grid.id ?? "no id"})`;
    if (!grid.id || gridIds.has(grid.id)) errors.push(`${at}: id is missing or not unique`);
    gridIds.add(grid.id);
    if (!grid.title) errors.push(`${at}: title is required`);
    if (!Array.isArray(grid.cols) || !grid.cols.length) return errors.push(`${at}: cols must be a non-empty array`);
    if (!Array.isArray(grid.rows) || !grid.rows.length) return errors.push(`${at}: rows must be a non-empty array`);
    grid.rows.forEach((row, r) => {
      const rowAt = `${at} row "${row.name ?? r}"`;
      if (!row.name) errors.push(`${rowAt}: name is required`);
      if (row.cells?.length !== grid.cols.length) return errors.push(`${rowAt}: needs exactly ${grid.cols.length} cells, one per column`);
      row.cells.forEach((cell, c) => errors.push(...validateCell(cell, `${rowAt} / "${grid.cols[c]}"`)));
    });
  });

  const hasSilent = data.grids.some(grid => grid.rows.some(row => row.cells?.some(cell => cell.k === "silent")));
  if (hasSilent && !data.gaps?.length) errors.push("gaps: every silent cell must be listed as a gap, but gaps is empty");
  (data.gaps ?? []).forEach((gap, i) => {
    if (!gap.title || !gap.text) errors.push(`gaps[${i}]: title and text are required`);
  });
  (data.sequence?.steps ?? []).forEach((step, i) => {
    if (!step.v) errors.push(`sequence.steps[${i}]: v is required`);
  });
  if (data.sequence && !data.sequence.title) errors.push("sequence.title is required");
  return errors;
}

function validateCell(cell, at) {
  if (!KINDS.includes(cell.k)) return [`${at}: k must be one of ${KINDS.join(", ")}`];
  if (cell.k === "silent") {
    return cell.d || cell.s || cell.derived
      ? [`${at}: a silent cell carries no detail, source or derived flag, because the spec says nothing`]
      : [];
  }
  const errors = [];
  if (cell.k !== "na" && !cell.s) errors.push(`${at}: s (spec source) is required`);
  if (cell.derived && cell.k === "na") errors.push(`${at}: an n/a cell cannot be derived`);
  return errors;
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, "");
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
