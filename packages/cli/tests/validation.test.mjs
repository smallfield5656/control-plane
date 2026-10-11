import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
const template = fileURLToPath(new URL("../../../template", import.meta.url));

async function resolvePlaceholders(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await resolvePlaceholders(file);
    else if (entry.name.endsWith(".md")) await writeFile(file, (await readFile(file, "utf8")).replaceAll("TODO", "Defined"));
  }
}

test("platform validation agrees on TODO markers and identifier boundaries", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "control-plane-validation-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(template, root, { recursive: true });
  await resolvePlaceholders(path.join(root, "docs/product"));
  await resolvePlaceholders(path.join(root, "docs/delivery"));
  await writeFile(path.join(root, "README.md"), "# Example project\n");
  const constraints = path.join(root, "docs/product/constraints.md");
  const original = await readFile(constraints, "utf8");
  for (const [marker, pending] of [["TODO", true], ["TODO:", true], ["| TODO |", true], ["**TODO**", true], ["TODOList MY_TODO", false], ["なし。不要なため。", false]]) {
    await writeFile(constraints, `${original}\n${marker}\n`);
    const windows = process.platform === "win32";
    const result = spawnSync(windows ? "powershell.exe" : "bash", windows ? ["-NoProfile", "-File", path.join(root, "scripts/check.ps1")] : [path.join(root, "scripts/check.sh")], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, pending ? 1 : 0, marker + "\n" + result.stdout + result.stderr);
    if (pending) assert.match(result.stdout + result.stderr, /Bootstrap placeholders remain/);
  }
});
