import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  BOOTSTRAP_STATE_FILE,
  BootstrapStateError,
  readBootstrapState,
  hasBootstrapPlaceholder,
  type ResolvedBootstrapState
} from "./bootstrap-state.js";
import { inspectAdrs, type AdrCheck } from "./adr.js";
import { APPROVAL_JOURNAL, transactionPending } from "./approval-transaction.js";
import { plainStyles, type OutputStyles } from "./output.js";

export type DoctorStatus =
  | "Setup Incomplete"
  | "Bootstrap In Progress"
  | "Architecture Gate Pending"
  | "Needs Review"
  | "Ready for Validation";

export interface DoctorCheck {
  label: string;
  ok: boolean;
  detail?: string;
}

export interface DoctorReport {
  root: string;
  status: DoctorStatus;
  checks: DoctorCheck[];
  nextAction: string;
  hasErrors: boolean;
  bootstrapState?: ResolvedBootstrapState;
  adrChecks?: AdrCheck[];
}

const REQUIRED_FILES = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "README.md",
  BOOTSTRAP_STATE_FILE,
  "docs/product/overview.md",
  "docs/product/requirements.md",
  "docs/product/constraints.md",
  "docs/delivery/charter.md",
  "docs/delivery/estimate.md",
  "docs/delivery/risks.md",
  "docs/delivery/milestones.md",
  "docs/architecture/adr/0000-template.md",
  "agent/workflows/bootstrap.md"
] as const;

const BOOTSTRAP_DOCS = [
  "docs/product/overview.md",
  "docs/product/requirements.md",
  "docs/product/constraints.md",
  "docs/delivery/charter.md",
  "docs/delivery/estimate.md",
  "docs/delivery/risks.md",
  "docs/delivery/milestones.md"
] as const;

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readText(root: string, relative: string): Promise<string | undefined> {
  try {
    return await readFile(path.join(root, relative), "utf8");
  } catch {
    return undefined;
  }
}

async function proposedAdrs(root: string): Promise<string[]> {
  const adrDir = path.join(root, "docs/architecture/adr");
  let entries;
  try {
    entries = await readdir(adrDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const proposed: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "0000-template.md" || entry.name === "README.md") {
      continue;
    }
    const content = await readText(root, path.join("docs/architecture/adr", entry.name));
    if (content && /^\s*-\s*Status:\s*Proposed\s*$/im.test(content)) {
      proposed.push(entry.name);
    }
  }
  return proposed.sort();
}

export async function doctorProject(rootDir = process.cwd()): Promise<DoctorReport> {
  const root = path.resolve(rootDir);
  const checks: DoctorCheck[] = [];
  const missing: string[] = [];

  for (const relative of REQUIRED_FILES) {
    const ok = await exists(path.join(root, relative));
    checks.push({ label: relative, ok, detail: ok ? undefined : "missing" });
    if (!ok) {
      missing.push(relative);
    }
  }

  const shellCheck = await exists(path.join(root, "scripts/check.sh"));
  const powershellCheck = await exists(path.join(root, "scripts/check.ps1"));
  const validationFound = shellCheck || powershellCheck;
  checks.push({
    label: "Validation entry point",
    ok: validationFound,
    detail: validationFound
      ? [shellCheck ? "scripts/check.sh" : undefined, powershellCheck ? "scripts/check.ps1" : undefined]
          .filter(Boolean)
          .join(", ")
      : "scripts/check.sh or scripts/check.ps1 is required"
  });

  if (!validationFound) {
    missing.push("scripts/check.*");
  }

  if (missing.length > 0) {
    return {
      root,
      status: "Setup Incomplete",
      checks,
      nextAction: `Restore or migrate the missing Control Plane assets (${missing.join(", ")}) or initialize a fresh project.`,
      hasErrors: true
    };
  }

  if (await transactionPending(root)) return {
    root, status: "Needs Review", checks: [...checks, { label: "Approval transaction", ok: false, detail: APPROVAL_JOURNAL }],
    nextAction: "Unfinished update detected. Review the journal, then control-plane recover --complete or --rollback. See stale-lock recovery instructions.", hasErrors: false
  };

  let bootstrapState: ResolvedBootstrapState;
  try {
    bootstrapState = await readBootstrapState(root);
    const architectureItems = bootstrapState.items.filter((item) => item.stage === "Architecture");
    if (architectureItems.length !== 1) {
      throw new BootstrapStateError("exactly one Architecture item is required");
    }
    checks.push({ label: "Bootstrap state", ok: true, detail: BOOTSTRAP_STATE_FILE });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    checks.push({ label: "Bootstrap state", ok: false, detail });
    return {
      root,
      status: "Setup Incomplete",
      checks,
      nextAction: `Repair or migrate the invalid Bootstrap state (${detail}).`,
      hasErrors: true
    };
  }

  if (await transactionPending(root)) return { root, status: "Needs Review", checks, nextAction: "Unfinished update: control-plane recover --complete or --rollback.", hasErrors: false };
  let adrChecks: AdrCheck[] = [];
  if (bootstrapState.definition.adr) {
    try { adrChecks = await inspectAdrs(root, bootstrapState); }
    catch (error) { adrChecks = [{ number: "", file: bootstrapState.definition.adr.directory, title: "ADR directory", valid: false, detail: error instanceof Error ? error.message : String(error) }]; }
    for (const adr of adrChecks) checks.push({ label: `ADR decision: ${adr.file}`, ok: adr.valid, detail: adr.detail });
    const needsReview = adrChecks.filter(adr => !adr.valid && adr.status !== "Proposed");
    if (needsReview.length) return { root, status: "Needs Review", checks, bootstrapState, adrChecks, nextAction: needsReview.map(adr => `${adr.file}: ${adr.detail}`).join("\n"), hasErrors: false };
  }

  const incompleteDocs: string[] = [];
  for (const relative of BOOTSTRAP_DOCS) {
    const content = await readText(root, relative);
    const incomplete = content === undefined || hasBootstrapPlaceholder(relative, content);
    checks.push({
      label: `Bootstrap content: ${relative}`,
      ok: !incomplete,
      detail: incomplete ? "placeholder content remains" : undefined
    });
    if (incomplete) {
      incompleteDocs.push(relative);
    }
  }

  if (incompleteDocs.length > 0) {
    return {
      root,
      status: "Bootstrap In Progress",
      checks,
      nextAction: "Complete Product / Requirements / Constraints / Delivery using agent/workflows/bootstrap.md.",
      hasErrors: false,
      bootstrapState, adrChecks
    };
  }

  const preparationItems = bootstrapState.items.filter((item) => item.stage !== "Architecture");
  for (const item of preparationItems) {
    checks.push({
      label: `Approval: ${item.label}`,
      ok: item.status === "Complete",
      detail: item.detail
    });
  }

  const stalePreparation = preparationItems.filter((item) => item.status === "Needs Review");
  if (stalePreparation.length > 0) {
    return {
      root,
      status: "Needs Review",
      checks,
      nextAction: `Review and explicitly re-approve changed Bootstrap items (${stalePreparation.map((item) => item.label).join(", ")}).`,
      hasErrors: false,
      bootstrapState
    };
  }

  const pendingPreparation = preparationItems.filter((item) => item.status === "Pending");
  if (pendingPreparation.length > 0) {
    return {
      root,
      status: "Bootstrap In Progress",
      checks,
      nextAction: `Obtain explicit human approval for the prepared Bootstrap items (${pendingPreparation.map((item) => item.label).join(", ")}).`,
      hasErrors: false,
      bootstrapState
    };
  }

  if (bootstrapState.definition.schemaVersion === 1) return { root, status: "Needs Review", checks, bootstrapState, adrChecks, nextAction: "Legacy approval schema: run control-plane migrate; then explicitly migrate existing Accepted / Superseded ADRs. Existing item IDs are preserved.", hasErrors: false };
  const proposed = adrChecks.filter(adr => adr.status === "Proposed").map(adr => adr.file);
  const architecture = (await readText(root, "ARCHITECTURE.md")) ?? "";
  const architecturePending =
    architecture.includes("Bootstrap / Architecture Gate後に記載する。") ||
    /Architecture Gate Pending/i.test(architecture);

  checks.push({
    label: "Proposed ADRs",
    ok: proposed.length === 0,
    detail: proposed.length > 0 ? proposed.join(", ") : "none"
  });
  checks.push({
    label: "Current Architecture",
    ok: !architecturePending,
    detail: architecturePending ? "Architecture Gate/current architecture has not been resolved" : undefined
  });

  if (proposed.length > 0) {
    return {
      root,
      status: "Architecture Gate Pending",
      checks,
      nextAction: `Review the Proposed ADRs (${proposed.join(", ")}) and update ARCHITECTURE.md only after approval.`,
      hasErrors: false,
      bootstrapState, adrChecks
    };
  }

  if (architecturePending) {
    return {
      root,
      status: "Bootstrap In Progress",
      checks,
      nextAction: "Prepare Architecture decisions from the approved Product and Delivery inputs.",
      hasErrors: false,
      bootstrapState
    };
  }

  const architectureApproval = bootstrapState.items.find((item) => item.stage === "Architecture")!;
  checks.push({
    label: `Approval: ${architectureApproval.label}`,
    ok: architectureApproval.status === "Complete",
    detail: architectureApproval.detail
  });
  if (architectureApproval.status !== "Complete") {
    return {
      root,
      status: architectureApproval.status === "Needs Review" ? "Needs Review" : "Bootstrap In Progress",
      checks,
      nextAction:
        architectureApproval.status === "Needs Review"
          ? "Review and explicitly re-approve the changed Architecture decision inputs."
          : "Record explicit human approval for the resolved Architecture decision inputs.",
      hasErrors: false,
      bootstrapState
    };
  }

  const readme = (await readText(root, "README.md")) ?? "";
  const templateReadme =
    readme.includes("Control Plane Template") ||
    readme.includes("Bootstrap後、このREADMEはProject固有");
  checks.push({
    label: "Project README",
    ok: !templateReadme,
    detail: templateReadme ? "template README has not been replaced" : undefined
  });

  if (templateReadme) {
    return {
      root,
      status: "Bootstrap In Progress",
      checks,
      nextAction: "Replace the root README with the project-specific Purpose / Setup / Run / Validation entry point.",
      hasErrors: false,
      bootstrapState
    };
  }

  return {
    root,
    status: "Ready for Validation",
    checks,
    nextAction: "Run the repository validation entry point (scripts/check.*).",
    hasErrors: false,
    bootstrapState
  };
}

export function formatDoctorReport(report: DoctorReport, styles: OutputStyles = plainStyles): string {
  const lines = [styles.heading("Control Plane Doctor"), ""];
  for (const check of report.checks) {
    const missing = check.detail === "missing" || check.label === "Validation entry point" || check.label === "Bootstrap state";
    const marker = check.ok ? styles.success("✓") : missing ? styles.error("✗") : styles.warning("⚠");
    lines.push(`${marker} ${check.label}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  lines.push("", `Status: ${styles.status(report.status)}`, `${styles.heading("Next:")} ${report.nextAction}`);
  return lines.join("\n");
}
