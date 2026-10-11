import { readFile } from "node:fs/promises";
import path from "node:path";
import { adrUpstream, assertAdrPrepared, inspectAdrs, normalizeReason, rejectText, resolveAdr, sameRevisions } from "./adr.js";
import { APPROVAL_JOURNAL, commitApprovalTransaction, recoverApprovalTransaction, transactionPending, withApprovalLock, type Change } from "./approval-transaction.js";
import { BOOTSTRAP_STATE_FILE, hashBootstrapInput, hashText, hasBootstrapPlaceholder, parseDefinition, readBootstrapState, type AdrDecisionRecord, type BootstrapStateDefinition } from "./bootstrap-state.js";
import { plainStyles, type OutputStyles } from "./output.js";

export interface ApprovalResult { target: string; result: string; files: string[]; next: string }
async function persist(root: string, definition: BootstrapStateDefinition, before: Buffer, adrChange?: Change): Promise<string[]> {
  parseDefinition(definition);
  const after = Buffer.from(JSON.stringify(definition, null, 2) + "\n");
  const changes = [...adrChange ? [adrChange] : [], { file: BOOTSTRAP_STATE_FILE, before, after }];
  await commitApprovalTransaction(root, changes);
  return changes.map(change => change.file);
}
export async function recordDecision(rootDir: string, operation: "approve" | "reject" | "migrate", target?: string, number?: string, reason?: string): Promise<ApprovalResult> {
  const root = path.resolve(rootDir);
  return withApprovalLock(root, async () => {
    if (await transactionPending(root)) throw new Error(`Unfinished update: ${APPROVAL_JOURNAL}; run control-plane recover --complete or --rollback.`);
    const before = await readFile(path.join(root, BOOTSTRAP_STATE_FILE));
    const state = await readBootstrapState(root);
    const definition = state.definition;
    const next = "control-plane next";
    const unchanged = (label: string): ApprovalResult => ({ target: label, result: "Already recorded / 承認済み (no-op)", files: [], next });
    if (operation === "migrate" && !target) {
      if (definition.schemaVersion === 2) return unchanged("Bootstrap schema v2");
      const architectures = definition.items.filter(item => item.stage === "Architecture");
      if (architectures.length !== 1 || architectures[0].inputDirectories.length !== 1 || !architectures[0].dependsOn.length) throw new Error("Migration requires one Architecture item, one ADR directory and declared upstream; repair the definition first.");
      const architecture = architectures[0];
      definition.schemaVersion = 2;
      definition.adr = { directory: architecture.inputDirectories[0].path, architectureItem: architecture.id, dependsOn: [...architecture.dependsOn], decisions: {} };
      architecture.approval = null;
      return { target: "Bootstrap schema v2", result: "Migrated schema; preserved existing item IDs and upstream approvals. Architecture requires re-review.", files: await persist(root, definition, before), next: "Re-approve changed upstream items, then control-plane migrate adr <number> for each existing Accepted / Superseded ADR." };
    }
    if (definition.schemaVersion !== 2 || !definition.adr) throw new Error("Approval updates require schema v2. Run control-plane migrate explicitly; existing item IDs are preserved.");
    if (target === "adr") {
      if (!number) throw new Error("ADR number is required.");
      const document = await resolveAdr(root, definition.adr, number);
      const label = `${document.title}\nTarget: ${document.file}`;
      const record = definition.adr.decisions[number];
      if (operation === "reject") {
        const normalizedReason = normalizeReason(reason ?? "");
        const reasonRevision = hashText(normalizedReason);
        if (document.status === "Rejected") {
          if (record?.kind === "rejected" && record.file === document.file && record.revision === document.revision && record.reasonRevision === reasonRevision) return unchanged(label);
          throw new Error("Rejected ADR or reason differs from the recorded decision. Review corrections in Git; the reason will not be overwritten.");
        }
        if (document.status !== "Proposed" || record) throw new Error("reject adr requires an unrecorded Proposed ADR; Accepted / Superseded cannot be rejected.");
        const updated = rejectText(document, normalizedReason);
        definition.adr.decisions[number] = { kind: "rejected", file: document.file, revision: hashText(updated), decisionRevision: document.decisionRevision, upstream: {}, reasonRevision };
        const change = { file: document.file, before: await readFile(path.join(root, document.file)), after: Buffer.from(updated) };
        return { target: label, result: "Status: Rejected; Rejection Reason recorded.", files: await persist(root, definition, before, change), next: "Prepare an alternative ADR, then control-plane next." };
      }
      assertAdrPrepared(document);
      const upstream = await adrUpstream(root, state);
      if (operation === "migrate") {
        if (!["Accepted", "Superseded"].includes(document.status)) throw new Error("migrate adr requires existing Accepted / Superseded; use approve / reject for Proposed.");
        if (record) {
          if (record.file === document.file && record.revision === document.revision && record.kind !== "rejected" && sameRevisions(record.upstream, upstream)) return unchanged(label);
          throw new Error("Existing adoption record differs. Migration cannot replace an approval; use ADR review / Supersede.");
        }
        if (document.status === "Superseded" && !document.supersededBy) throw new Error("Superseded ADR requires an explicit Superseded By reference.");
        definition.adr.decisions[number] = { kind: document.status === "Accepted" ? "accepted" : "migrated-superseded", origin: "migration", file: document.file, revision: document.revision, decisionRevision: document.decisionRevision, upstream };
        return { target: label, result: `Recorded current reviewed content (migration); Status: ${document.status} (unchanged). Historical approval was not reconstructed.`, files: await persist(root, definition, before), next };
      }
      if (document.status !== "Proposed" && document.status !== "Accepted") throw new Error("Only Proposed or unchanged Accepted ADR can be approved; Rejected / Superseded cannot be re-adopted.");
      if (document.status === "Accepted") {
        if (!record) throw new Error(`Existing Accepted ADR has no individual record; review current inputs then control-plane migrate adr ${number}.`);
        if (record.kind !== "accepted" || record.file !== document.file || record.revision !== document.revision) throw new Error("Accepted ADR content changed. Restore adopted content or Supersede with a new ADR; cannot rehash edited text.");
        if (sameRevisions(record.upstream, upstream)) return unchanged(label);
        record.upstream = upstream;
        return { target: label, result: "Re-approved / 新しい上流内容に対して再承認; Status: Accepted (unchanged); approval record: updated.", files: await persist(root, definition, before), next };
      }
      if (record) throw new Error("Proposed ADR already has a decision record; restore the recorded content or review migration.");
      for (const oldNumber of document.supersedes) {
        const old = await resolveAdr(root, definition.adr, oldNumber);
        const adopted = definition.adr.decisions[oldNumber];
        if (old.status !== "Accepted" || adopted?.kind !== "accepted" || adopted.file !== old.file || adopted.revision !== old.revision) throw new Error(`Cannot Supersede ADR-${oldNumber}: existing Accepted content / adoption record does not match. Restore or migrate it first.`);
      }
      const updated = document.text.replace(/^- Status: Proposed(\r?)$/m, "- Status: Accepted$1");
      const adoption: AdrDecisionRecord = { kind: "accepted", file: document.file, revision: hashText(updated), decisionRevision: document.decisionRevision, upstream };
      definition.adr.decisions[number] = adoption;
      const change = { file: document.file, before: await readFile(path.join(root, document.file)), after: Buffer.from(updated) };
      return { target: label, result: "Status: Accepted; individual adoption recorded. Architecture approval is separate.", files: await persist(root, definition, before, change), next: document.supersedes.length ? `Update old ADR Status / Superseded By only (${document.supersedes.join(", ")}), reflect adopted decisions in ARCHITECTURE.md, then control-plane approve ${definition.adr.architectureItem}.` : `Reflect the adopted decision in ARCHITECTURE.md, then control-plane approve ${definition.adr.architectureItem}.` };
    }
    if (operation !== "approve" || !target || number !== undefined) throw new Error("Explicit approval item ID is required.");
    const item = state.items.find(item => item.id === target);
    if (!item) throw new Error(`Unknown item ID: ${target}. Read the Project state or control-plane next.`);
    for (const id of item.dependsOn) if (state.items.find(item => item.id === id)?.status !== "Complete") throw new Error(`Upstream ${id} is not Complete; run control-plane approve ${id} first.`);
    for (const file of item.approvalScope) {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await readFile(path.join(root, file)));
      if (hasBootstrapPlaceholder(file, text)) throw new Error(`Cannot approve while placeholders remain: ${file}. Complete the document first.`);
    }
    if (target === definition.adr.architectureItem) {
      const invalid = (await inspectAdrs(root, state)).filter(check => !check.valid);
      if (invalid.length) throw new Error(`Architecture decisions need review:\n${invalid.map(check => `${check.file}: ${check.detail}`).join("\n")}`);
    }
    const label = `${item.label} (${item.id})\nTargets: ${item.directInputs.join(", ")}`;
    if (item.status === "Complete") return unchanged(label);
    const files: Record<string, string> = Object.create(null);
    for (const file of item.approvalScope) files[file] = await hashBootstrapInput(root, file);
    definition.items.find(entry => entry.id === target)!.approval = { status: "approved", files };
    return { target: label, result: "Explicit approval recorded for current content.", files: await persist(root, definition, before), next };
  });
}
export async function recoverDecision(root: string, direction: "complete" | "rollback"): Promise<ApprovalResult> {
  const files = await recoverApprovalTransaction(path.resolve(root), direction);
  return { target: "Approval transaction", result: files.length ? `Recovery ${direction} finished.` : "No unfinished transaction (no-op).", files, next: "control-plane next" };
}
export function formatApprovalResult(result: ApprovalResult, styles: OutputStyles = plainStyles): string {
  return [`${styles.heading("Target:")} ${result.target}`, styles.success(result.result), `Updated files: ${result.files.length ? result.files.join(", ") : "none"}`, `${styles.heading("Next:")} ${result.next}`].join("\n");
}
