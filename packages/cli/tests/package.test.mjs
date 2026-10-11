import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
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
    const packOutput = exec(npm, ["pack", "--silent", "--pack-destination", work], { cwd: packageDir });
    const filename = packOutput.trim().split(/\r?\n/).at(-1);
    assert.ok(filename?.endsWith(".tgz"), `unexpected npm pack output: ${packOutput}`);
    tarball = path.join(work, filename);

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
    const bootstrapState = JSON.parse(await readFile(path.join(target, ".control-plane/bootstrap-state.json"), "utf8"));
    assert.equal(bootstrapState.schemaVersion, 2);
    assert.deepEqual(bootstrapState.items.map((item) => item.approval), Array(5).fill(null));
    await readFile(path.join(target, ".agents/skills/project-bootstrap/scripts/record-approval.mjs"), "utf8");
    const expectedGitignore = await readFile(path.resolve(packageDir, "../../template/.gitignore"), "utf8");
    assert.equal(await readFile(path.join(target, ".gitignore"), "utf8"), expectedGitignore);
    await assert.rejects(() => readFile(path.join(target, "gitignore.template")), { code: "ENOENT" });
    await assert.rejects(() => stat(path.join(target, "examples")), { code: "ENOENT" });
    const repoRoot = path.resolve(packageDir, "../..");
    const assets = exec("git", ["ls-files", "-z", "--", "template/"], { cwd: repoRoot }).split("\0").filter(Boolean);
    for (const asset of assets) {
      assert.deepEqual(await readFile(path.join(target, asset.slice("template/".length))), await readFile(path.join(repoRoot, asset)), asset);
    }
    await readFile(path.join(target, "scripts", process.platform === "win32" ? "check.ps1" : "check.sh"), "utf8");

    const doctorOutput = exec(bin, ["doctor", target], { cwd: consumer });
    assert.match(doctorOutput, /Status: Bootstrap In Progress/);

    const nextOutput = exec(bin, ["next", target], { cwd: consumer });
    assert.match(nextOutput, /Control Plane Next/);
    assert.match(nextOutput, /Phase: Bootstrap In Progress/);
    assert.match(nextOutput, /Next Action:/);
    for (const label of ["Product Overview", "Requirements", "Constraints", "Delivery", "Architecture"]) {
      assert.match(nextOutput, new RegExp(`${label} +Pending`));
    }
    assert.match(nextOutput, /docs\/product\/constraints\.md/);
    assert.doesNotMatch(nextOutput, /\u001b\[/);

    const bootstrapAliasOutput = exec(bin, ["bootstrap", target], { cwd: consumer });
    assert.equal(bootstrapAliasOutput, nextOutput);

    exec(bin, ["check", target], { cwd: consumer });
    const packageJson = JSON.parse(await readFile(path.join(packageDir, "package.json"), "utf8"));
    assert.equal(exec(bin, ["--version"], { cwd: consumer }).trim(), packageJson.version);
    const help = exec(bin, ["--help"], { cwd: consumer });
    assert.match(help, /control-plane init <directory>/);
    assert.match(help, /control-plane next \[directory\]/);
    assert.match(help, /control-plane bootstrap \[directory\].*alias for next/);
    assert.match(help, /control-plane approve/);
    assert.match(exec(bin, ["completion", "bash"], { cwd: consumer }), /complete -F/);
    assert.match(exec(bin, ["completion", "powershell"], { cwd: consumer }), /Register-ArgumentCompleter/);
    assert.match(exec(bin, ["completion", "candidates", "--shell", "bash", "--index", "2", "--", "control-plane", "approve", "product-"], { cwd: target }), /^values\r?\nproduct-overview\r?\n$/);
    const statePath = path.join(target, ".control-plane/bootstrap-state.json");
    for (const item of bootstrapState.items) for (const input of item.inputs) {
      const { writeFile } = await import("node:fs/promises");
      await writeFile(path.join(target, input), `# ${item.label}\n\nReady.\n`);
    }
    const { writeFile } = await import("node:fs/promises");
    await writeFile(path.join(target, "docs/architecture/adr/0001-runtime.md"), "# ADR-0001: Runtime\n\n- Status: Proposed\n- Supersedes: —\n- Superseded By: —\n\n## Context\nChoose runtime.\n\n## Decision\nUse Node.js.\n\n## Consequences\nRequires Node.js.\n");
    const installedEnv = { ...process.env, PATH: path.dirname(bin) + path.delimiter + process.env.PATH };
    for (const id of ["product-overview", "requirements", "constraints", "delivery"]) {
      exec(process.execPath, [path.join(target, ".agents/skills/project-bootstrap/scripts/record-approval.mjs"), id], { cwd: target, env: installedEnv });
    }
    exec(bin, ["approve", "adr", "0001"], { cwd: target });
    const adrCandidates = JSON.parse(exec(bin, ["completion", "candidates", "--shell", "powershell", "--index", "3", "--", "control-plane", "approve", "adr", "000"], { cwd: target }));
    assert.deepEqual(adrCandidates.candidates, [{ value: "0001", description: "ADR-0001: Runtime" }]);
    exec(bin, ["approve", "architecture"], { cwd: target });
    const finalState = JSON.parse(await readFile(statePath, "utf8"));
    assert.ok(finalState.adr.decisions["0001"].revision);
    assert.ok(finalState.items.every(item => item.approval));
  } finally {
    if (tarball) {
      await rm(tarball, { force: true });
    }
    await rm(work, { recursive: true, force: true });
  }
});
