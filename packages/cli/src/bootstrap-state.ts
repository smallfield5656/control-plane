import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";

export const BOOTSTRAP_STATE_FILE = ".control-plane/bootstrap-state.json";
export const BOOTSTRAP_REVISION_ALGORITHM = "sha256-text-lf-v1";

const MAX_STATE_BYTES = 256 * 1024;
const MAX_INPUT_BYTES = 2 * 1024 * 1024;
const MAX_ITEMS = 50;
const MAX_INPUTS = 500;
const SUPPORTED_STAGES = new Set(["Product Definition", "Delivery Framing", "Architecture"]);

export type ApprovalItemStatus = "Complete" | "Pending" | "Needs Review";

export interface BootstrapInputDirectory {
  path: string;
  extension: string;
  exclude: string[];
}

export interface BootstrapApproval {
  status: "approved";
  files: Record<string, string>;
}

export interface BootstrapStateItemDefinition {
  id: string;
  label: string;
  stage: string;
  inputs: string[];
  inputDirectories: BootstrapInputDirectory[];
  dependsOn: string[];
  approval: BootstrapApproval | null;
}

export interface AdrDecisionRecord {
  kind: "accepted" | "rejected" | "migrated-superseded";
  origin?: "migration";
  file: string;
  revision: string;
  decisionRevision: string;
  upstream: Record<string, string>;
  reasonRevision?: string;
}

export interface AdrDefinition {
  directory: string;
  architectureItem: string;
  dependsOn: string[];
  decisions: Record<string, AdrDecisionRecord>;
}

export interface BootstrapStateDefinition {
  schemaVersion: 1 | 2;
  revisionAlgorithm: typeof BOOTSTRAP_REVISION_ALGORITHM;
  items: BootstrapStateItemDefinition[];
  adr?: AdrDefinition;
}

export interface ResolvedBootstrapStateItem extends BootstrapStateItemDefinition {
  status: ApprovalItemStatus;
  detail: string;
  directInputs: string[];
  approvalScope: string[];
  ready: boolean;
}

export interface ResolvedBootstrapState {
  file: typeof BOOTSTRAP_STATE_FILE;
  definition: BootstrapStateDefinition;
  items: ResolvedBootstrapStateItem[];
}

export class BootstrapStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BootstrapStateError";
  }
}

function fail(message: string): never {
  throw new BootstrapStateError(message);
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    fail(`${label} must be a non-empty string`);
  }
  return value;
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value.map((entry, index) => stringValue(entry, `${label}[${index}]`));
}

export function repositoryPath(value: unknown, label = "path"): string {
  const candidate = stringValue(value, label);
  if (
    /[\\:\x00-\x1f]/.test(candidate) || candidate === "." ||
    path.posix.isAbsolute(candidate) ||
    path.posix.normalize(candidate) !== candidate ||
    candidate === ".." ||
    candidate.startsWith("../")
  ) {
    fail(`${label} must be a normalized repository-relative POSIX path`);
  }
  return candidate;
}

function unique(values: string[], label: string): string[] {
  if (new Set(values).size !== values.length) fail(`${label} contains duplicates`);
  return values;
}

function parseApproval(value: unknown, label: string): BootstrapApproval | null {
  if (value === null) return null;
  const approval = objectValue(value, label);
  if (approval.status !== "approved") fail(`${label}.status must be approved`);
  const files = objectValue(approval.files, `${label}.files`);
  const parsedFiles: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [file, revision] of Object.entries(files)) {
    const safeFile = repositoryPath(file, `${label}.files key`);
    const safeRevision = stringValue(revision, `${label}.files.${file}`);
    if (!/^sha256:[a-f0-9]{64}$/.test(safeRevision)) {
      fail(`${label}.files.${file} must be a sha256 revision`);
    }
    parsedFiles[safeFile] = safeRevision;
  }
  return { status: "approved", files: parsedFiles };
}

export function parseDefinition(value: unknown): BootstrapStateDefinition {
  const root = objectValue(value, "Bootstrap state");
  if (root.schemaVersion !== 1 && root.schemaVersion !== 2) fail("schemaVersion must be 1 or 2");
  if (root.revisionAlgorithm !== BOOTSTRAP_REVISION_ALGORITHM) {
    fail(`revisionAlgorithm must be ${BOOTSTRAP_REVISION_ALGORITHM}`);
  }
  if (!Array.isArray(root.items) || root.items.length === 0 || root.items.length > MAX_ITEMS) {
    fail(`items must contain between 1 and ${MAX_ITEMS} entries`);
  }

  const items = root.items.map((value, index): BootstrapStateItemDefinition => {
    const item = objectValue(value, `items[${index}]`);
    const id = stringValue(item.id, `items[${index}].id`);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id) || id === "adr") fail(`items[${index}].id must be kebab-case and not reserved adr`);
    const inputs = unique(
      stringArray(item.inputs, `items[${index}].inputs`).map((input, inputIndex) =>
        repositoryPath(input, `items[${index}].inputs[${inputIndex}]`)
      ),
      `items[${index}].inputs`
    );
    if (!Array.isArray(item.inputDirectories)) fail(`items[${index}].inputDirectories must be an array`);
    const inputDirectories = item.inputDirectories.map((value, directoryIndex): BootstrapInputDirectory => {
      const directory = objectValue(value, `items[${index}].inputDirectories[${directoryIndex}]`);
      const extension = stringValue(directory.extension, `items[${index}].inputDirectories[${directoryIndex}].extension`);
      if (!/^\.[A-Za-z0-9]+$/.test(extension)) fail("input directory extension must start with a dot");
      const exclude = unique(
        stringArray(directory.exclude, `items[${index}].inputDirectories[${directoryIndex}].exclude`),
        `items[${index}].inputDirectories[${directoryIndex}].exclude`
      );
      if (exclude.some((entry) => entry.includes("/") || entry.includes("\\") || entry === "." || entry === "..")) {
        fail("input directory exclude entries must be file names");
      }
      return {
        path: repositoryPath(directory.path, `items[${index}].inputDirectories[${directoryIndex}].path`),
        extension,
        exclude
      };
    });
    const stage = stringValue(item.stage, `items[${index}].stage`);
    if (!SUPPORTED_STAGES.has(stage)) fail(`items[${index}].stage is not supported: ${stage}`);
    return {
      id,
      label: stringValue(item.label, `items[${index}].label`),
      stage,
      inputs,
      inputDirectories,
      dependsOn: unique(stringArray(item.dependsOn, `items[${index}].dependsOn`), `items[${index}].dependsOn`),
      approval: parseApproval(item.approval, `items[${index}].approval`)
    };
  });

  const ids = items.map((item) => item.id);
  unique(ids, "item ids");
  const known = new Set(ids);
  const positions = new Map(items.map((item, index) => [item.id, index]));
  for (const [index, item] of items.entries()) {
    for (const dependency of item.dependsOn) {
      if (!known.has(dependency)) fail(`${item.id} depends on unknown item ${dependency}`);
      if (dependency === item.id) fail(`${item.id} cannot depend on itself`);
      if ((positions.get(dependency) ?? Number.MAX_SAFE_INTEGER) >= index) {
        fail(`${item.id} dependency ${dependency} must appear earlier in the workflow`);
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(items.map((item) => [item.id, item]));
  const visit = (id: string) => {
    if (visiting.has(id)) fail(`dependency cycle includes ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of ids) visit(id);

  let adr: AdrDefinition | undefined;
  if (root.schemaVersion === 2) {
    const raw = objectValue(root.adr, "adr");
    const directory = repositoryPath(raw.directory, "adr.directory");
    const architectureItem = stringValue(raw.architectureItem, "adr.architectureItem");
    const architecture = items.find(item => item.id === architectureItem);
    if (!architecture || architecture.stage !== "Architecture" || items.filter(item => item.stage === "Architecture").length !== 1) fail("adr.architectureItem must identify the unique Architecture item");
    const scope = architecture.inputDirectories.filter(input => input.path === directory);
    if (scope.length !== 1 || scope[0].extension !== ".md" || scope[0].exclude.some(file => file !== "0000-template.md" && file !== "README.md")) fail("Architecture must include the complete ADR directory");
    const dependsOn = unique(stringArray(raw.dependsOn, "adr.dependsOn"), "adr.dependsOn");
    if (!dependsOn.length || dependsOn.some(id => !known.has(id) || byId.get(id)?.stage === "Architecture")) fail("adr.dependsOn must reference upstream non-Architecture items");
    const dependencyIds = new Set<string>();
    const collect = (id: string) => { if (dependencyIds.has(id)) return; dependencyIds.add(id); for (const dep of byId.get(id)!.dependsOn) collect(dep); };
    for (const id of dependsOn) collect(id);
    if (dependencyIds.has(architectureItem)) fail("ADR upstream cannot depend on Architecture");
    const architectureDependencies = new Set<string>();
    const collectArchitecture = (id: string) => { if (architectureDependencies.has(id)) return; architectureDependencies.add(id); for (const dep of byId.get(id)!.dependsOn) collectArchitecture(dep); };
    collectArchitecture(architectureItem);
    if ([...dependencyIds].some(id => !architectureDependencies.has(id))) fail("Architecture must depend on all ADR upstream items");
    const decisions: Record<string, AdrDecisionRecord> = Object.create(null);
    for (const [number, value] of Object.entries(objectValue(raw.decisions, "adr.decisions"))) {
      if (!/^(?!0000)[0-9]{4}$/.test(number)) fail("invalid ADR decision number");
      const record = objectValue(value, `adr.decisions.${number}`);
      if (!["accepted", "rejected", "migrated-superseded"].includes(String(record.kind))) fail("invalid ADR record kind");
      if (record.origin !== undefined && record.origin !== "migration") fail("invalid ADR record origin");
      const file = repositoryPath(record.file, "ADR record file");
      if (path.posix.dirname(file) !== directory || !path.posix.basename(file).startsWith(`${number}-`) || !file.endsWith(".md")) fail("ADR record path must match its number and directory");
      const revision = revisionValue(record.revision);
      const decisionRevision = revisionValue(record.decisionRevision);
      const upstream = parseApproval({ status: "approved", files: record.upstream }, "ADR upstream")!.files;
      const reasonRevision = record.reasonRevision === undefined ? undefined : revisionValue(record.reasonRevision);
      if (record.kind === "rejected" && (!reasonRevision || Object.keys(upstream).length)) fail("Rejected record requires a reason revision and no upstream");
      if (record.kind !== "rejected" && reasonRevision) fail("reason revision only belongs to rejected records");
      decisions[number] = { kind: record.kind as AdrDecisionRecord["kind"], ...(record.origin ? { origin: "migration" as const } : {}), file, revision, decisionRevision, upstream, ...(reasonRevision ? { reasonRevision } : {}) };
    }
    adr = { directory, architectureItem, dependsOn, decisions };
  }
  return { schemaVersion: root.schemaVersion, revisionAlgorithm: BOOTSTRAP_REVISION_ALGORITHM, items, ...(adr ? { adr } : {}) };
}

function revisionValue(value: unknown): string {
  const revision = stringValue(value, "revision");
  if (!/^sha256:[a-f0-9]{64}$/.test(revision)) fail("invalid sha256 revision");
  return revision;
}

function insideRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

export async function validateFile(root: string, realRoot: string, relative: string, maxBytes = MAX_INPUT_BYTES): Promise<void> {
  repositoryPath(relative);
  const absolute = path.resolve(root, ...relative.split("/"));
  if (!insideRoot(root, absolute)) fail(`input escapes repository: ${relative}`);
  const info = await lstat(absolute).catch(() => undefined);
  if (!info?.isFile()) fail(`input must be a regular file: ${relative}`);
  if (info.size > maxBytes) fail(`input exceeds ${maxBytes} bytes: ${relative}`);
  const resolved = await realpath(absolute);
  if (!insideRoot(realRoot, resolved)) fail(`input resolves outside repository: ${relative}`);
  if (path.relative(realRoot, resolved).split(path.sep).join("/") !== relative) fail(`input resolves through a symbolic directory: ${relative}`);
}

export async function validateDirectory(root: string, relative: string): Promise<void> {
  repositoryPath(relative);
  const info = await lstat(path.join(root, relative)).catch(() => undefined);
  const realRoot = await realpath(root);
  if (!info?.isDirectory() || path.relative(realRoot, await realpath(path.join(root, relative))).split(path.sep).join("/") !== relative) fail(`unsafe repository directory: ${relative}`);
}

async function expandInputs(root: string, realRoot: string, item: BootstrapStateItemDefinition): Promise<string[]> {
  const inputs = [...item.inputs];
  const known = new Set(inputs);
  for (const directory of item.inputDirectories) {
    await validateDirectory(root, directory.path);
    const absolute = path.resolve(root, ...directory.path.split("/"));
    if (!insideRoot(root, absolute)) fail(`input directory escapes repository: ${directory.path}`);
    const info = await lstat(absolute).catch(() => undefined);
    if (!info?.isDirectory()) fail(`input directory must be a directory: ${directory.path}`);
    const resolved = await realpath(absolute);
    if (!insideRoot(realRoot, resolved)) fail(`input directory resolves outside repository: ${directory.path}`);
    const entries = (await readdir(absolute, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(directory.extension) && !directory.exclude.includes(entry.name)) {
        const relative = `${directory.path}/${entry.name}`;
        if (!known.has(relative)) {
          inputs.push(relative);
          known.add(relative);
        }
      } else if (entry.isSymbolicLink() && entry.name.endsWith(directory.extension) && !directory.exclude.includes(entry.name)) {
        fail(`input directory contains a symbolic link: ${directory.path}/${entry.name}`);
      }
    }
  }
  if (!inputs.length) fail(`item ${item.id} has no approval inputs`);
  if (inputs.length > MAX_INPUTS) fail(`item ${item.id} exceeds ${MAX_INPUTS} inputs`);
  for (const input of inputs) await validateFile(root, realRoot, input);
  return inputs;
}

export async function hashBootstrapInput(root: string, relative: string): Promise<string> {
  await validateFile(root, await realpath(root), relative);
  const bytes = await readFile(path.resolve(root, ...relative.split("/")));
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail(`input must be valid UTF-8 text: ${relative}`);
  }
  return hashText(text);
}

export function hashText(text: string): string {
  return `sha256:${createHash("sha256").update(text.replace(/\r\n?/g, "\n"), "utf8").digest("hex")}`;
}

export function hasBootstrapPlaceholder(relative: string, content: string): boolean {
  return !content.trim() || /(^|[^A-Za-z0-9_])TODO([^A-Za-z0-9_]|$)/.test(content) ||
    (relative.endsWith("requirements.md") && (content.includes("<短い名称>") || content.includes("<!-- プロジェクト固有の要求をここに追加する -->"))) ||
    (relative === "ARCHITECTURE.md" && (content.includes("Bootstrap / Architecture Gate後に記載する。") || /Architecture Gate Pending/i.test(content)));
}

export async function readBootstrapState(rootDir: string): Promise<ResolvedBootstrapState> {
  const root = path.resolve(rootDir);
  const realRoot = await realpath(root);
  await validateDirectory(root, ".control-plane");
  const statePath = path.join(root, BOOTSTRAP_STATE_FILE);
  const stateInfo = await lstat(statePath).catch(() => undefined);
  if (!stateInfo?.isFile()) fail(`${BOOTSTRAP_STATE_FILE} is missing`);
  if (stateInfo.size > MAX_STATE_BYTES) fail(`${BOOTSTRAP_STATE_FILE} exceeds ${MAX_STATE_BYTES} bytes`);
  if (!insideRoot(realRoot, await realpath(statePath))) fail(`${BOOTSTRAP_STATE_FILE} resolves outside repository`);

  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(statePath, "utf8"));
  } catch (error) {
    fail(`${BOOTSTRAP_STATE_FILE} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const definition = parseDefinition(raw);
  const directInputs = new Map<string, string[]>();
  for (const item of definition.items) directInputs.set(item.id, await expandInputs(root, realRoot, item));

  const byId = new Map(definition.items.map((item) => [item.id, item]));
  const scopes = new Map<string, string[]>();
  const scopeFor = (id: string): string[] => {
    const cached = scopes.get(id);
    if (cached) return cached;
    const item = byId.get(id);
    if (!item) fail(`unknown item ${id}`);
    const scope = new Set(directInputs.get(id));
    for (const dependency of item.dependsOn) {
      for (const input of scopeFor(dependency)) scope.add(input);
    }
    const result = [...scope].sort();
    if (result.length > MAX_INPUTS) fail(`approval scope ${id} exceeds ${MAX_INPUTS} inputs`);
    scopes.set(id, result);
    return result;
  };

  const resolvedById = new Map<string, ResolvedBootstrapStateItem>();
  const preparation = new Map<string, boolean>();
  for (const inputs of directInputs.values()) for (const file of inputs) {
    if (!preparation.has(file)) {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await readFile(path.join(root, file)));
      preparation.set(file, !hasBootstrapPlaceholder(file, text));
    }
  }
  const resolveItem = async (item: BootstrapStateItemDefinition): Promise<ResolvedBootstrapStateItem> => {
    const cached = resolvedById.get(item.id);
    if (cached) return cached;
    const dependencies = await Promise.all(item.dependsOn.map((id) => resolveItem(byId.get(id)!)));
    const scope = scopeFor(item.id);
    let status: ApprovalItemStatus = "Pending";
    let detail = "awaiting explicit human approval";
    if (item.approval) {
      const recorded = Object.keys(item.approval.files).sort();
      const scopeMatches = recorded.length === scope.length && recorded.every((file, index) => file === scope[index]);
      let hashesMatch = scopeMatches;
      if (hashesMatch) {
        for (const input of scope) {
          if (item.approval.files[input] !== await hashBootstrapInput(root, input)) {
            hashesMatch = false;
            break;
          }
        }
      }
      if (!scopeMatches) {
        status = "Needs Review";
        detail = "approval scope changed";
      } else if (!hashesMatch) {
        status = "Needs Review";
        detail = "approved content changed";
      } else if (dependencies.some((dependency) => dependency.status !== "Complete")) {
        status = "Needs Review";
        detail = "upstream approval changed";
      } else {
        status = "Complete";
        detail = "explicit human approval matches current revision";
      }
    }
    const result = { ...item, status, detail, directInputs: directInputs.get(item.id) ?? [], approvalScope: scope, ready: scope.every(file => preparation.get(file)) };
    resolvedById.set(item.id, result);
    return result;
  };

  const items: ResolvedBootstrapStateItem[] = [];
  for (const item of definition.items) items.push(await resolveItem(item));
  return { file: BOOTSTRAP_STATE_FILE, definition, items };
}
