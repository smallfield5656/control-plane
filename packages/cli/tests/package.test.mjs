import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function exec(file, args, options = {}) {
  return execFileSync(file, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options });
}

test("packed package installs and initializes a project with the bundled template", async () => {
  const work = await mkdtemp(path.join(tmpdir(), "control-plane-package-"));
  try {
    const packJson = JSON.parse(exec(npm, ["pack", "--json"], { cwd: packageDir }));
    const tarball = path.join(packageDir, packJson[0].filename);
    const consumer = path.join(work, "consumer");
    await import("node:fs/promises").then(({ mkdir }) => mkdir(consumer, { recursive: true }));

    exec(npm, ["init", "-y"], { cwd: consumer });
    exec(npm, ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], { cwd: consumer });

    const bin = path.join(consumer, "node_modules", ".bin", process.platform === "win32" ? "control-plane.cmd" : "control-plane");
    const target = path.join(work, "my-app");
    const output = exec(bin, ["init", target], { cwd: consumer });
    assert.match(output, /Initialized Control Plane project/);

    const generatedReadme = await readFile(path.join(target, "README.md"), "utf8");
    assert.match(generatedReadme, /Control Plane Template/);
    await readFile(path.join(target, "AGENTS.md"), "utf8");
    await readFile(path.join(target, "scripts", process.platform === "win32" ? "check.ps1" : "check.sh"), "utf8");

    assert.equal(exec(bin, ["--version"], { cwd: consumer }).trim(), "0.1.0");
    await rm(tarball, { force: true });
  } finally {
    await rm(work, { recursive: true, force: true });
  }
});
