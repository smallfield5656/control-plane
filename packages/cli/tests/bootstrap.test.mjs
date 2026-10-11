import assert from "node:assert/strict";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(packageDir, "../..");
const moduleUrl = pathToFileURL(path.join(packageDir, "dist/bootstrap.js")).href;

const reviewInputs = [
  "docs/product/overview.md",
  "docs/product/requirements.md",
  "docs/product/constraints.md",
  "docs/delivery/charter.md",
  "docs/delivery/estimate.md",
  "docs/delivery/risks.md",
  "docs/delivery/milestones.md"
];

async function fixtureFromTemplate() {
  const root = await mkdtemp(path.join(tmpdir(), "control-plane-bootstrap-"));
  const project = path.join(root, "project");
  await cp(path.join(repoRoot, "template"), project, { recursive: true });
  return { root, project };
}

async function completeBootstrapDocs(project) {
  await writeFile(path.join(project, "docs/product/overview.md"), "# Product Overview\n\n## Problem\nNeed a tool.\n\n## Users\nDevelopers.\n\n## Goals\nShip safely.\n\n## Non-Goals\nCloud service.\n\n## Success Criteria\nValidation passes.\n");
  await writeFile(path.join(project, "docs/product/requirements.md"), "# Requirements\n\n## Requirements\n\n### REQ-001: Run\n\n**Statement**\nRun locally.\n\n**Acceptance Criteria**\n- [ ] Runs.\n");
  await writeFile(path.join(project, "docs/product/constraints.md"), "# Constraints\n\n## Platform\nDesktop.\n\n## Distribution\nLocal.\n\n## Security / Privacy\nNo sensitive data.\n\n## Network\nOffline.\n\n## Data\nLocal.\n\n## Operations\nSingle user.\n\n## Team / Skills\nOne maintainer.\n\n## Cost\nNo paid service.\n\n## Project Stage\nMVP.\n");
  await writeFile(path.join(project, "docs/delivery/charter.md"), "# Project Charter\n\n## Scope\nMVP.\n");
  await writeFile(path.join(project, "docs/delivery/estimate.md"), "# Estimate\n\n## Confidence\nMedium.\n");
  await writeFile(path.join(project, "docs/delivery/risks.md"), "# Risks\n\n## Risk Register\nNo major risks.\n");
  await writeFile(path.join(project, "docs/delivery/milestones.md"), "# Milestones\n\n## Milestone Plan\nMVP.\n");
}

test("bootstrap reports fresh template progress with Japanese guidance", async () => {
  const { root, project } = await fixtureFromTemplate();
  const { bootstrapProject, formatBootstrapReport } = await import(moduleUrl);

  const report = await bootstrapProject(project);
  const output = formatBootstrapReport(report);

  assert.equal(report.phase, "Bootstrap In Progress");
  assert.match(output, /Current State:/);
  assert.match(output, /Product Goal\s+Pending/);
  assert.match(output, /Next Action:/);
  assert.match(output, /Product Goal \/ Requirements \/ Constraints \/ Delivery/);
  assert.match(output, /Human Gate:\s+None/);
  await rm(root, { recursive: true, force: true });
});

test("bootstrap exposes review inputs and a Proposed ADR as a decision-oriented human gate", async () => {
  const { root, project } = await fixtureFromTemplate();
  await completeBootstrapDocs(project);
  await writeFile(
    path.join(project, "docs/architecture/adr/0001-runtime.md"),
    "# ADR-0001: React + IndexedDBを採用する\n\n- Status: Proposed\n\n## Context\nChoose runtime.\n"
  );
  const { bootstrapProject, formatBootstrapReport } = await import(moduleUrl);

  const report = await bootstrapProject(project);
  const output = formatBootstrapReport(report);

  assert.equal(report.phase, "Architecture Gate Pending");
  assert.deepEqual(report.reviewInputs, reviewInputs);
  assert.deepEqual(report.humanGate?.adrs.map((adr) => adr.title), ["ADR-0001: React + IndexedDBを採用する"]);
  assert.deepEqual(report.humanGate?.adrs.map((adr) => adr.file), ["docs/architecture/adr/0001-runtime.md"]);
  assert.match(output, /Architecture Gate:\s+Pending/);
  assert.match(output, /Review Inputs:/);
  for (const reviewInput of reviewInputs) {
    assert.match(output, new RegExp(reviewInput.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(output, /Human Gate:/);
  assert.match(output, /ADR-0001: React \+ IndexedDBを採用する/);
  assert.match(output, /Decision:/);
  assert.match(output, /docs\/architecture\/adr\/0001-runtime\.md/);
  assert.match(output, /承認または却下してください/);
  await rm(root, { recursive: true, force: true });
});

test("bootstrap reports completion when bootstrap state is resolved", async () => {
  const { root, project } = await fixtureFromTemplate();
  await completeBootstrapDocs(project);
  await writeFile(path.join(project, "ARCHITECTURE.md"), "# Architecture\n\n## Context\nCurrent architecture.\n\n## Technology Stack\nNode.js.\n");
  await writeFile(path.join(project, "README.md"), "# Example Project\n\n## Purpose\nExample.\n\n## Validation\nRun scripts/check.sh.\n");
  const { bootstrapProject, formatBootstrapReport } = await import(moduleUrl);

  const report = await bootstrapProject(project);
  const output = formatBootstrapReport(report);

  assert.equal(report.phase, "Bootstrap Complete");
  assert.match(output, /Human Gate:\s+None/);
  assert.match(output, /control-plane check/);
  await rm(root, { recursive: true, force: true });
});
