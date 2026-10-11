import assert from "node:assert/strict";
import test from "node:test";
import { adr, fixture, ok, read, state, stateFile, write } from "./helpers/project.mjs";

function candidates(root, tokens) {
  return JSON.parse(ok(root, "completion", "candidates", "--shell", "powershell", "--index", String(tokens.length - 1), "--", ...tokens));
}
test("completion uses implemented syntax and state IDs without writing the Project", async t => {
  const root = await fixture(t);
  const before = await read(root, stateFile);
  assert.deepEqual(candidates(root, ["control-plane", "in"]).candidates.map(x => x.value), ["init"]);
  assert.deepEqual(candidates(root, ["control-plane", "approve", "req"]).candidates.map(x => x.value), ["requirements"]);
  assert.deepEqual(candidates(root, ["control-plane", "reject", ""]).candidates.map(x => x.value), ["adr"]);
  const data = await state(root);
  data.items[0].id = "custom-overview";
  data.items[1].dependsOn = ["custom-overview"];
  await write(root, stateFile, JSON.stringify(data));
  assert.deepEqual(candidates(root, ["control-plane", "approve", "custom"]).candidates.map(x => x.value), ["custom-overview"]);
  assert.deepEqual(candidates(root, ["control-plane", "reject", "adr", "0001", "--reason", "text"]).candidates, []);
  assert.equal(candidates(root, ["control-plane", "doctor", ""]).kind, "directory");
  assert.deepEqual(candidates(root, ["control-plane", "approve", "--r"]).candidates, []);
  assert.deepEqual(candidates(root, ["control-plane", "reject", "adr", "0001", "--r"]).candidates.map(x => x.value), ["--reason"]);
  await write(root, stateFile, before);
  assert.equal(await read(root, stateFile), before);
});
test("ADR completion inserts only unique nonzero numbers and includes title descriptions", async t => {
  const root = await fixture(t);
  await write(root, "docs/architecture/adr/0001-one.md", adr());
  await write(root, "docs/architecture/adr/0002-two.md", adr("0002"));
  await write(root, "docs/architecture/adr/0002-duplicate.md", adr("0002"));
  const result = candidates(root, ["control-plane", "approve", "adr", "000"]);
  assert.deepEqual(result.candidates.map(x => x.value), ["0001"]);
  assert.match(result.candidates[0].description, /Runtime/);
  assert.match(ok(root, "completion", "candidates", "--shell", "bash", "--index", "3", "--", "control-plane", "approve", "adr", "000"), /^values\n0001/);
});
test("invalid state keeps static completion and emits no diagnostics", async t => {
  const root = await fixture(t);
  await write(root, stateFile, "broken JSON");
  assert.deepEqual(candidates(root, ["control-plane", "in"]).candidates.map(x => x.value), ["init"]);
  assert.deepEqual(candidates(root, ["control-plane", "approve", "req"]).candidates, []);
  assert.deepEqual(candidates(root, ["control-plane", "approve", ""]).candidates.map(x => x.value), ["adr"]);
  assert.match(ok(root, "completion", "bash"), /complete -F/);
  assert.match(ok(root, "completion", "powershell"), /Register-ArgumentCompleter/);
});
