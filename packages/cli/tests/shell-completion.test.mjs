import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { adr, cli, fixture, packageDir, read, stateFile, write } from "./helpers/project.mjs";

const shellQuote = value => "'" + value.replaceAll("'", "'\\''") + "'";
async function shellFixture(t) {
  const root = await fixture(t);
  const bin = path.join(root, "bin");
  await mkdir(bin);
  if (process.platform === "win32") {
    await writeFile(path.join(bin, "control-plane.cmd"), `@echo off\r\n"${process.execPath}" "${cli}" %*\r\n`);
  } else {
    const wrapper = path.join(bin, "control-plane");
    await writeFile(wrapper, `#!/usr/bin/env bash\nexec ${shellQuote(process.execPath)} ${shellQuote(cli)} "$@"\n`);
    await chmod(wrapper, 0o755);
  }
  await mkdir(path.join(root, "dir with spaces"));
  await write(root, "docs/architecture/adr/0001-runtime.md", adr());
  return { root, env: { ...process.env, PATH: bin + path.delimiter + process.env.PATH, CONTROL_PLANE_COMPLETION_ROOT: root } };
}
test("registered Bash completion handles prefixes, quoted directory paths and cursor position", { skip: process.platform === "win32" }, async t => {
  const { root, env } = await shellFixture(t);
  const original = await read(root, stateFile);
  const script = 'source "$CONTROL_PLANE_COMPLETION_ASSET"\nCOMP_LINE="$CONTROL_PLANE_COMPLETION_LINE"\nCOMP_POINT="$CONTROL_PLANE_COMPLETION_POINT"\n_control_plane_complete\nprintf "%s\\n" "${COMPREPLY[@]}"';
  for (const [line, point, expected] of [
    ["control-plane in", 16, ["init"]],
    ["control-plane approve req", 25, ["requirements"]],
    ["control-plane approve adr 000", 29, ["0001"]],
    ['control-plane init "dir with', 28, ["dir with spaces/"]],
    ["control-plane in extra", 16, ["init"]],
    ["control-plane approve impossible", 32, []]
  ]) {
    const result = spawnSync("bash", ["--noprofile", "--norc", "-c", script], { cwd: root, encoding: "utf8", env: { ...env, CONTROL_PLANE_COMPLETION_ASSET: path.join(packageDir, "completion/control-plane.bash"), CONTROL_PLANE_COMPLETION_LINE: line, CONTROL_PLANE_COMPLETION_POINT: String(Math.min(point, line.length)) } });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.stdout.trim().split(/\r?\n/).filter(Boolean), expected, line);
  }
  assert.equal(await read(root, stateFile), original);
});
const pwshAvailable = spawnSync("pwsh", ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"], { encoding: "utf8" }).status === 0;
test("registered PowerShell native completion handles empty prefixes, quoted paths and literal arguments", { skip: !pwshAvailable && process.platform !== "win32" }, async t => {
  assert.ok(pwshAvailable, "PowerShell is required in Windows CI");
  const { root, env } = await shellFixture(t);
  const original = await read(root, stateFile);
  const script = '. $env:CONTROL_PLANE_COMPLETION_ASSET; $result = [System.Management.Automation.CommandCompletion]::CompleteInput($env:CONTROL_PLANE_COMPLETION_LINE, [int]$env:CONTROL_PLANE_COMPLETION_POINT, $null); ConvertTo-Json -InputObject @($result.CompletionMatches | ForEach-Object { $_.CompletionText }) -Compress';
  for (const [line, expected] of [
    ["control-plane in", ["init"]],
    ["control-plane approve req", ["requirements"]],
    ["control-plane approve adr 000", ["0001"]],
    ["control-plane approve ", ["product-overview", "requirements", "constraints", "delivery", "architecture", "adr"]],
    ['control-plane init "dir with', [process.platform === "win32" ? "'.\\dir with spaces\\'" : "'./dir with spaces/'"]],
    ['control-plane reject adr 0001 --reason "a quoted reason" --r', []]
  ]) {
    for (const mode of ["Standard", "Legacy"]) {
      const result = spawnSync("pwsh", ["-NoProfile", "-Command", `$PSNativeCommandArgumentPassing = '${mode}'; ` + script], { cwd: root, encoding: "utf8", env: { ...env, CONTROL_PLANE_COMPLETION_ASSET: path.join(packageDir, "completion/control-plane.ps1"), CONTROL_PLANE_COMPLETION_LINE: line, CONTROL_PLANE_COMPLETION_POINT: String(line.length) } });
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(JSON.parse(result.stdout), expected, mode + " " + line + ": " + result.stderr);
    }
  }
  assert.equal(await read(root, stateFile), original);
});
