#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapProject, formatBootstrapReport } from "./bootstrap.js";
import { runProjectCheck } from "./check.js";
import { doctorProject, formatDoctorReport } from "./doctor.js";
import { initProject } from "./init.js";
import { formatApprovalResult, recordDecision, recoverDecision } from "./approval.js";
import { COMMANDS, GLOBAL_OPTIONS } from "./commands.js";
import { candidateOutput, completionScript } from "./completion.js";
import { createStyles, type OutputStyles } from "./output.js";

function usage(styles: OutputStyles): string {
  return [
    styles.heading("control-plane - engineering control plane for AI-assisted projects"),
    "",
    styles.heading("Usage:"),
    ...[
      ...COMMANDS.map(spec => `  control-plane ${spec.usage}`),
      "  control-plane --help",
      "  control-plane --version"
    ].map((line) => line.replace(/control-plane (\S+)/, (_, command: string) => `control-plane ${styles.heading(command)}`)),
    "",
    styles.heading("Options:"),
    "  --no-color  Disable color in all commands and the validation child process"
  ].join("\n");
}

async function version(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packageJson = JSON.parse(await readFile(path.resolve(here, "../package.json"), "utf8")) as { version?: string };
  return packageJson.version ?? "unknown";
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv[0] === "completion" && argv[1] === "candidates") {
    process.stdout.write(await candidateOutput(argv.slice(2)));
    return;
  }
  let command: string | undefined;
  const args: string[] = [];
  const flags = new Set<string>();
  let reason: string | undefined;
  let argumentError: string | undefined;
  let positionalOnly = false;
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (!positionalOnly && token === "--") { positionalOnly = true; continue; }
    if (!positionalOnly && token === "--no-color") { flags.add(token); continue; }
    if (!command) { command = token; continue; }
    if (!positionalOnly && token.startsWith("-")) {
      const spec = COMMANDS.find(spec => spec.name === command);
      if (!spec || ![...GLOBAL_OPTIONS, ...spec.options].includes(token)) { argumentError = `Unknown option: ${token}`; break; }
      if (flags.has(token)) { argumentError = `Duplicate option: ${token}`; break; }
      flags.add(token);
      if (token === "--reason") {
        reason = argv[++index];
        if (reason === undefined) argumentError = "--reason requires a value.";
      }
    } else args.push(token);
  }
  const noColor = flags.has("--no-color");
  const stdout = createStyles({ noColor });
  const stderr = createStyles({ noColor, stream: process.stderr });
  const invalid = (message: string) => {
    console.error(stderr.error(message));
    console.error(usage(stderr));
    process.exitCode = 2;
  };
  if (argumentError) return invalid(argumentError);

  if (!command || command === "--help" || command === "-h") {
    if (args.length) return invalid("--help does not accept positional arguments.");
    console.log(usage(stdout));
    return;
  }
  if (command === "--version" || command === "-v") {
    if (args.length) return invalid("--version does not accept positional arguments.");
    console.log(await version());
    return;
  }
  const spec = COMMANDS.find(spec => spec.name === command);
  if (!spec) {
    return invalid(`Unknown command: ${command}`);
  }
  if (flags.has("--help")) { console.log(usage(stdout)); return; }
  if (args.length < spec.min || args.length > spec.max) return invalid(`Invalid arguments. Usage: control-plane ${spec.usage}`);
  if ((command === "approve" && ((args[0] === "adr" && args.length !== 2) || (args[0] !== "adr" && args.length !== 1))) ||
      (command === "reject" && (args[0] !== "adr" || reason === undefined)) ||
      (command === "migrate" && args.length > 0 && (args[0] !== "adr" || args.length !== 2))) return invalid(`Usage: control-plane ${spec.usage}`);
  if (command === "recover" && flags.has("--complete") === flags.has("--rollback")) return invalid("recover requires exactly one of --complete or --rollback.");

  const [root = process.cwd()] = args;
  try {
    if (command === "completion") {
      process.stdout.write(await completionScript(args[0]));
    } else if (command === "approve" || command === "reject" || command === "migrate") {
      console.log(formatApprovalResult(await recordDecision(process.cwd(), command, args[0], args[1], reason), stdout));
    } else if (command === "recover") {
      console.log(formatApprovalResult(await recoverDecision(process.cwd(), flags.has("--complete") ? "complete" : "rollback"), stdout));
    } else if (command === "init") {
      await initProject(root);
      console.log(`${stdout.success("Initialized Control Plane project")} at ${root}`);
    } else if (command === "doctor") {
      const report = await doctorProject(root);
      console.log(formatDoctorReport(report, stdout));
      process.exitCode = report.hasErrors ? 1 : 0;
    } else if (command === "next" || command === "bootstrap") {
      const report = await bootstrapProject(root);
      console.log(formatBootstrapReport(report, stdout, "Control Plane Next"));
      process.exitCode = report.hasErrors ? 1 : 0;
    } else {
      process.exitCode = await runProjectCheck(root, { noColor });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(stderr.error(`control-plane ${command} failed: ${message}`));
    process.exitCode = 1;
  }
}

await main();
