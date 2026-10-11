import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(packageDir, "../..");
const moduleUrl = pathToFileURL(path.join(packageDir, "dist/init.js")).href;
const { initProject } = await import(moduleUrl);

test("init copies the template into a new directory", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "control-plane-init-"));
  const template = path.join(root, "template");
  const target = path.join(root, "project");
  await mkdir(path.join(template, "scripts"), { recursive: true });
  await writeFile(path.join(template, "AGENTS.md"), "agent rules\n");
  await writeFile(path.join(template, "scripts/check.sh"), "#!/usr/bin/env bash\n");

  await initProject(target, template);

  assert.equal(await readFile(path.join(target, "AGENTS.md"), "utf8"), "agent rules\n");
  assert.equal(await readFile(path.join(target, "scripts/check.sh"), "utf8"), "#!/usr/bin/env bash\n");
  await rm(root, { recursive: true, force: true });
});

test("init refuses to overwrite an existing directory", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "control-plane-init-"));
  const template = path.join(root, "template");
  const target = path.join(root, "project");
  await mkdir(template);
  await mkdir(target);
  await writeFile(path.join(template, "AGENTS.md"), "new\n");
  await writeFile(path.join(target, "keep.txt"), "keep\n");

  await assert.rejects(() => initProject(target, template), /Target already exists/);
  assert.equal(await readFile(path.join(target, "keep.txt"), "utf8"), "keep\n");
  await rm(root, { recursive: true, force: true });
});

test("init fails without leaving a target when the template is missing", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "control-plane-init-"));
  const target = path.join(root, "project");
  await assert.rejects(() => initProject(target, path.join(root, "missing")), /Template directory not found/);
  await assert.rejects(() => readFile(path.join(target, "AGENTS.md"), "utf8"));
  await rm(root, { recursive: true, force: true });
});

test("repository template contains the generated project contract", async () => {
  const template = path.join(repoRoot, "template");
  for (const relative of [
    "AGENTS.md",
    "ARCHITECTURE.md",
    "docs/product/overview.md",
    "docs/product/requirements.md",
    "docs/product/constraints.md",
    "docs/delivery/estimate.md",
    "docs/architecture/adr/0000-template.md",
    "agent/workflows/bootstrap.md",
    "agent/workflows/issue.md",
    "scripts/check.sh",
    "scripts/check.ps1"
  ]) {
    assert.ok((await readFile(path.join(template, relative), "utf8")).length >= 0, relative);
  }
});

test("estimate template separates AI elapsed time, human involvement, and human-only baseline", async () => {
  const estimate = await readFile(path.join(repoRoot, "template/docs/delivery/estimate.md"), "utf8");

  assert.match(estimate, /AI Agent Elapsed/);
  assert.match(estimate, /Human Involvement/);
  assert.match(estimate, /Human-only Equivalent/);
  assert.match(estimate, /単純合算しない/);
});

test("issue workflow preserves accepted ADR history when a decision changes", async () => {
  const issueWorkflow = await readFile(path.join(repoRoot, "template/agent/workflows/issue.md"), "utf8");

  assert.match(issueWorkflow, /すべての仕様変更でADRを作る必要はない/);
  assert.match(issueWorkflow, /Accepted ADR.*直接書き換え/);
  assert.match(issueWorkflow, /新しいDecision.*別ADR.*Proposed/);
  assert.match(issueWorkflow, /Supersedes/);
  assert.match(issueWorkflow, /旧ADR.*Superseded/);
  assert.match(issueWorkflow, /ARCHITECTURE\.md.*現在/);
});

test("ADR template distinguishes decision history from current architecture", async () => {
  const adrTemplate = await readFile(path.join(repoRoot, "template/docs/architecture/adr/0000-template.md"), "utf8");

  assert.match(adrTemplate, /Accepted.*Decision.*書き換え/);
  assert.match(adrTemplate, /Supersedes/);
  assert.match(adrTemplate, /Decision history/);
  assert.match(adrTemplate, /ARCHITECTURE\.md.*current state/);
});
