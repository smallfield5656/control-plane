import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { doctorProject, type DoctorReport } from "./doctor.js";

export type BootstrapPhase =
  | "Setup Incomplete"
  | "Bootstrap In Progress"
  | "Architecture Gate Pending"
  | "Needs Review"
  | "Bootstrap Complete";

export type BootstrapItemStatus = "Complete" | "Pending" | "Needs Review";

const REVIEW_INPUTS = [
  "docs/product/overview.md",
  "docs/product/requirements.md",
  "docs/product/constraints.md",
  "docs/delivery/charter.md",
  "docs/delivery/estimate.md",
  "docs/delivery/risks.md",
  "docs/delivery/milestones.md"
] as const;

export interface BootstrapStateItem {
  label: "Product Goal" | "Requirements" | "Constraints" | "Delivery" | "Architecture";
  status: BootstrapItemStatus;
}

export interface BootstrapAdr {
  file: string;
  title: string;
}

export interface BootstrapHumanGate {
  type: "Architecture Gate";
  adrs: BootstrapAdr[];
}

export interface BootstrapReport {
  root: string;
  phase: BootstrapPhase;
  state: BootstrapStateItem[];
  architectureGate: "Pending" | "None";
  reviewInputs: string[];
  humanGate?: BootstrapHumanGate;
  nextAction: string;
  hasErrors: boolean;
}

function checkOk(report: DoctorReport, label: string): boolean {
  return report.checks.find((check) => check.label === label)?.ok ?? false;
}

function bootstrapDocOk(report: DoctorReport, relative: string): boolean {
  return checkOk(report, `Bootstrap content: ${relative}`);
}

async function readText(root: string, relative: string): Promise<string | undefined> {
  try {
    return await readFile(path.join(root, relative), "utf8");
  } catch {
    return undefined;
  }
}

async function proposedAdrs(root: string): Promise<BootstrapAdr[]> {
  const adrDir = path.join(root, "docs/architecture/adr");
  let entries;
  try {
    entries = await readdir(adrDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const result: BootstrapAdr[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "0000-template.md" || entry.name === "README.md") {
      continue;
    }

    const relative = path.join("docs/architecture/adr", entry.name);
    const content = await readText(root, relative);
    if (!content || !/^\s*-\s*Status:\s*Proposed\s*$/im.test(content)) {
      continue;
    }

    const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
    result.push({
      file: relative.split(path.sep).join("/"),
      title: heading || entry.name
    });
  }

  return result.sort((a, b) => a.file.localeCompare(b.file));
}

function productState(report: DoctorReport): BootstrapStateItem[] {
  const setupIncomplete = report.status === "Setup Incomplete";
  const productGoal = setupIncomplete ? false : bootstrapDocOk(report, "docs/product/overview.md");
  const requirements = setupIncomplete ? false : bootstrapDocOk(report, "docs/product/requirements.md");
  const constraints = setupIncomplete ? false : bootstrapDocOk(report, "docs/product/constraints.md");
  const delivery = setupIncomplete
    ? false
    : [
        "docs/delivery/charter.md",
        "docs/delivery/estimate.md",
        "docs/delivery/risks.md",
        "docs/delivery/milestones.md"
      ].every((relative) => bootstrapDocOk(report, relative));

  let architecture: BootstrapItemStatus = "Pending";
  if (report.status === "Ready for Validation") {
    architecture = "Complete";
  } else if (report.status === "Needs Review") {
    architecture = "Needs Review";
  } else if (
    report.status === "Bootstrap In Progress" &&
    productGoal && requirements && constraints && delivery &&
    checkOk(report, "Current Architecture")
  ) {
    architecture = "Complete";
  }

  return [
    { label: "Product Goal", status: productGoal ? "Complete" : "Pending" },
    { label: "Requirements", status: requirements ? "Complete" : "Pending" },
    { label: "Constraints", status: constraints ? "Complete" : "Pending" },
    { label: "Delivery", status: delivery ? "Complete" : "Pending" },
    { label: "Architecture", status: architecture }
  ];
}

function nextAction(report: DoctorReport, phase: BootstrapPhase, proposed: BootstrapAdr[]): string {
  if (phase === "Setup Incomplete") {
    return "Control Planeの必須assetを復元するか、新しいProjectをinitしてください。";
  }
  if (phase === "Architecture Gate Pending") {
    return `${proposed.map((adr) => adr.title).join(", ")} を承認または却下してください。承認されるまでScaffoldや実装は開始しません。`;
  }
  if (phase === "Needs Review") {
    return "Proposed ADRとARCHITECTURE.mdの状態を確認してください。CLIは曖昧な状態を推測で確定しません。";
  }
  if (phase === "Bootstrap Complete") {
    return "Bootstrapは完了しています。control-plane check でProject全体をValidationしてください。";
  }

  const docsComplete = REVIEW_INPUTS.every((relative) => bootstrapDocOk(report, relative));
  if (!docsComplete) {
    return "agent/workflows/bootstrap.md に従い、Product Goal / Requirements / Constraints / Deliveryを整理してください。";
  }

  return "Project固有のREADMEなど、残っているBootstrap項目を完了してください。";
}

export async function bootstrapProject(rootDir = process.cwd()): Promise<BootstrapReport> {
  const report = await doctorProject(rootDir);
  const proposed = await proposedAdrs(report.root);

  const phase: BootstrapPhase =
    report.status === "Ready for Validation" ? "Bootstrap Complete" : report.status;
  const architectureGate = phase === "Architecture Gate Pending" ? "Pending" : "None";

  return {
    root: report.root,
    phase,
    state: productState(report),
    architectureGate,
    reviewInputs: [...REVIEW_INPUTS],
    humanGate:
      architectureGate === "Pending"
        ? { type: "Architecture Gate", adrs: proposed }
        : undefined,
    nextAction: nextAction(report, phase, proposed),
    hasErrors: report.hasErrors
  };
}

export function formatBootstrapReport(report: BootstrapReport): string {
  const lines = ["Control Plane Bootstrap", "", `Phase: ${report.phase}`, "", "Current State:"];
  for (const item of report.state) {
    lines.push(`  ${item.label.padEnd(18)} ${item.status}`);
  }

  lines.push("", `Architecture Gate: ${report.architectureGate}`);

  if (report.humanGate && report.humanGate.adrs.length > 0) {
    lines.push("", "Review Inputs:");
    for (const input of report.reviewInputs) {
      lines.push(`  ${input}`);
    }
  }

  lines.push("", "Human Gate:");
  if (report.humanGate && report.humanGate.adrs.length > 0) {
    for (const adr of report.humanGate.adrs) {
      lines.push(`  ${adr.title}`);
    }
    lines.push("", "Decision:");
    for (const adr of report.humanGate.adrs) {
      lines.push(`  ${adr.file}`);
    }
  } else {
    lines.push("  None");
  }

  lines.push("", "Next Action:", `  ${report.nextAction}`);
  return lines.join("\n");
}
