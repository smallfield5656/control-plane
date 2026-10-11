import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "control-plane-staging-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const template = path.join(root, "template");
  const cli = path.join(root, "packages/cli");
  const script = path.join(cli, "scripts/stage-template.mjs");
  await mkdir(template, { recursive: true });
  await mkdir(path.dirname(script), { recursive: true });
  await cp(path.join(packageDir, "scripts/stage-template.mjs"), script);
  await writeFile(path.join(template, ".gitignore"), ".env\n");
  await writeFile(path.join(template, "AGENTS.md"), "fixture contract\n");
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["add", "template"], { cwd: root });
  return { root, template, cli, script, stage: () => execFileSync(process.execPath, [script], { cwd: root, encoding: "utf8", stdio: "pipe" }) };
}

test("staging preserves tracked assets and excludes ignored and untracked local files", async (t) => {
  const f = await fixture(t);
  for (const name of [".env", "auth.json", "private.key", "local-notes.txt"]) {
    await writeFile(path.join(f.template, name), "synthetic fixture; no real credential\n");
  }
  f.stage();
  assert.equal(await readFile(path.join(f.cli, "template/AGENTS.md"), "utf8"), "fixture contract\n");
  assert.equal(await readFile(path.join(f.cli, "template/gitignore.template"), "utf8"), ".env\n");
  for (const name of [".env", "auth.json", "private.key", "local-notes.txt"]) {
    await assert.rejects(() => readFile(path.join(f.cli, "template", name)), { code: "ENOENT" });
  }
});

test("source-tree CLI uses the staged contract rather than copying the working template directory", async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.template, ".env"), "synthetic fixture; no real credential\n");
  f.stage();
  await cp(path.join(packageDir, "dist"), path.join(f.cli, "dist"), { recursive: true });
  await cp(path.join(packageDir, "package.json"), path.join(f.cli, "package.json"));
  const target = path.join(f.root, "generated");
  execFileSync(process.execPath, [path.join(f.cli, "dist/index.js"), "init", target], { encoding: "utf8", stdio: "pipe" });
  assert.equal(await readFile(path.join(target, ".gitignore"), "utf8"), ".env\n");
  await assert.rejects(() => readFile(path.join(target, ".env")), { code: "ENOENT" });
});

test("staging rejects credential-shaped paths even when forcibly tracked", async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.template, ".env"), "synthetic fixture; no real credential\n");
  execFileSync("git", ["add", "-f", "template/.env"], { cwd: f.root });
  assert.throws(f.stage, /Forbidden template asset/);
});

test("staging rejects symbolic links to files outside the template", { skip: process.platform === "win32" }, async (t) => {
  const f = await fixture(t);
  const outside = path.join(f.root, "outside.txt");
  await writeFile(outside, "outside template\n");
  await symlink(outside, path.join(f.template, "linked.md"));
  execFileSync("git", ["add", "template/linked.md"], { cwd: f.root });
  assert.throws(f.stage, /regular file/);
});

test("staging rejects a working-tree directory replaced by an external symbolic link", { skip: process.platform === "win32" }, async (t) => {
  const f = await fixture(t);
  await mkdir(path.join(f.template, "docs"));
  await writeFile(path.join(f.template, "docs/example.md"), "tracked sample\n");
  execFileSync("git", ["add", "template/docs/example.md"], { cwd: f.root });
  await rm(path.join(f.template, "docs"), { recursive: true });
  const outside = path.join(f.root, "outside");
  await mkdir(outside);
  await writeFile(path.join(outside, "example.md"), "outside template\n");
  await symlink(outside, path.join(f.template, "docs"));
  assert.throws(f.stage, /outside the template/);
});

test("staging rejects a source asset that would overwrite the transported gitignore", async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.template, "gitignore.template"), "conflicting source asset\n");
  execFileSync("git", ["add", "template/gitignore.template"], { cwd: f.root });
  assert.throws(f.stage, /Reserved template asset/);
});

test("staging rejects a root directory replaced by a symbolic link", { skip: process.platform === "win32" }, async (t) => {
  const f = await fixture(t);
  const outside = path.join(f.root, "outside");
  await cp(f.template, outside, { recursive: true });
  await rm(f.template, { recursive: true });
  await symlink(outside, f.template);
  assert.throws(f.stage, /Template source not found/);
});
