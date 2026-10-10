#!/usr/bin/env node
import { initProject } from "./init.js";

function usage(): string {
  return "Usage: control-plane init <directory>";
}

async function main(): Promise<void> {
  const [, , command, target, ...rest] = process.argv;
  if (command !== "init" || !target || rest.length > 0) {
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
}

await main();
