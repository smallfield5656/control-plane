import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { plainStyles, type OutputStyles } from "./output.js";
import { doctorProject, type DoctorReport } from "./doctor.js";

export type BootstrapPhase =
  | "Setup Incomplete"
  | "Bootstrap In Progress"
  | "Architecture Gate Pending"
  | "Needs Review"
  | "Bootstrap Complete";

export type BootstrapItemStatus = "Complete" | "Pending" | "Needs Review";
export type BootstrapNextStep =
  | "Setup Recovery"
  | "Product Definition"
  | "Delivery Framing"
  | "Architecture Preparation"
  | "Architecture Gate"
  | "Needs Review"
  | "Bootstrap Finalization"
  | "Ongoing Development";

const PRODUCT_FILES = [
  "docs/product/overview.md",
  "docs/product/requirements.md",
  "docs/product/constraints.md"
] as const;

const DELIVERY_FILES = [
  "docs/delivery/charter.md",
  "docs/delivery/estimate.md",
  "docs/delivery/risks.md",
  "docs/delivery/milestones.md"
] as const;

const REVIEW_INPUTS = [...PRODUCT_FILES, ...DELIVERY_FILES] as const;

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
  nextStep: BootstrapNextStep;
  changeIntake?: "GitHub Issue";
  workOn: string[];
  goal?: string;
  suggestedInstruction?: string;
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

function productState(report: DoctorReport, phase: BootstrapPhase): BootstrapStateItem[] {
  const setupIncomplete = report.status === "Setup Incomplete";
  const productGoal = setupIncomplete ? false : bootstrapDocOk(report, "docs/product/overview.md");
  const requirements = setupIncomplete ? false : bootstrapDocOk(report, "docs/product/requirements.md");
  const constraints = setupIncomplete ? false : bootstrapDocOk(report, "docs/product/constraints.md");
  const delivery = setupIncomplete ? false : DELIVERY_FILES.every((relative) => bootstrapDocOk(report, relative));

  let architecture: BootstrapItemStatus = "Pending";
  if (phase === "Bootstrap Complete" || (phase === "Bootstrap In Progress" && checkOk(report, "Current Architecture"))) {
    architecture = "Complete";
  } else if (phase === "Needs Review") {
    architecture = "Needs Review";
  }

  return [
    { label: "Product Goal", status: productGoal ? "Complete" : "Pending" },
    { label: "Requirements", status: requirements ? "Complete" : "Pending" },
    { label: "Constraints", status: constraints ? "Complete" : "Pending" },
    { label: "Delivery", status: delivery ? "Complete" : "Pending" },
    { label: "Architecture", status: architecture }
  ];
}

function formatFileList(files: string[]): string {
  return files.join(" と ");
}

function guidance(report: DoctorReport, phase: BootstrapPhase): Pick<BootstrapReport, "nextStep" | "changeIntake" | "workOn" | "goal" | "suggestedInstruction"> {
  if (phase === "Setup Incomplete") {
    return { nextStep: "Setup Recovery", workOn: [] };
  }
  if (phase === "Architecture Gate Pending") {
    return { nextStep: "Architecture Gate", workOn: [] };
  }
  if (phase === "Needs Review") {
    return { nextStep: "Needs Review", workOn: ["ARCHITECTURE.md", "docs/architecture/adr/"] };
  }
  if (phase === "Bootstrap Complete") {
    return {
      nextStep: "Ongoing Development",
      changeIntake: "GitHub Issue",
      workOn: [],
      goal: "変更要求をGitHub Issueとして受け付け、Issue Workflowに従って影響分析から実装まで進めてください。",
      suggestedInstruction:
        "AGENTS.md と agent/workflows/issue.md を読んでください。\n" +
        "次の変更要求についてGitHub Issueを作成してください。\n" +
        "変更内容: <ここに変更したい内容を書く>\n" +
        "Issue作成後、Requirements / Constraints / Architecture / Cost / Risk / Timelineへの影響を分析し、必要なCurrent Truthを更新してください。\n" +
        "Architecture Decisionの変更が必要な場合は、新しいADRをProposedとして作成し、実装せずHuman Gateで停止してください。"
    };
  }

  const pendingProduct = PRODUCT_FILES.filter((relative) => !bootstrapDocOk(report, relative));
  if (pendingProduct.length > 0) {
    return {
      nextStep: "Product Definition",
      workOn: [...pendingProduct],
      goal: "Product Goalと主要Requirements / Acceptance Criteria、必要なConstraintsを定義してください。",
      suggestedInstruction:
        `AGENTS.md と agent/workflows/bootstrap.md を読んでください。\n` +
        `私と壁打ちしながらProduct Definitionを進め、${formatFileList([...pendingProduct])} を更新してください。\n` +
        "ArchitectureやTechnologyの選定には進まないでください。"
    };
  }

  const pendingDelivery = DELIVERY_FILES.filter((relative) => !bootstrapDocOk(report, relative));
  if (pendingDelivery.length > 0) {
    return {
      nextStep: "Delivery Framing",
      workOn: [...pendingDelivery],
      goal: "Scope / Estimate / Risks / Milestonesを必要な粒度で整理してください。",
      suggestedInstruction:
        `AGENTS.md と agent/workflows/bootstrap.md を読んでください。\n` +
        `Product Goal、Requirements、Constraintsを前提として、${formatFileList([...pendingDelivery])} を整理してください。\n` +
        "ArchitectureやTechnologyの選定にはまだ進まないでください。"
    };
  }

  if (!checkOk(report, "Current Architecture")) {
    return {
      nextStep: "Architecture Preparation",
      workOn: ["docs/architecture/adr/"],
      goal: "Requirements / Constraints / DeliveryからArchitecture / Technology候補を比較し、判断が必要ならProposed ADRを準備してください。",
      suggestedInstruction:
        "AGENTS.md と agent/workflows/bootstrap.md を読んでください。\n" +
        "Requirements、Constraints、Delivery情報を確認し、Architecture / Technology候補を比較してください。\n" +
        "長期的なDecisionは docs/architecture/adr/ にProposed ADRとして記録し、Acceptedには変更せずArchitecture Gateで停止してください。"
    };
  }

  return {
    nextStep: "Bootstrap Finalization",
    workOn: ["README.md"],
    goal: "Bootstrap後のProject入口とValidation導線を完成させてください。",
    suggestedInstruction:
      "AGENTS.md と agent/workflows/bootstrap.md を読んでください。\n" +
      "AcceptedなArchitectureを前提として、README.mdをProject固有の入口に更新してください。\n" +
      "必要なBootstrap項目を完了し、最後に control-plane check を実行できる状態にしてください。"
  };
}

function nextAction(phase: BootstrapPhase, proposed: BootstrapAdr[], nextStep: BootstrapNextStep): string {
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
    return "変更要求がある場合はSuggested Instructionの <ここに変更したい内容を書く> を置き換えてAI Agentへ渡してください。現在のProjectを検証する場合は control-plane check を実行してください。";
  }
  return `${nextStep} を進めてください。`;
}

export async function bootstrapProject(rootDir = process.cwd()): Promise<BootstrapReport> {
  const report = await doctorProject(rootDir);
  const proposed = await proposedAdrs(report.root);
  const architectureUnresolved = !checkOk(report, "Current Architecture");

  let phase: BootstrapPhase = report.status === "Ready for Validation" ? "Bootstrap Complete" : report.status;
  if (report.status === "Needs Review" && proposed.length === 0 && architectureUnresolved) {
    phase = "Bootstrap In Progress";
  }

  const architectureGate = phase === "Architecture Gate Pending" ? "Pending" : "None";
  const stepGuidance = guidance(report, phase);

  return {
    root: report.root,
    phase,
    state: productState(report, phase),
    architectureGate,
    reviewInputs: [...REVIEW_INPUTS],
    humanGate: architectureGate === "Pending" ? { type: "Architecture Gate", adrs: proposed } : undefined,
    ...stepGuidance,
    nextAction: nextAction(phase, proposed, stepGuidance.nextStep),
    hasErrors: report.hasErrors
  };
}

export function formatBootstrapReport(report: BootstrapReport, styles: OutputStyles = plainStyles, title = "Control Plane Bootstrap"): string {
  const lines = [styles.heading(title), "", `Phase: ${styles.status(report.phase)}`, "", styles.heading("Current State:")];
  for (const item of report.state) {
    lines.push(`  ${item.label.padEnd(18)} ${styles.status(item.status)}`);
  }

  lines.push("", `Architecture Gate: ${styles.status(report.architectureGate)}`);

  if (report.humanGate && report.humanGate.adrs.length > 0) {
    lines.push("", styles.heading("Review Inputs:"));
    for (const input of report.reviewInputs) {
      lines.push(`  ${input}`);
    }
  }

  lines.push("", styles.heading("Human Gate:"));
  if (report.humanGate && report.humanGate.adrs.length > 0) {
    for (const adr of report.humanGate.adrs) {
      lines.push(`  ${adr.title}`);
    }
    lines.push("", styles.heading("Decision:"));
    for (const adr of report.humanGate.adrs) {
      lines.push(`  ${adr.file}`);
    }
  } else {
    lines.push("  None");
  }

  lines.push("", styles.heading("Next Step:"), `  ${styles.heading(report.nextStep)}`);

  if (report.changeIntake) {
    lines.push("", styles.heading("Change Intake:"), `  ${report.changeIntake}`);
  }

  if (report.workOn.length > 0) {
    lines.push("", styles.heading("Work On:"));
    for (const file of report.workOn) {
      lines.push(`  ${file}`);
    }
  }

  if (report.goal) {
    lines.push("", styles.heading("Goal:"), `  ${report.goal}`);
  }

  if (report.suggestedInstruction) {
    lines.push("", styles.heading("Suggested Instruction:"));
    for (const line of report.suggestedInstruction.split("\n")) {
      lines.push(`  ${line}`);
    }
  }

  lines.push("", styles.heading("Next Action:"), `  ${report.nextAction}`);
  return lines.join("\n");
}
