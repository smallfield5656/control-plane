import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const moduleUrl = pathToFileURL(path.join(packageDir, "dist/check.js")).href;
const { CheckError, resolveCheckCommand, runProjectCheck } = await import(moduleUrl);

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "control-plane-check-"));
  await mkdir(path.join(root, "scripts"), { recursive: true });
  return root;
}

test("check prefers shell validation on non-Windows platforms", async () => {
  const root = await fixture();
  await writeFile(path.join(root, "scripts/check.sh"), "exit 0\n");
  await writeFile(path.join(root, "scripts/check.ps1"), "exit 0\n");
  const command = await resolveCheckCommand(root, "linux");
  assert.equal(command.command, "bash");
  assert.equal(command.script, "scripts/check.sh");
  await rm(root, { recursive: true, force: true });
});

test("check prefers PowerShell validation on Windows", async () => {
  const root = await fixture();
  await writeFile(path.join(root, "scripts/check.sh"), "exit 0\n");
  await writeFile(path.join(root, "scripts/check.ps1"), "exit 0\n");
  const command = await resolveCheckCommand(root, "win32");
  assert.equal(command.command, "powershell.exe");
  assert.equal(command.script, "scripts/check.ps1");
  await rm(root, { recursive: true, force: true });
});

test("check fails clearly when no validation entry point exists", async () => {
  const root = await fixture();
  await assert.rejects(() => resolveCheckCommand(root, "linux"), CheckError);
  await rm(root, { recursive: true, force: true });
});

test("check propagates the validation script exit code", async () => {
  const root = await fixture();
  if (process.platform === "win32") {
    await writeFile(path.join(root, "scripts/check.ps1"), "exit 7\n");
  } else {
    await writeFile(path.join(root, "scripts/check.sh"), "exit 7\n");
  }
  assert.equal(await runProjectCheck(root), 7);
  await rm(root, { recursive: true, force: true });
});
