import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(packageDir, "../..");
const bootstrapUrl = pathToFileURL(path.join(packageDir, "dist/bootstrap.js")).href;
const doctorUrl = pathToFileURL(path.join(packageDir, "dist/doctor.js")).href;
const stateRelative = ".control-plane/bootstrap-state.json";

function initialState() {
  return {
    schemaVersion: 1,
    revisionAlgorithm: "sha256-text-lf-v1",
    items: [
      {
        id: "product-goal",
        label: "Product Goal",
        stage: "Product Definition",
        inputs: ["docs/product/overview.md"],
        inputDirectories: [],
        dependsOn: [],
        approval: null
      },
      {
        id: "requirements",
        label: "Requirements",
        stage: "Product Definition",
        inputs: ["docs/product/requirements.md"],
        inputDirectories: [],
        dependsOn: ["product-goal"],
        approval: null
      },
      {
        id: "constraints",
        label: "Constraints",
        stage: "Product Definition",
        inputs: ["docs/product/constraints.md"],
        inputDirectories: [],
        dependsOn: ["requirements"],
        approval: null
      },
      {
        id: "delivery",
        label: "Delivery",
        stage: "Delivery Framing",
        inputs: [
          "docs/delivery/charter.md",
          "docs/delivery/estimate.md",
          "docs/delivery/risks.md",
          "docs/delivery/milestones.md"
        ],
        inputDirectories: [],
        dependsOn: ["constraints"],
        approval: null
      },
      {
        id: "architecture",
        label: "Architecture",
        stage: "Architecture",
        inputs: ["ARCHITECTURE.md"],
        inputDirectories: [
          {
            path: "docs/architecture/adr",
            extension: ".md",
            exclude: ["0000-template.md", "README.md"]
          }
        ],
        dependsOn: ["delivery"],
        approval: null
      }
    ]
  };
}

async function fixture({ withState = true } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "control-plane-approval-"));
  const project = path.join(root, "project");
  await cp(path.join(repoRoot, "template"), project, { recursive: true });
  if (withState) {
    await mkdir(path.join(project, ".control-plane"), { recursive: true });
    await writeFile(path.join(project, stateRelative), JSON.stringify(initialState(), null, 2) + "\n");
  } else {
    await rm(path.join(project, stateRelative), { force: true });
  }
  return { root, project };
}

async function completeDocs(project) {
  await writeFile(path.join(project, "docs/product/overview.md"), "# Product Overview\n\n## Problem\nNeed a tool.\n\n## Users\nDevelopers.\n\n## Goals\nShip safely.\n\n## Non-Goals\nCloud service.\n\n## Success Criteria\nValidation passes.\n");
  await writeFile(path.join(project, "docs/product/requirements.md"), "# Requirements\n\n## Requirements\n\n### REQ-001: Run\n\n**Statement**\nRun locally.\n\n**Acceptance Criteria**\n- [ ] Runs.\n");
  await writeFile(path.join(project, "docs/product/constraints.md"), "# Constraints\n\n## Platform\nDesktop.\n\n## Distribution\nLocal.\n\n## Security / Privacy\nNo sensitive data.\n\n## Network\nOffline.\n\n## Data\nLocal.\n\n## Operations\nSingle user.\n\n## Team / Skills\nOne maintainer.\n\n## Cost\nNo paid service.\n\n## Project Stage\nMVP.\n");
  await writeFile(path.join(project, "docs/delivery/charter.md"), "# Project Charter\n\n## Scope\nMVP.\n");
  await writeFile(path.join(project, "docs/delivery/estimate.md"), "# Estimate\n\n## Confidence\nMedium.\n");
  await writeFile(path.join(project, "docs/delivery/risks.md"), "# Risks\n\n## Risk Register\nNo major risks.\n");
  await writeFile(path.join(project, "docs/delivery/milestones.md"), "# Milestones\n\n## Milestone Plan\nMVP.\n");
}

function hashText(content) {
  return `sha256:${createHash("sha256").update(content.replace(/\r\n?/g, "\n"), "utf8").digest("hex")}`;
}

async function approve(project, itemId) {
  const statePath = path.join(project, stateRelative);
  const state = JSON.parse(await readFile(statePath, "utf8"));
  const byId = new Map(state.items.map((item) => [item.id, item]));
  const scope = new Set();
  const visit = async (id) => {
    const item = byId.get(id);
    assert.ok(item, id);
    for (const dependency of item.dependsOn) await visit(dependency);
    for (const input of item.inputs) scope.add(input);
  };
  await visit(itemId);
  const files = {};
  for (const input of [...scope].sort()) {
    files[input] = hashText(await readFile(path.join(project, input), "utf8"));
  }
  byId.get(itemId).approval = { status: "approved", files };
  await writeFile(statePath, JSON.stringify(state, null, 2) + "\n");
}

test("completed content remains pending until a human approval is recorded", async (t) => {
  const { root, project } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await completeDocs(project);
  const { bootstrapProject, formatBootstrapReport } = await import(bootstrapUrl);

  const report = await bootstrapProject(project);
  const output = formatBootstrapReport(report);

  assert.equal(report.nextStep, "Product Definition");
  assert.equal(report.state.find((item) => item.label === "Product Goal")?.status, "Pending");
  assert.match(output, /awaiting explicit human approval/i);
});

test("matching explicit approvals advance product definition to delivery framing", async (t) => {
  const { root, project } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await completeDocs(project);
  for (const item of ["product-goal", "requirements", "constraints"]) await approve(project, item);
  const { bootstrapProject } = await import(bootstrapUrl);

  const report = await bootstrapProject(project);

  assert.equal(report.nextStep, "Delivery Framing");
  assert.deepEqual(report.state.slice(0, 3).map((item) => item.status), ["Complete", "Complete", "Complete"]);
  assert.equal(report.state[3].status, "Pending");
});

test("changing an approved upstream input invalidates it and downstream approvals", async (t) => {
  const { root, project } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await completeDocs(project);
  for (const item of ["product-goal", "requirements", "constraints", "delivery"]) await approve(project, item);
  await writeFile(path.join(project, "docs/product/overview.md"), "# Product Overview\n\nChanged after approval.\n");
  const { bootstrapProject } = await import(bootstrapUrl);

  const report = await bootstrapProject(project);

  assert.equal(report.phase, "Needs Review");
  assert.equal(report.nextStep, "Needs Review");
  assert.deepEqual(report.state.slice(0, 4).map((item) => item.status), Array(4).fill("Needs Review"));
});

test("missing approval state is setup incomplete instead of using legacy inference", async (t) => {
  const { root, project } = await fixture({ withState: false });
  t.after(() => rm(root, { recursive: true, force: true }));
  await completeDocs(project);
  const { doctorProject } = await import(doctorUrl);

  const report = await doctorProject(project);

  assert.equal(report.status, "Setup Incomplete");
  assert.equal(report.hasErrors, true);
  assert.match(report.nextAction, /bootstrap-state\.json|migration/i);
});

test("unsafe approval input paths are rejected conservatively", async (t) => {
  const { root, project } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(project, stateRelative);
  const state = JSON.parse(await readFile(statePath, "utf8"));
  state.items[0].inputs = ["../outside.md"];
  await writeFile(statePath, JSON.stringify(state, null, 2) + "\n");
  const { doctorProject } = await import(doctorUrl);

  const report = await doctorProject(project);

  assert.equal(report.status, "Setup Incomplete");
  assert.equal(report.hasErrors, true);
  assert.match(report.nextAction, /invalid Bootstrap state/i);
});

test("legacy approval migration preserves explicit upstream records and includes individual ADR inputs", async (t) => {
  const { root, project } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await completeDocs(project);
  for (const item of ["product-goal", "requirements", "constraints", "delivery"]) await approve(project, item);
  await writeFile(path.join(project, "ARCHITECTURE.md"), "# Architecture\n\n## Technology Stack\nNode.js.\n");
  await writeFile(
    path.join(project, "docs/architecture/adr/0001-runtime.md"),
    "# ADR-0001: Runtime\n\n- Status: Accepted\n\n## Context\nChoose runtime.\n\n## Decision\nUse Node.js.\n\n## Consequences\nNode.js required.\n"
  );
  const script = path.join(packageDir, "dist/index.js");
  for (const args of [["migrate"], ["migrate", "adr", "0001"], ["approve", "architecture"]]) {
    execFileSync(process.execPath, [script, ...args], { cwd: project, stdio: "pipe" });
  }

  const state = JSON.parse(await readFile(path.join(project, stateRelative), "utf8"));
  const files = state.items.find((item) => item.id === "architecture").approval.files;
  assert.ok(files["ARCHITECTURE.md"]);
  assert.ok(files["docs/architecture/adr/0001-runtime.md"]);
  const { bootstrapProject } = await import(bootstrapUrl);
  const report = await bootstrapProject(project);
  assert.equal(report.state.find((item) => item.id === "architecture")?.status, "Complete");
});

test("cyclic or forward Bootstrap dependencies are rejected", async (t) => {
  const { root, project } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = path.join(project, stateRelative);
  const state = JSON.parse(await readFile(statePath, "utf8"));
  state.items[0].dependsOn = ["requirements"];
  await writeFile(statePath, JSON.stringify(state, null, 2) + "\n");
  const { doctorProject } = await import(doctorUrl);

  const report = await doctorProject(project);

  assert.equal(report.status, "Setup Incomplete");
  assert.match(report.nextAction, /dependency cycle|must appear earlier/i);
});
