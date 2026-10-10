import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

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
}

const REQUIRED_FILES = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "README.md",
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

function hasBootstrapPlaceholder(relative: string, content: string): boolean {
  if (content.includes("TODO:")) {
    return true;
  }

  if (relative === "docs/product/requirements.md") {
    return (
      content.includes("<短い名称>") ||
      content.includes("<!-- プロジェクト固有の要求をここに追加する -->")
    );
  }

  return false;
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
      nextAction: `Restore the missing Control Plane assets (${missing.join(", ")}) or initialize a fresh project.`,
      hasErrors: true
    };
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
      hasErrors: false
    };
  }

  const proposed = await proposedAdrs(root);
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

  if (proposed.length > 0 && architecturePending) {
    return {
      root,
      status: "Architecture Gate Pending",
      checks,
      nextAction: `Review the Proposed ADRs (${proposed.join(", ")}) and update ARCHITECTURE.md only after approval.`,
      hasErrors: false
    };
  }

  if (proposed.length > 0 || architecturePending) {
    return {
      root,
      status: "Needs Review",
      checks,
      nextAction: "Review Proposed ADRs and ARCHITECTURE.md. The repository state is not safe to classify automatically.",
      hasErrors: false
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
      hasErrors: false
    };
  }

  return {
    root,
    status: "Ready for Validation",
    checks,
    nextAction: "Run the repository validation entry point (scripts/check.*).",
    hasErrors: false
  };
}

export function formatDoctorReport(report: DoctorReport): string {
  const lines = ["Control Plane Doctor", ""];
  for (const check of report.checks) {
    const marker = check.ok ? "✓" : "⚠";
    lines.push(`${marker} ${check.label}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  lines.push("", `Status: ${report.status}`, `Next: ${report.nextAction}`);
  return lines.join("\n");
}
