#!/usr/bin/env node
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const [itemId, ...extra] = process.argv.slice(2);
if (!itemId || extra.length > 0) {
  throw new Error("Usage: node .agents/skills/project-bootstrap/scripts/record-approval.mjs <item-id>");
}

const root = path.resolve(process.cwd());
const realRoot = await realpath(root);
const statePath = path.join(root, ".control-plane/bootstrap-state.json");
const state = JSON.parse(await readFile(statePath, "utf8"));
if (state.schemaVersion !== 1 || state.revisionAlgorithm !== "sha256-text-lf-v1" || !Array.isArray(state.items)) {
  throw new Error("Unsupported Bootstrap state schema. Run control-plane doctor for details.");
}

const byId = new Map(state.items.map((item) => [item.id, item]));
const target = byId.get(itemId);
if (!target) throw new Error(`Unknown Bootstrap item: ${itemId}`);

function safeRelative(value) {
  return typeof value === "string" &&
    value.length > 0 &&
    !value.includes("\\") &&
    !path.posix.isAbsolute(value) &&
    path.posix.normalize(value) === value &&
    value !== ".." &&
    !value.startsWith("../");
}

function insideRoot(candidate) {
  const relative = path.relative(realRoot, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function directInputs(item) {
  const inputs = new Set(item.inputs ?? []);
  for (const directory of item.inputDirectories ?? []) {
    if (!safeRelative(directory.path)) throw new Error(`Unsafe input directory: ${directory.path}`);
    const absolute = path.resolve(root, ...directory.path.split("/"));
    const resolved = await realpath(absolute);
    if (!insideRoot(resolved) || !(await lstat(absolute)).isDirectory()) {
      throw new Error(`Unsafe input directory: ${directory.path}`);
    }
    for (const entry of await readdir(absolute, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(directory.extension) && !(directory.exclude ?? []).includes(entry.name)) {
        inputs.add(`${directory.path}/${entry.name}`);
      }
    }
  }
  return [...inputs];
}

const scope = new Set();
const visited = new Set();
async function collect(id) {
  if (visited.has(id)) return;
  visited.add(id);
  const item = byId.get(id);
  if (!item) throw new Error(`Unknown dependency: ${id}`);
  for (const dependency of item.dependsOn ?? []) await collect(dependency);
  for (const input of await directInputs(item)) scope.add(input);
}
await collect(itemId);

const files = {};
for (const relative of [...scope].sort()) {
  if (!safeRelative(relative)) throw new Error(`Unsafe input path: ${relative}`);
  const absolute = path.resolve(root, ...relative.split("/"));
  const resolved = await realpath(absolute);
  if (!insideRoot(resolved) || !(await lstat(absolute)).isFile()) throw new Error(`Unsafe input file: ${relative}`);
  const bytes = await readFile(absolute);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/\r\n?/g, "\n");
  if (/(^|[^A-Za-z0-9_])TODO([^A-Za-z0-9_]|$)/.test(text)) {
    throw new Error(`Cannot record approval while a TODO placeholder remains: ${relative}`);
  }
  files[relative] = `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

target.approval = { status: "approved", files };
const temporary = `${statePath}.${process.pid}.tmp`;
await writeFile(temporary, JSON.stringify(state, null, 2) + "\n", { flag: "wx" });
await rename(temporary, statePath);
console.log(`Recorded explicit human approval for ${itemId} (${Object.keys(files).length} inputs).`);
