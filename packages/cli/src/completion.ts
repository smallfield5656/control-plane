import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { adrNumbers, readAdr } from "./adr.js";
import { transactionPending } from "./approval-transaction.js";
import { readBootstrapState } from "./bootstrap-state.js";
import { COMMANDS, GLOBAL_OPTIONS } from "./commands.js";

interface Candidate { value: string; description: string }
interface Candidates { kind: "values" | "directory"; candidates: Candidate[] }
export async function completionScript(shell: string): Promise<string> {
  if (shell !== "bash" && shell !== "powershell") throw new Error("Supported completion shells: bash, powershell.");
  return readFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../completion/control-plane.${shell === "bash" ? "bash" : "ps1"}`), "utf8");
}
export async function completionCandidates(root: string, tokens: string[], index: number): Promise<Candidates> {
  const empty: Candidates = { kind: "values", candidates: [] };
  if (!Number.isInteger(index) || index < 1 || index >= tokens.length || tokens.length > 100 || tokens.some(token => typeof token !== "string" || token.length > 4096 || /[\x00\r\n]/.test(token))) return empty;
  const prefix = tokens[index];
  const prior = tokens.slice(1, index);
  if (prior.at(-1) === "--reason") return empty;
  const positional = prior.filter(token => token !== "--no-color");
  const command = positional[0];
  const spec = COMMANDS.find(spec => spec.name === command);
  const values = (options: string[], description = "") => ({ kind: "values" as const, candidates: options.filter(value => value.startsWith(prefix)).map(value => ({ value, description })) });
  if (prefix.startsWith("-")) {
    if (!command) return values([...GLOBAL_OPTIONS, "--version"]);
    if (!spec) return empty;
    const already = new Set(prior);
    return values([...GLOBAL_OPTIONS, ...spec.options].filter(option => !already.has(option)));
  }
  if (!command) return values(COMMANDS.map(spec => spec.name));
  if (!spec) return empty;
  const args = positional.slice(1);
  if (spec.directory && !args.length) return { kind: "directory", candidates: [] };
  if (command === "completion" && !args.length) return values(["bash", "powershell"]);
  if (command === "reject" || command === "migrate") {
    if (!args.length) return values(["adr"]);
  }
  if (prior.includes("--reason")) return empty;
  let state;
  try {
    if (await transactionPending(root)) return command === "approve" && !args.length ? values(["adr"]) : empty;
    state = await readBootstrapState(root);
  } catch { return command === "approve" && !args.length ? values(["adr"]) : empty; }
  if (command === "approve" && !args.length) return values([...state.definition.items.map(item => item.id), "adr"]);
  if (!["approve", "reject", "migrate"].includes(command) || args.length !== 1 || args[0] !== "adr") return empty;
  const directory = state.definition.adr?.directory ?? state.definition.items.find(item => item.stage === "Architecture")?.inputDirectories[0]?.path;
  if (!directory) return empty;
  const candidates: Candidate[] = [];
  try {
    for (const [number, files] of await adrNumbers(root, directory)) {
      if (files.length !== 1 || !number.startsWith(prefix)) continue;
      try {
        const document = await readAdr(root, files[0], number);
        candidates.push({ value: number, description: document.title.replace(/[\x00-\x1f\x7f-\x9f]/g, "") });
      } catch { /* Invalid / unsafe ADR cannot be completed. */ }
    }
  } catch { return empty; }
  return { kind: "values", candidates };
}
export async function candidateOutput(args: string[], root = process.cwd()): Promise<string> {
  const shellIndex = args.indexOf("--shell"), indexIndex = args.indexOf("--index"), delimiter = args.indexOf("--");
  const shell = shellIndex >= 0 ? args[shellIndex + 1] : "";
  let result: Candidates = { kind: "values", candidates: [] };
  if (shellIndex === 0 && indexIndex === 2 && delimiter === 4 && /^(?:0|[1-9][0-9]*)$/.test(args[3]) && (shell === "bash" || shell === "powershell")) {
    try {
      let tokens = args.slice(5);
      // Legacy PowerShell / Windows .cmd shims lose empty native arguments and quoting.
      // The adapter sends its token array as one inert value; raw tokens remain supported.
      if (tokens[0] === "__control-plane-tokens-base64__") {
        if (tokens.length !== 2 || tokens[1].length > 64 * 1024) throw new Error("Invalid encoded tokens");
        const decoded: unknown = JSON.parse(Buffer.from(tokens[1], "base64").toString("utf8"));
        if (!Array.isArray(decoded) || decoded.some(token => typeof token !== "string")) throw new Error("Invalid token array");
        tokens = decoded;
      }
      result = await completionCandidates(root, tokens, Number(args[3]));
    } catch { /* Tab completion remains quiet. */ }
  }
  return shell === "bash" ? [result.kind, ...result.candidates.map(candidate => candidate.value)].join("\n") + "\n" : JSON.stringify(result) + "\n";
}
