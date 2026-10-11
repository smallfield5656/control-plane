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

export interface BootstrapStateItem {
  id: string;
  label: string;
  status: BootstrapItemStatus;
  detail?: string;
  stage: string;
  inputs: string[];
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
  if (!report.bootstrapState) {
    return ["Product Goal", "Requirements", "Constraints", "Delivery", "Architecture"].map((label) => ({
      id: label.toLowerCase().replaceAll(" ", "-"),
      label,
      status: "Pending",
      detail: "Bootstrap state is unavailable",
      stage: "Setup Recovery",
      inputs: []
    }));
  }

  return report.bootstrapState.items.map((item) => {
    const unready = item.directInputs.some((relative) => {
      const check = report.checks.find((candidate) => candidate.label === `Bootstrap content: ${relative}`);
      return check ? !check.ok : false;
    });
    const architectureUnresolved = item.stage === "Architecture" && !checkOk(report, "Current Architecture");
    return {
      id: item.id,
      label: item.label,
      status: unready || architectureUnresolved ? "Pending" : item.status,
      detail:
        unready || architectureUnresolved
          ? "content is not ready for approval"
          : item.status === "Complete"
            ? undefined
            : item.detail,
      stage: item.stage,
      inputs: item.directInputs
    };
  });
}

function formatFileList(files: string[]): string {
  return files.join(" と ");
}

function guidance(report: DoctorReport, phase: BootstrapPhase, state: BootstrapStateItem[]): Pick<BootstrapReport, "nextStep" | "changeIntake" | "workOn" | "goal" | "suggestedInstruction"> {
  if (phase === "Setup Incomplete") {
    return { nextStep: "Setup Recovery", workOn: [] };
  }
  if (phase === "Architecture Gate Pending") {
    return { nextStep: "Architecture Gate", workOn: [] };
  }
  if (phase === "Needs Review") {
    const stale = state.filter((item) => item.status === "Needs Review");
    return {
      nextStep: "Needs Review",
      workOn: [...new Set(stale.flatMap((item) => item.inputs))],
      goal: "承認後に変更されたinputと影響する上流Decisionをレビューし、人間の明示的な再承認を得てください。",
      suggestedInstruction:
        "AGENTS.md と agent/workflows/bootstrap.md を読んでください。\n" +
        "Needs Reviewの項目について、承認時点からの変更と下流影響を説明してください。\n" +
        "人間が明示的に再承認した場合だけ、Project Bootstrap Skillのrecord-approval adapterで承認stateを更新してください。"
    };
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

  const pendingPreparation = state.find((item) => item.stage !== "Architecture" && item.status !== "Complete");
  if (pendingPreparation?.stage === "Product Definition") {
    const pendingProduct = state
      .filter((item) => item.stage === pendingPreparation.stage && item.status !== "Complete")
      .flatMap((item) => item.inputs);
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

  if (pendingPreparation?.stage === "Delivery Framing") {
    const pendingDelivery = state
      .filter((item) => item.stage === pendingPreparation.stage && item.status !== "Complete")
      .flatMap((item) => item.inputs);
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

  const architecture = state.find((item) => item.stage === "Architecture");
  if (architecture && architecture.status !== "Complete") {
    return {
      nextStep: "Architecture Gate",
      workOn: architecture.inputs,
      goal: "承認されたArchitecture Decisionと現在状態を確認し、人間の明示的な承認をCurrent Stateへ記録してください。",
      suggestedInstruction:
        "AGENTS.md と agent/workflows/bootstrap.md を読んでください。\n" +
        "Architecture DecisionとARCHITECTURE.mdの整合を確認してください。\n" +
        "人間が明示的に承認した場合だけ、Project Bootstrap Skillのrecord-approval adapterでarchitecture項目を更新してください。"
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
    return "承認後に変更されたinputと下流影響を確認し、人間の明示的な再承認を得てください。CLIは曖昧な状態を推測で確定しません。";
  }
  if (phase === "Bootstrap Complete") {
    return "変更要求がある場合はSuggested Instructionの <ここに変更したい内容を書く> を置き換えてAI Agentへ渡してください。現在のProjectを検証する場合は control-plane check を実行してください。";
  }
  return `${nextStep} を進めてください。`;
}

export async function bootstrapProject(rootDir = process.cwd()): Promise<BootstrapReport> {
  const report = await doctorProject(rootDir);
  const proposed = await proposedAdrs(report.root);
  const phase: BootstrapPhase = report.status === "Ready for Validation" ? "Bootstrap Complete" : report.status;

  const architectureGate = phase === "Architecture Gate Pending" ? "Pending" : "None";
  const state = productState(report);
  const stepGuidance = guidance(report, phase, state);
  const reviewInputs = report.bootstrapState
    ? [...new Set(report.bootstrapState.items.filter((item) => item.stage !== "Architecture").flatMap((item) => item.directInputs))]
    : [];

  return {
    root: report.root,
    phase,
    state,
    architectureGate,
    reviewInputs,
    humanGate: architectureGate === "Pending" ? { type: "Architecture Gate", adrs: proposed } : undefined,
    ...stepGuidance,
    nextAction: nextAction(phase, proposed, stepGuidance.nextStep),
    hasErrors: report.hasErrors
  };
}

export function formatBootstrapReport(report: BootstrapReport, styles: OutputStyles = plainStyles, title = "Control Plane Bootstrap"): string {
  const lines = [styles.heading(title), "", `Phase: ${styles.status(report.phase)}`, "", styles.heading("Current State:")];
  for (const item of report.state) {
    lines.push(`  ${item.label.padEnd(18)} ${styles.status(item.status)}${item.detail ? ` — ${item.detail}` : ""}`);
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
