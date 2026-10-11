#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const [itemId, ...extra] = process.argv.slice(2);
if (!itemId || extra.length || !/^[a-z0-9][a-z0-9-]*$/.test(itemId) || itemId === "adr") {
  console.error("Usage: node .agents/skills/project-bootstrap/scripts/record-approval.mjs <item-id>");
  process.exitCode = 2;
} else {
  // Windows npm shims require cmd.exe; resolve the installed JS instead of evaluating input.
  let command = "control-plane", args = ["approve", itemId];
  if (process.platform === "win32") {
    const { existsSync } = await import("node:fs");
    const path = await import("node:path");
    const cli = (process.env.PATH ?? "").split(path.delimiter).flatMap(directory => [
      path.join(directory, "node_modules/@smallfield5656/control-plane/dist/index.js"),
      path.resolve(directory, "../@smallfield5656/control-plane/dist/index.js")
    ]).find(file => existsSync(file));
    if (cli) { command = process.execPath; args = [cli, ...args]; }
    else { console.error("control-plane CLI not found. Install @smallfield5656/control-plane >=0.4 globally, then retry."); process.exitCode = 1; }
  }
  if (!process.exitCode) {
    const result = spawnSync(command, args, { stdio: "inherit", shell: false });
    if (result.error) console.error("control-plane CLI not found. Install @smallfield5656/control-plane >=0.4 globally, then retry.");
    process.exitCode = result.error ? 1 : result.status ?? 1;
  }
}
