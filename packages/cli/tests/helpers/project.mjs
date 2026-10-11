import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const cli = path.join(packageDir, "dist/index.js");
export const stateFile = ".control-plane/bootstrap-state.json";
export async function fixture(t, { legacy = false, prepared = true } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "control-plane decisions "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(path.resolve(packageDir, "../../template"), root, { recursive: true });
  const state = JSON.parse(await readFile(path.join(root, stateFile), "utf8"));
  state.schemaVersion = legacy ? 1 : 2;
  const overview = state.items[0];
  overview.id = legacy ? "product-goal" : "product-overview";
  overview.label = legacy ? "Product Goal" : "Product Overview";
  state.items[1].dependsOn = [overview.id];
  if (legacy) delete state.adr;
  else state.adr = { directory: "docs/architecture/adr", architectureItem: "architecture", dependsOn: ["delivery"], decisions: {} };
  await write(root, stateFile, JSON.stringify(state, null, 2) + "\n");
  if (prepared) {
    for (const item of state.items) {
      for (const input of item.inputs) await write(root, input, `# ${item.label}\n\nReady for review.\n`);
    }
    await write(root, "README.md", "# My Project\n\nRun control-plane check.\n");
  }
  return root;
}
export function run(root, ...args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" });
}
export function ok(root, ...args) {
  const result = run(root, ...args);
  assert.equal(result.status, 0, `${args.join(" ")}: ${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
export async function write(root, relative, text) {
  await writeFile(path.join(root, relative), text);
}
export async function read(root, relative) { return readFile(path.join(root, relative), "utf8"); }
export async function state(root) { return JSON.parse(await read(root, stateFile)); }
export function upstream(root, first = "product-overview") {
  for (const id of [first, "requirements", "constraints", "delivery"]) ok(root, "approve", id);
}
export function adr(number = "0001", status = "Proposed", supersedes = "—") {
  return `# ADR-${number}: Runtime\n\n- Status: ${status}\n- Date: 2026-10-11\n- Supersedes: ${supersedes}\n- Superseded By: —\n\n## Context\nNeed a runtime.\n\n## Decision\nUse Node.js.\n\n## Consequences\nRequires Node.js.\n`;
}
