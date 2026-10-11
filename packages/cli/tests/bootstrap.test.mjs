import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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

async function completeProductDefinition(project) {
  await writeFile(path.join(project, "docs/product/overview.md"), "# Product Overview\n\n## Problem\nNeed a tool.\n\n## Users\nDevelopers.\n\n## Goals\nShip safely.\n\n## Non-Goals\nCloud service.\n\n## Success Criteria\nValidation passes.\n");
  await writeFile(path.join(project, "docs/product/requirements.md"), "# Requirements\n\n## Requirements\n\n### REQ-001: Run\n\n**Statement**\nRun locally.\n\n**Acceptance Criteria**\n- [ ] Runs.\n");
  await writeFile(path.join(project, "docs/product/constraints.md"), "# Constraints\n\n## Platform\nDesktop.\n\n## Distribution\nLocal.\n\n## Security / Privacy\nNo sensitive data.\n\n## Network\nOffline.\n\n## Data\nLocal.\n\n## Operations\nSingle user.\n\n## Team / Skills\nOne maintainer.\n\n## Cost\nNo paid service.\n\n## Project Stage\nMVP.\n");
}

async function completeDelivery(project) {
  await writeFile(path.join(project, "docs/delivery/charter.md"), "# Project Charter\n\n## Scope\nMVP.\n");
  await writeFile(path.join(project, "docs/delivery/estimate.md"), "# Estimate\n\n## Confidence\nMedium.\n");
  await writeFile(path.join(project, "docs/delivery/risks.md"), "# Risks\n\n## Risk Register\nNo major risks.\n");
  await writeFile(path.join(project, "docs/delivery/milestones.md"), "# Milestones\n\n## Milestone Plan\nMVP.\n");
}

async function completeBootstrapDocs(project) {
  await completeProductDefinition(project);
  await completeDelivery(project);
  approve(project, ["product-goal", "requirements", "constraints", "delivery"]);
}

function approve(project, items) {
  const script = path.join(project, ".agents/skills/project-bootstrap/scripts/record-approval.mjs");
  for (const item of items) {
    execFileSync(process.execPath, [script, item], { cwd: project, stdio: "pipe" });
  }
}

test("bootstrap turns fresh project state into copyable Product Definition guidance", async () => {
  const { root, project } = await fixtureFromTemplate();
  const { bootstrapProject, formatBootstrapReport } = await import(moduleUrl);

  const report = await bootstrapProject(project);
  const output = formatBootstrapReport(report);

  assert.equal(report.phase, "Bootstrap In Progress");
  assert.equal(report.nextStep, "Product Definition");
  assert.deepEqual(report.workOn, ["docs/product/overview.md", "docs/product/requirements.md", "docs/product/constraints.md"]);
  assert.deepEqual(report.state.map((item) => item.status), Array(5).fill("Pending"));
  assert.match(output, /Next Step:\s+Product Definition/);
  assert.match(output, /Work On:\s+docs\/product\/overview\.md\s+docs\/product\/requirements\.md/);
  assert.match(output, /Goal:/);
  assert.match(output, /Product Goalと主要Requirements \/ Acceptance Criteria/);
  assert.match(output, /Suggested Instruction:/);
  assert.match(output, /docs\/product\/overview\.md と docs\/product\/requirements\.md と docs\/product\/constraints\.md を更新してください/);
  assert.doesNotMatch(output, /上記ファイル/);
  assert.match(output, /ArchitectureやTechnologyの選定には進まないでください/);
  assert.match(output, /Human Gate:\s+None/);
  await rm(root, { recursive: true, force: true });
});

test("bootstrap moves to Delivery Framing and lists only incomplete delivery files", async () => {
  const { root, project } = await fixtureFromTemplate();
  await completeProductDefinition(project);
  approve(project, ["product-goal", "requirements", "constraints"]);
  const { bootstrapProject, formatBootstrapReport } = await import(moduleUrl);

  const report = await bootstrapProject(project);
  const output = formatBootstrapReport(report);

  assert.equal(report.nextStep, "Delivery Framing");
  assert.deepEqual(report.workOn, [
    "docs/delivery/charter.md",
    "docs/delivery/estimate.md",
    "docs/delivery/risks.md",
    "docs/delivery/milestones.md"
  ]);
  assert.match(output, /Suggested Instruction:/);
  assert.match(output, /docs\/delivery\/charter\.md/);
  assert.match(output, /docs\/delivery\/estimate\.md/);
  assert.match(output, /docs\/delivery\/risks\.md と docs\/delivery\/milestones\.md/);
  assert.match(output, /ArchitectureやTechnologyの選定にはまだ進まないでください/);
  await rm(root, { recursive: true, force: true });
});

test("bootstrap moves to Architecture Preparation after durable inputs are complete", async () => {
  const { root, project } = await fixtureFromTemplate();
  await completeBootstrapDocs(project);
  const { bootstrapProject, formatBootstrapReport } = await import(moduleUrl);

  const report = await bootstrapProject(project);
  const output = formatBootstrapReport(report);

  assert.equal(report.nextStep, "Architecture Preparation");
  assert.deepEqual(report.workOn, ["docs/architecture/adr/"]);
  assert.match(output, /Architecture \/ Technology候補を比較/);
  assert.match(output, /docs\/architecture\/adr\//);
  assert.match(output, /Proposed ADR/);
  assert.match(output, /Architecture Gateで停止してください/);
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
  assert.equal(report.nextStep, "Architecture Gate");
  assert.deepEqual(report.reviewInputs, reviewInputs);
  assert.deepEqual(report.humanGate?.adrs.map((adr) => adr.title), ["ADR-0001: React + IndexedDBを採用する"]);
  assert.deepEqual(report.humanGate?.adrs.map((adr) => adr.file), ["docs/architecture/adr/0001-runtime.md"]);
  assert.match(output, /Review Inputs:/);
  assert.match(output, /Human Gate:/);
  assert.match(output, /Decision:/);
  assert.match(output, /承認または却下してください/);
  assert.doesNotMatch(output, /Suggested Instruction:/);
  await rm(root, { recursive: true, force: true });
});

test("bootstrap guides finalization after architecture is resolved", async () => {
  const { root, project } = await fixtureFromTemplate();
  await completeBootstrapDocs(project);
  await writeFile(path.join(project, "ARCHITECTURE.md"), "# Architecture\n\n## Context\nCurrent architecture.\n\n## Technology Stack\nNode.js.\n");
  approve(project, ["architecture"]);
  const { bootstrapProject, formatBootstrapReport } = await import(moduleUrl);

  const report = await bootstrapProject(project);
  const output = formatBootstrapReport(report);

  assert.equal(report.phase, "Bootstrap In Progress");
  assert.equal(report.nextStep, "Bootstrap Finalization");
  assert.deepEqual(report.workOn, ["README.md"]);
  assert.match(output, /README\.mdをProject固有の入口に更新してください/);
  assert.match(output, /control-plane check/);
  await rm(root, { recursive: true, force: true });
});

test("bootstrap bridges a completed project into issue-driven ongoing development", async () => {
  const { root, project } = await fixtureFromTemplate();
  await completeBootstrapDocs(project);
  await writeFile(path.join(project, "ARCHITECTURE.md"), "# Architecture\n\n## Context\nCurrent architecture.\n\n## Technology Stack\nNode.js.\n");
  approve(project, ["architecture"]);
  await writeFile(path.join(project, "README.md"), "# Example Project\n\n## Purpose\nExample.\n\n## Validation\nRun scripts/check.sh.\n");
  const { bootstrapProject, formatBootstrapReport } = await import(moduleUrl);

  const report = await bootstrapProject(project);
  const output = formatBootstrapReport(report);

  assert.equal(report.phase, "Bootstrap Complete");
  assert.equal(report.nextStep, "Ongoing Development");
  assert.equal(report.changeIntake, "GitHub Issue");
  assert.deepEqual(report.workOn, []);
  assert.match(output, /Human Gate:\s+None/);
  assert.match(output, /Next Step:\s+Ongoing Development/);
  assert.match(output, /Change Intake:\s+GitHub Issue/);
  assert.match(output, /Suggested Instruction:/);
  assert.match(output, /AGENTS\.md と agent\/workflows\/issue\.md を読んでください/);
  assert.match(output, /変更内容: <ここに変更したい内容を書く>/);
  assert.match(output, /GitHub Issueを作成してください/);
  assert.match(output, /Architecture Decisionの変更が必要な場合/);
  assert.match(output, /Proposed/);
  assert.match(output, /Human Gateで停止してください/);
  assert.match(output, /control-plane check/);
  assert.doesNotMatch(output, /Issue #\d+/);
  await rm(root, { recursive: true, force: true });
});
