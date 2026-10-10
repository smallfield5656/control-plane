#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runProjectCheck } from "./check.js";
import { doctorProject, formatDoctorReport } from "./doctor.js";
import { initProject } from "./init.js";

function usage(): string {
  return [
    "control-plane - engineering control plane for AI-assisted projects",
    "",
    "Usage:",
    "  control-plane init <directory>",
    "  control-plane doctor [directory]",
    "  control-plane check [directory]",
    "  control-plane --help",
    "  control-plane --version"
  ].join("\n");
}

async function version(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packageJson = JSON.parse(await readFile(path.resolve(here, "../package.json"), "utf8")) as { version?: string };
  return packageJson.version ?? "unknown";
}

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;

  if (!command || command === "--help" || command === "-h") {
    console.log(usage());
    return;
  }

  if (command === "--version" || command === "-v") {
    console.log(await version());
    return;
  }

  if (command === "init") {
    const [target, ...rest] = args;
    if (!target || rest.length > 0) {
      console.error(usage());
      process.exitCode = 2;
      return;
    }

    try {
      await initProject(target);
      console.log(`Initialized Control Plane project at ${target}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`control-plane init failed: ${message}`);
      process.exitCode = 1;
    }
    return;
  }

  if (command === "doctor") {
    const [root = process.cwd(), ...rest] = args;
    if (rest.length > 0) {
      console.error(usage());
      process.exitCode = 2;
      return;
    }

    try {
      const report = await doctorProject(root);
      console.log(formatDoctorReport(report));
      process.exitCode = report.hasErrors ? 1 : 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`control-plane doctor failed: ${message}`);
      process.exitCode = 1;
    }
    return;
  }

  if (command === "check") {
    const [root = process.cwd(), ...rest] = args;
    if (rest.length > 0) {
      console.error(usage());
      process.exitCode = 2;
      return;
    }

    try {
      process.exitCode = await runProjectCheck(root);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`control-plane check failed: ${message}`);
      process.exitCode = 1;
    }
    return;
  }

  console.error(usage());
  process.exitCode = 2;
}

await main();
