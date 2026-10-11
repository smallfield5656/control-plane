#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapProject, formatBootstrapReport } from "./bootstrap.js";
import { runProjectCheck } from "./check.js";
import { doctorProject, formatDoctorReport } from "./doctor.js";
import { initProject } from "./init.js";
import { createStyles, type OutputStyles } from "./output.js";

function usage(styles: OutputStyles): string {
  return [
    styles.heading("control-plane - engineering control plane for AI-assisted projects"),
    "",
    styles.heading("Usage:"),
    ...[
      "  control-plane init <directory>",
      "  control-plane doctor [directory]",
      "  control-plane next [directory]",
      "  control-plane bootstrap [directory]  alias for next",
      "  control-plane check [directory]",
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
  const noColor = argv.includes("--no-color");
  const [command, ...args] = argv.filter((arg) => arg !== "--no-color");
  const stdout = createStyles({ noColor });
  const stderr = createStyles({ noColor, stream: process.stderr });
  const invalid = (message: string) => {
    console.error(stderr.error(message));
    console.error(usage(stderr));
    process.exitCode = 2;
  };

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
  if (!["init", "doctor", "next", "bootstrap", "check"].includes(command)) {
    return invalid(`Unknown command: ${command}`);
  }
  if (args.some((arg) => arg.startsWith("-"))) {
    return invalid(`Unknown option: ${args.find((arg) => arg.startsWith("-"))}`);
  }
  if ((command === "init" && args.length !== 1) || args.length > 1) {
    return invalid(command === "init" ? "init requires exactly one directory." : `${command} accepts at most one directory.`);
  }

  const [root = process.cwd()] = args;
  try {
    if (command === "init") {
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
