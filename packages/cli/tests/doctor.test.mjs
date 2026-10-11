import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(packageDir, "../..");
const moduleUrl = pathToFileURL(path.join(packageDir, "dist/doctor.js")).href;
const { doctorProject, formatDoctorReport } = await import(moduleUrl);

async function fixtureFromTemplate() {
  const root = await mkdtemp(path.join(tmpdir(), "control-plane-doctor-"));
  const project = path.join(root, "project");
  await cp(path.join(repoRoot, "template"), project, { recursive: true });
  return { root, project };
}

async function completeBootstrapDocs(project) {
  await writeFile(
    path.join(project, "docs/product/overview.md"),
    "# Product Overview\n\n## Problem\nNeed a tool.\n\n## Users\nDevelopers.\n\n## Goals\nShip safely.\n\n## Non-Goals\nCloud service.\n\n## Success Criteria\nValidation passes.\n"
  );
  await writeFile(
    path.join(project, "docs/product/requirements.md"),
    "# Requirements\n\n## Requirements\n\n### REQ-001: Run\n\n**Statement**\nRun locally.\n\n**Acceptance Criteria**\n- [ ] Runs.\n"
  );
  await writeFile(
    path.join(project, "docs/product/constraints.md"),
    "# Constraints\n\n## Platform\nDesktop.\n\n## Distribution\nLocal.\n\n## Security / Privacy\nNo sensitive data.\n\n## Network\nOffline.\n\n## Data\nLocal.\n\n## Operations\nSingle user.\n\n## Team / Skills\nOne maintainer.\n\n## Cost\nNo paid service.\n\n## Project Stage\nMVP.\n"
  );
  await writeFile(path.join(project, "docs/delivery/charter.md"), "# Project Charter\n\n## Scope\nMVP.\n");
  await writeFile(path.join(project, "docs/delivery/estimate.md"), "# Estimate\n\n## Confidence\nMedium.\n");
  await writeFile(path.join(project, "docs/delivery/risks.md"), "# Risks\n\n## Risk Register\nNo major risks.\n");
  await writeFile(path.join(project, "docs/delivery/milestones.md"), "# Milestones\n\n## Milestone Plan\nMVP.\n");
  approve(project, ["product-overview", "requirements", "constraints", "delivery"]);
}

function approve(project, items) {
  const script = path.join(packageDir, "dist/index.js");
  for (const item of items) {
    execFileSync(process.execPath, [script, "approve", item], { cwd: project, stdio: "pipe" });
  }
}

test("doctor reports Setup Incomplete when required assets are missing", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "control-plane-doctor-"));
  await mkdir(path.join(root, "docs"));

  const report = await doctorProject(root);

  assert.equal(report.status, "Setup Incomplete");
  assert.equal(report.hasErrors, true);
  assert.match(formatDoctorReport(report), /AGENTS\.md/);
  await rm(root, { recursive: true, force: true });
});

test("doctor reports Bootstrap In Progress for a freshly initialized template", async () => {
  const { root, project } = await fixtureFromTemplate();

  const report = await doctorProject(project);

  assert.equal(report.status, "Bootstrap In Progress");
  assert.equal(report.hasErrors, false);
  assert.match(report.nextAction, /bootstrap\.md/);
  await rm(root, { recursive: true, force: true });
});

test("doctor reports Architecture Gate Pending for completed docs with a Proposed ADR", async () => {
  const { root, project } = await fixtureFromTemplate();
  await completeBootstrapDocs(project);
  await writeFile(
    path.join(project, "docs/architecture/adr/0001-runtime.md"),
    "# ADR-0001: Runtime\n\n- Status: Proposed\n\n## Context\nChoose runtime.\n"
  );

  const report = await doctorProject(project);

  assert.equal(report.status, "Architecture Gate Pending");
  assert.match(report.nextAction, /0001-runtime\.md/);
  await rm(root, { recursive: true, force: true });
});

test("doctor reports Ready for Validation only after bootstrap documents, architecture, and README are resolved", async () => {
  const { root, project } = await fixtureFromTemplate();
  await completeBootstrapDocs(project);
  await writeFile(
    path.join(project, "ARCHITECTURE.md"),
    "# Architecture\n\n## Context\nCurrent architecture.\n\n## Technology Stack\nNode.js.\n"
  );
  await writeFile(
    path.join(project, "README.md"),
    "# Example Project\n\n## Purpose\nExample.\n\n## Validation\nRun scripts/check.sh.\n"
  );
  approve(project, ["architecture"]);

  const report = await doctorProject(project);

  assert.equal(report.status, "Ready for Validation");
  assert.equal(report.hasErrors, false);
  assert.match(report.nextAction, /scripts\/check\.\*/);
  await rm(root, { recursive: true, force: true });
});

for (const [content, pending] of [
  ["TODO", true], ["TODO: define constraints", true], ["- TODO", true],
  ["| Platform | TODO |", true], ["**TODO**", true],
  ["TODOList and MY_TODO are identifiers.", false], ["なし。外部接続を利用しないため。", false]
]) {
  test(`doctor classifies constraint marker ${JSON.stringify(content)}`, async (t) => {
    const { root, project } = await fixtureFromTemplate();
    t.after(() => rm(root, { recursive: true, force: true }));
    await completeBootstrapDocs(project);
    await writeFile(path.join(project, "docs/product/constraints.md"), content);
    const report = await doctorProject(project);
    assert.equal(report.checks.find((check) => check.label === "Bootstrap content: docs/product/constraints.md").ok, !pending);
  });
}
