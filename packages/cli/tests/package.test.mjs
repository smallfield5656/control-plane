import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function exec(file, args, options = {}) {
  return execFileSync(file, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    ...options
  });
}

test("packed package installs and runs the CLI golden path with the bundled template", async () => {
  const work = await mkdtemp(path.join(tmpdir(), "control-plane-package-"));
  let tarball;
  try {
    const packOutput = exec(npm, ["pack", "--silent"], { cwd: packageDir });
    const filename = packOutput.trim().split(/\r?\n/).at(-1);
    assert.ok(filename?.endsWith(".tgz"), `unexpected npm pack output: ${packOutput}`);
    tarball = path.join(packageDir, filename);

    const consumer = path.join(work, "consumer");
    await mkdir(consumer, { recursive: true });
    exec(npm, ["init", "-y"], { cwd: consumer });
    exec(npm, ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], { cwd: consumer });

    const bin = path.join(consumer, "node_modules", ".bin", process.platform === "win32" ? "control-plane.cmd" : "control-plane");
    const target = path.join(work, "my-app");

    const initOutput = exec(bin, ["init", target], { cwd: consumer });
    assert.match(initOutput, /Initialized Control Plane project/);

    const generatedReadme = await readFile(path.join(target, "README.md"), "utf8");
    assert.match(generatedReadme, /Control Plane Template/);
    await readFile(path.join(target, "AGENTS.md"), "utf8");
    await readFile(path.join(target, "scripts", process.platform === "win32" ? "check.ps1" : "check.sh"), "utf8");

    const doctorOutput = exec(bin, ["doctor", target], { cwd: consumer });
    assert.match(doctorOutput, /Status: Bootstrap In Progress/);

    const bootstrapOutput = exec(bin, ["bootstrap", target], { cwd: consumer });
    assert.match(bootstrapOutput, /Phase: Bootstrap In Progress/);
    assert.match(bootstrapOutput, /Next Action:/);

    exec(bin, ["check", target], { cwd: consumer });
    assert.equal(exec(bin, ["--version"], { cwd: consumer }).trim(), "0.1.0");
    const help = exec(bin, ["--help"], { cwd: consumer });
    assert.match(help, /control-plane init <directory>/);
    assert.match(help, /control-plane bootstrap \[directory\]/);
  } finally {
    if (tarball) {
      await rm(tarball, { force: true });
    }
    await rm(work, { recursive: true, force: true });
  }
});
