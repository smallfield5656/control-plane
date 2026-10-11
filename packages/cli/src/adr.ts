import { readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { hashBootstrapInput, hashText, hasBootstrapPlaceholder, validateDirectory, validateFile, type AdrDefinition, type ResolvedBootstrapState } from "./bootstrap-state.js";

export type AdrStatus = "Proposed" | "Accepted" | "Rejected" | "Superseded";
export interface AdrDocument {
  number: string; file: string; title: string; text: string; status: AdrStatus;
  supersedes: string[]; supersededBy?: string; revision: string; decisionRevision: string;
}
export interface AdrCheck { number: string; file: string; title: string; status?: AdrStatus; valid: boolean; detail: string }
export function unfencedLines(text: string): string[] {
  let fence: { character: string; length: number } | undefined;
  return text.replace(/\r\n?/g, "\n").split("\n").map(line => {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (match && match[1][0] === fence.character && match[1].length >= fence.length && !match[2].trim()) fence = undefined;
      return "";
    }
    if (match) { fence = { character: match[1][0], length: match[1].length }; return ""; }
    return line;
  });
}
export async function adrNumbers(root: string, directory: string): Promise<Map<string, string[]>> {
  await validateDirectory(root, directory);
  const result = new Map<string, string[]>();
  for (const entry of (await readdir(path.join(root, directory))).sort()) {
    const number = entry.match(/^([0-9]{4})-.+\.md$/)?.[1];
    if (!number || number === "0000") continue;
    result.set(number, [...result.get(number) ?? [], `${directory}/${entry}`]);
  }
  return result;
}
export async function resolveAdr(root: string, definition: AdrDefinition, number: string): Promise<AdrDocument> {
  if (!/^(?!0000)[0-9]{4}$/.test(number)) throw new Error("ADR number must be four digits and not 0000.");
  const files = (await adrNumbers(root, definition.directory)).get(number) ?? [];
  if (files.length === 0) throw new Error(`No ADR for ${number}.`);
  if (files.length !== 1) throw new Error(`Duplicate ADR number ${number}: ${files.join(", ")}. Rename duplicates; no target was selected.`);
  return readAdr(root, files[0], number);
}
export async function readAdr(root: string, file: string, number: string): Promise<AdrDocument> {
  await validateFile(root, await realpath(root), file);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(await readFile(path.join(root, file)));
  const lines = unfencedLines(text);
  const firstSection = lines.findIndex(line => /^## /.test(line));
  const metadataEnd = firstSection < 0 ? lines.length : firstSection;
  const title = lines[0]?.match(new RegExp(`^# ADR-${number}: (.+)$`))?.[1];
  if (!title?.trim()) throw new Error(`Invalid ADR number or title: ${file}`);
  const indices = (key: string) => lines.flatMap((line, index) => new RegExp(`^\\s*-\\s*${key}:`, "i").test(line) ? [index] : []);
  const statusIndices = indices("Status");
  const statusIndex = statusIndices[0];
  const status = lines[statusIndex]?.match(/^- Status: (Proposed|Accepted|Rejected|Superseded)$/)?.[1] as AdrStatus | undefined;
  if (statusIndices.length !== 1 || statusIndex >= metadataEnd || !status) throw new Error(`Missing, duplicate or ambiguous ADR Status: ${file}`);
  function metadata(key: string): string | undefined {
    const positions = indices(key);
    if (!positions.length) return undefined;
    if (positions.length !== 1 || positions[0] >= metadataEnd) throw new Error(`Ambiguous ADR ${key}: ${file}`);
    const value = lines[positions[0]].match(new RegExp(`^- ${key}: (.+)$`))?.[1];
    if (!value) throw new Error(`Invalid ADR ${key}: ${file}`);
    return value;
  }
  const previous = metadata("Supersedes"), next = metadata("Superseded By");
  const supersedes = !previous || previous === "—" ? [] : previous.split(/,\s*/).map(value => {
    const match = value.match(/^ADR-((?!0000)[0-9]{4})$/);
    if (!match) throw new Error(`Invalid Supersedes reference: ${file}`);
    return match[1];
  });
  if (new Set(supersedes).size !== supersedes.length || supersedes.includes(number)) throw new Error(`Duplicate or self Supersedes: ${file}`);
  let supersededBy: string | undefined;
  if (next && next !== "—") {
    supersededBy = next.match(/^ADR-((?!0000)[0-9]{4})$/)?.[1];
    if (!supersededBy || supersededBy === number) throw new Error(`Invalid or self Superseded By: ${file}`);
  }
  if (status !== "Superseded" && supersededBy) throw new Error(`Only Superseded ADR may declare Superseded By: ${file}`);
  const excluded = new Set([statusIndex, ...indices("Superseded By")]);
  const decisionText = text.replace(/\r\n?/g, "\n").split("\n").filter((_, index) => !excluded.has(index)).join("\n");
  return { number, file, title: `ADR-${number}: ${title.trim()}`, text, status, supersedes, supersededBy, revision: hashText(text), decisionRevision: hashText(decisionText) };
}
export function assertAdrPrepared(document: AdrDocument): void {
  if (hasBootstrapPlaceholder(document.file, document.text) || document.text.includes("YYYY-MM-DD")) throw new Error(`ADR placeholders remain: ${document.file}`);
  const lines = unfencedLines(document.text);
  for (const name of ["Context", "Decision", "Consequences"]) {
    const start = lines.findIndex(line => line === `## ${name}`);
    let end = lines.findIndex((line, index) => index > start && /^## /.test(line));
    if (end < 0) end = lines.length;
    const body = start < 0 ? "" : lines.slice(start + 1, end).join("\n").trim();
    if (!body || /^(?:[-*]\s*)?\.\.\.$/.test(body)) throw new Error(`ADR requires completed ${name}: ${document.file}`);
  }
}
export function setAdrStatus(document: AdrDocument, status: AdrStatus): string {
  const index = unfencedLines(document.text).findIndex(line => line === `- Status: ${document.status}`);
  if (index < 0) throw new Error(`Missing ADR Status: ${document.file}`);
  // Retain each original line ending and update only the parsed, unfenced header.
  const parts = document.text.split(/(\r\n|\r|\n)/);
  parts[index * 2] = `- Status: ${status}`;
  return parts.join("");
}
export function normalizeReason(reason: string): string {
  const normalized = reason.replace(/\r\n?/g, "\n").trim();
  if (!normalized || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(normalized) || Buffer.byteLength(normalized) > 64 * 1024) throw new Error("Rejection reason must be non-empty text without control characters (max 64 KiB).");
  return normalized;
}
export function rejectText(document: AdrDocument, reason: string): string {
  const lines = unfencedLines(document.text);
  const sections = lines.flatMap((line, index) => /^##\s+Rejection Reason\s*$/i.test(line) ? [index] : []);
  if (sections.length > 1) throw new Error("Duplicate Rejection Reason sections; review manually.");
  const normalized = document.text.replace(/\r\n?/g, "\n");
  const rawLines = normalized.split("\n");
  let start = sections[0];
  let end = start === undefined ? rawLines.length : lines.findIndex((line, index) => index > start && /^## /.test(line));
  if (end < 0) end = rawLines.length;
  if (start !== undefined) {
    const existing = rawLines.slice(start + 1, end).join("\n").trim();
    if (existing && existing !== "—" && existing !== "TODO") throw new Error("Existing Rejection Reason will not be overwritten; review manually.");
  } else start = rawLines.length;
  const fence = "`".repeat(Math.max(3, ...[...reason.matchAll(/`+/g)].map(match => match[0].length + 1)));
  const section = `\n## Rejection Reason\n\n${fence}text\n${reason}\n${fence}\n`;
  const result = rawLines.slice(0, start).join("\n").replace(/\n*$/, "") + section + rawLines.slice(end).join("\n");
  const updated = setAdrStatus({ ...document, text: result }, "Rejected");
  return document.text.includes("\r\n") ? updated.replace(/\n/g, "\r\n") : updated;
}
export async function adrUpstream(root: string, state: ResolvedBootstrapState, requireComplete = true): Promise<Record<string, string>> {
  const files: Record<string, string> = Object.create(null);
  for (const id of state.definition.adr!.dependsOn) {
    const item = state.items.find(item => item.id === id)!;
    if (requireComplete && item.status !== "Complete") throw new Error(`Upstream ${id} is ${item.status}; run control-plane approve ${id} first.`);
    for (const file of item.approvalScope) {
      files[file] = await hashBootstrapInput(root, file);
    }
  }
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
}
export function sameRevisions(left: Record<string, string>, right: Record<string, string>): boolean {
  const keys = Object.keys(left).sort(), other = Object.keys(right).sort();
  return keys.length === other.length && keys.every((key, index) => key === other[index] && left[key] === right[key]);
}
export async function inspectAdrs(root: string, state: ResolvedBootstrapState): Promise<AdrCheck[]> {
  const definition = state.definition.adr;
  if (!definition) return [];
  const numbers = await adrNumbers(root, definition.directory);
  const documents = new Map<string, AdrDocument>();
  const reports = new Map<string, AdrCheck>();
  for (const [number, files] of numbers) {
    try {
      const document = await resolveAdr(root, definition, number);
      documents.set(number, document);
      reports.set(number, { number, file: document.file, title: document.title, status: document.status, valid: true, detail: "decision matches current content" });
    } catch (error) {
      reports.set(number, { number, file: files.join(", "), title: number, valid: false, detail: error instanceof Error ? error.message : String(error) });
    }
  }
  // Non-numbered Markdown must not silently escape the Architecture decision guard.
  for (const name of await readdir(path.join(root, definition.directory))) if (name.endsWith(".md") && name !== "0000-template.md" && name !== "README.md" && !/^(?!0000)[0-9]{4}-.+\.md$/.test(name)) reports.set(name, { number: "", file: `${definition.directory}/${name}`, title: name, valid: false, detail: "ADR filename must use a nonzero four-digit number" });
  const upstream = await adrUpstream(root, state, false);
  const upstreamComplete = definition.dependsOn.every(id => state.items.find(item => item.id === id)?.status === "Complete");
  const visiting = new Set<string>(), visited = new Set<string>();
  const check = (number: string): void => {
    const report = reports.get(number), document = documents.get(number);
    if (!report || !document || visited.has(number)) return;
    if (visiting.has(number)) throw new Error(`Circular ADR replacement involving ${number}`);
    visiting.add(number);
    try {
      const record = definition.decisions[number];
      if (document.status === "Proposed") throw new Error(`Proposed ADR awaits approval: control-plane approve adr ${number}`);
      if (document.status === "Rejected") {
        if (record && (record.kind !== "rejected" || record.file !== document.file || record.revision !== document.revision)) throw new Error("Rejected ADR content changed; review manually");
      } else {
        if (!record || record.file !== document.file || record.kind === "rejected") throw new Error(`ADR has no matching adoption record; run control-plane migrate adr ${number}`);
        if (document.status === "Accepted") {
          if (record.kind !== "accepted" || record.revision !== document.revision) throw new Error("Accepted ADR content changed; restore it or Supersede with a new ADR");
          if (!upstreamComplete || !sameRevisions(record.upstream, upstream)) throw new Error(`ADR upstream needs review; re-approve upstream then control-plane approve adr ${number}`);
        } else {
          if (record.decisionRevision !== document.decisionRevision || (record.kind === "migrated-superseded" && record.revision !== document.revision)) throw new Error("Superseded ADR decision content changed");
          const successor = document.supersededBy && documents.get(document.supersededBy);
          if (!successor || !successor.supersedes.includes(number) || !["Accepted", "Superseded"].includes(successor.status)) throw new Error("Incomplete Superseded By / Supersedes relation");
          check(successor.number);
          if (!reports.get(successor.number)?.valid) throw new Error(`Successor ADR ${successor.number} needs review`);
        }
        for (const previous of document.supersedes) {
          const old = documents.get(previous);
          if (!old || old.status !== "Superseded" || old.supersededBy !== number) throw new Error(`Incomplete replacement: update ADR-${previous} Status and Superseded By after adoption`);
          const previousRecord = definition.decisions[previous];
          if (!previousRecord || previousRecord.kind === "rejected" || previousRecord.file !== old.file || previousRecord.decisionRevision !== old.decisionRevision) throw new Error(`Replaced ADR-${previous} has invalid decision content or missing migration`);
        }
      }
    } catch (error) {
      report.valid = false;
      report.detail = error instanceof Error ? error.message : String(error);
    } finally { visiting.delete(number); visited.add(number); }
  };
  for (const number of documents.keys()) check(number);
  for (const [number, record] of Object.entries(definition.decisions)) if (!numbers.has(number)) reports.set(number, { number, file: record.file, title: number, valid: false, detail: "Recorded ADR is missing; restore it or review the state explicitly" });
  return [...reports.values()];
}
