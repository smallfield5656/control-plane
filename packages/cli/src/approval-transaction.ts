import { createHash, randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { lstat, open, readFile, realpath, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { BOOTSTRAP_STATE_FILE, parseDefinition, repositoryPath, validateDirectory, validateFile } from "./bootstrap-state.js";

export const APPROVAL_LOCK = ".control-plane/approval.lock";
export const APPROVAL_JOURNAL = ".control-plane/approval-transaction.json";
const MAX_JOURNAL_BYTES = 8 * 1024 * 1024;
export interface Change { file: string; before: Buffer; after: Buffer }
export interface TransactionHooks {
  afterJournal?: () => Promise<void>;
  afterWrite?: (index: number) => Promise<void>;
}
const digest = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
export async function transactionPending(root: string): Promise<boolean> {
  return Boolean(await lstat(path.join(root, APPROVAL_JOURNAL)).catch(error => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }));
}
export async function withApprovalLock<T>(root: string, operation: () => Promise<T>): Promise<T> {
  await validateDirectory(root, ".control-plane");
  const token = randomUUID();
  const lockPath = path.join(root, APPROVAL_LOCK);
  const handle = await open(lockPath, "wx", 0o600).catch(error => {
    if (error.code === "EEXIST") throw new Error(`Another CLI update or stale lock exists: ${APPROVAL_LOCK}. Inspect its owner; never remove a live process lock. See recovery instructions.`);
    throw error;
  });
  try {
    await handle.writeFile(JSON.stringify({ pid: process.pid, host: hostname(), token }) + "\n");
    await handle.sync();
    await handle.close();
    return await operation();
  } finally {
    await handle.close().catch(() => undefined);
    const current = await readFile(lockPath, "utf8").catch(() => "");
    if (current && JSON.parse(current).token === token) await unlink(lockPath);
  }
}
async function durableFile(file: string, bytes: Buffer): Promise<void> {
  const handle = await open(file, "wx", 0o600);
  try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
}
async function replace(root: string, change: Change, expected: Buffer, target: Buffer): Promise<void> {
  await validateFile(root, await realpath(root), change.file);
  if (!(await readFile(path.join(root, change.file))).equals(expected)) throw new Error(`File changed during update; refusing overwrite: ${change.file}. Run control-plane recover after review.`);
  const temporary = path.join(root, `${change.file}.control-plane-${randomUUID()}.tmp`);
  try {
    await durableFile(temporary, target);
    await validateDirectory(root, path.posix.dirname(change.file));
    if (!(await readFile(path.join(root, change.file))).equals(expected)) throw new Error(`File changed during update: ${change.file}`);
    await rename(temporary, path.join(root, change.file));
  } finally { await unlink(temporary).catch(error => { if (error.code !== "ENOENT") throw error; }); }
}
function validateChanges(changes: Change[]): void {
  if (changes.length < 1 || changes.length > 2 || new Set(changes.map(change => change.file)).size !== changes.length) throw new Error("Invalid transaction targets");
  const state = changes.find(change => change.file === BOOTSTRAP_STATE_FILE);
  if (!state || state.before.length > 256 * 1024 || state.after.length > 256 * 1024) throw new Error("Transaction requires bounded Bootstrap state");
  const before = parseDefinition(JSON.parse(state.before.toString("utf8")));
  const after = parseDefinition(JSON.parse(state.after.toString("utf8")));
  for (const change of changes) {
    repositoryPath(change.file);
    if (change.before.length > 2 * 1024 * 1024 || change.after.length > 2 * 1024 * 1024) throw new Error("Transaction target exceeds size limit");
    if (change.file === BOOTSTRAP_STATE_FILE) continue;
    const directory = after.adr?.directory;
    if (!directory || (before.adr && before.adr.directory !== directory) || path.posix.dirname(change.file) !== directory || !/^(?!0000)[0-9]{4}-.+\.md$/.test(path.posix.basename(change.file))) throw new Error("Transaction ADR target is outside the declared scope");
  }
}
export async function commitApprovalTransaction(root: string, changes: Change[], hooks: TransactionHooks = {}): Promise<void> {
  validateChanges(changes);
  if (await transactionPending(root)) throw new Error(`Unfinished update: ${APPROVAL_JOURNAL}. Run control-plane recover --complete or --rollback.`);
  for (const change of changes) {
    await validateFile(root, await realpath(root), change.file);
    if (!(await readFile(path.join(root, change.file))).equals(change.before)) throw new Error(`File changed before update: ${change.file}`);
  }
  const journal = Buffer.from(JSON.stringify({ schemaVersion: 1, changes: changes.map(change => ({
    file: change.file, before: change.before.toString("base64"), after: change.after.toString("base64"), beforeHash: digest(change.before), afterHash: digest(change.after)
  })) }) + "\n");
  if (journal.length > MAX_JOURNAL_BYTES) throw new Error("Transaction journal exceeds size limit");
  // A partially written journal is deliberately retained and diagnosed, never trusted.
  await durableFile(path.join(root, APPROVAL_JOURNAL), journal);
  await hooks.afterJournal?.();
  for (const [index, change] of changes.entries()) {
    await replace(root, change, change.before, change.after);
    await hooks.afterWrite?.(index);
  }
  for (const change of changes) if (!(await readFile(path.join(root, change.file))).equals(change.after)) throw new Error(`Updated file changed before commit: ${change.file}`);
  await unlink(path.join(root, APPROVAL_JOURNAL));
}
export async function recoverApprovalTransaction(root: string, direction: "complete" | "rollback", hooks: TransactionHooks = {}): Promise<string[]> {
  return withApprovalLock(root, async () => {
    if (!await transactionPending(root)) return [];
    await validateFile(root, await realpath(root), APPROVAL_JOURNAL, MAX_JOURNAL_BYTES);
    const bytes = await readFile(path.join(root, APPROVAL_JOURNAL));
    if (bytes.length > MAX_JOURNAL_BYTES) throw new Error("Recovery journal exceeds size limit");
    const journal = JSON.parse(bytes.toString("utf8"));
    if (journal.schemaVersion !== 1 || !Array.isArray(journal.changes)) throw new Error("Invalid recovery journal schema");
    const changes: Change[] = journal.changes.map((entry: Record<string, unknown>) => {
      if (!entry || typeof entry.file !== "string" || typeof entry.before !== "string" || typeof entry.after !== "string") throw new Error("Invalid recovery journal entry");
      const before = Buffer.from(entry.before, "base64"), after = Buffer.from(entry.after, "base64");
      if (before.toString("base64") !== entry.before || after.toString("base64") !== entry.after || digest(before) !== entry.beforeHash || digest(after) !== entry.afterHash) throw new Error("Recovery journal content hash mismatch");
      return { file: entry.file, before, after };
    });
    validateChanges(changes);
    const current: Buffer[] = [];
    for (const change of changes) {
      await validateFile(root, await realpath(root), change.file);
      const content = await readFile(path.join(root, change.file));
      if (!content.equals(change.before) && !content.equals(change.after)) throw new Error(`Recovery refused: externally edited ${change.file}. Review manually; no files were overwritten.`);
      current.push(content);
    }
    for (const [index, change] of changes.entries()) {
      const target = direction === "complete" ? change.after : change.before;
      if (!current[index].equals(target)) await replace(root, change, current[index], target);
      await hooks.afterWrite?.(index);
    }
    for (const change of changes) if (!(await readFile(path.join(root, change.file))).equals(direction === "complete" ? change.after : change.before)) throw new Error(`File changed during recovery: ${change.file}`);
    await unlink(path.join(root, APPROVAL_JOURNAL));
    return changes.map(change => change.file);
  });
}
