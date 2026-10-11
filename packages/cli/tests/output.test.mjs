import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import test from "node:test";
const cli = fileURLToPath(new URL("../dist/index.js", import.meta.url));
const ansi = /\u001b\[/;
function run(args, env = {}) {
  const cleanEnv = { ...process.env };
  for (const key of ["NO_COLOR", "NODE_DISABLE_COLORS", "FORCE_COLOR"]) delete cleanEnv[key];
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env: { ...cleanEnv, ...env } });
}
test("all CLI commands support consistent color and global --no-color", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "control-plane-output-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project");
  const init = run(["init", project], { FORCE_COLOR: "1" });
  assert.equal(init.status, 0);
  assert.match(init.stdout, ansi);
  for (const args of [["doctor", project], ["next", project], ["bootstrap", project], ["check", project], ["--help"], ["unknown"], ["init"]]) {
    const plain = run(args);
    const colored = run(args, { FORCE_COLOR: "1" });
    const disabled = run(["--no-color", ...args], { FORCE_COLOR: "1" });
    const noColor = run(args, { NO_COLOR: "1" });
    assert.equal(colored.status, plain.status, args.join(" "));
    assert.equal(disabled.status, plain.status);
    assert.equal(noColor.status, plain.status);
    for (const stream of ["stdout", "stderr"]) {
      assert.equal(stripVTControlCharacters(colored[stream]), plain[stream]);
      assert.equal(disabled[stream], plain[stream]);
      assert.equal(noColor[stream], plain[stream]);
      assert.doesNotMatch(plain[stream], ansi);
    }
    assert.match(colored.stdout + colored.stderr, ansi);
  }
  const next = run(["next", project], { FORCE_COLOR: "1" }).stdout;
  const instruction = next.split("Suggested Instruction:")[1].split("Next Action:")[0];
  assert.doesNotMatch(instruction.split("\n").slice(1, -1).join("\n"), ansi);
  for (const args of [["--version"], ["--version", "--no-color"]]) {
    assert.doesNotMatch(run(args, { FORCE_COLOR: "1" }).stdout, ansi);
  }
  await writeFile(path.join(project, "scripts", process.platform === "win32" ? "check.ps1" : "check.sh"),
    process.platform === "win32" ? 'Write-Output "NO_COLOR=$env:NO_COLOR"\nexit 7\n' : 'echo "NO_COLOR=$NO_COLOR"\nexit 7\n');
  const check = run(["check", project, "--no-color"], { FORCE_COLOR: "1" });
  assert.equal(check.status, 7);
  assert.match(check.stdout, /NO_COLOR=1/);
  assert.match(check.stderr, /Validation failed.*7/);
});

test("color policy respects each stream, CI and explicit opt-outs", async () => {
  const { colorEnabled, createStyles } = await import("../dist/output.js");
  const tty = { isTTY: true };
  assert.equal(colorEnabled({ stream: tty, env: {} }), true);
  assert.equal(colorEnabled({ stream: { isTTY: false }, env: {} }), false);
  for (const env of [{ CI: "true" }, { TERM: "dumb" }, { NO_COLOR: "1" }, { NODE_DISABLE_COLORS: "1" }, { FORCE_COLOR: "0" }]) {
    assert.equal(colorEnabled({ stream: tty, env }), false);
  }
  assert.equal(colorEnabled({ stream: tty, env: { NO_COLOR: "1", FORCE_COLOR: "1" } }), false);
  assert.equal(colorEnabled({ stream: tty, noColor: true, env: { FORCE_COLOR: "1" } }), false);
  assert.equal(colorEnabled({ stream: { isTTY: false }, env: { FORCE_COLOR: "1" } }), true);
  assert.match(createStyles({ stream: tty, env: {} }).heading("Heading"), ansi);
  assert.doesNotMatch(createStyles({ stream: { isTTY: false }, env: {} }).heading("Heading"), ansi);
});
