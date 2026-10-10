#!/usr/bin/env node
import { doctorProject, formatDoctorReport } from "./doctor.js";
import { initProject } from "./init.js";

function usage(): string {
  return [
    "Usage:",
    "  control-plane init <directory>",
    "  control-plane doctor [directory]"
  ].join("\n");
}

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;

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

  console.error(usage());
  process.exitCode = 2;
}

await main();
