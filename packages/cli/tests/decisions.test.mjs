import assert from "node:assert/strict";
import { mkdir, symlink } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { adr, fixture, ok, read, run, state, stateFile, upstream, write } from "./helpers/project.mjs";

const adrFile = "docs/architecture/adr/0001-runtime.md";
test("items require current upstream approvals, persist hashes and are byte-identical on no-op", async t => {
  const root = await fixture(t);
  const initial = await read(root, stateFile);
  assert.equal(run(root, "approve", "requirements").status, 1);
  assert.equal(await read(root, stateFile), initial);
  assert.match(ok(root, "approve", "product-overview"), /Product Overview|product-overview/);
  const approved = await read(root, stateFile);
  assert.match(ok(root, "approve", "product-overview"), /already|承認済み/i);
  assert.equal(await read(root, stateFile), approved);
  upstream(root);
  assert.ok((await state(root)).items[3].approval.files["docs/product/overview.md"]);
  await write(root, "docs/product/overview.md", "Changed.\n");
  assert.equal(run(root, "approve", "delivery").status, 1);
  assert.match(ok(root, "next"), /Needs Review/);
  upstream(root);
});
test("unknown targets, placeholders, invalid schema and escaped paths never change state", async t => {
  const root = await fixture(t);
  for (const target of [[], ["missing"]]) {
    const before = await read(root, stateFile);
    assert.notEqual(run(root, "approve", ...target).status, 0);
    assert.equal(await read(root, stateFile), before);
  }
  for (const content of ["TODO", "<短い名称>", "<!-- プロジェクト固有の要求をここに追加する -->"]) {
    await write(root, "docs/product/requirements.md", content);
    ok(root, "approve", "product-overview");
    const before = await read(root, stateFile);
    assert.equal(run(root, "approve", "requirements").status, 1);
    assert.equal(await read(root, stateFile), before);
  }
  for (const input of ["../outside.md", "C:/outside.md", "C:outside.md"]) {
    const data = await state(root);
    data.items[0].inputs = [input];
    await write(root, stateFile, JSON.stringify(data));
    const before = await read(root, stateFile);
    assert.equal(run(root, "approve", "product-overview").status, 1);
    assert.equal(await read(root, stateFile), before);
  }
});
test("approve changes only the selected Proposed ADR and architecture remains unapproved", async t => {
  const root = await fixture(t);
  upstream(root);
  await write(root, adrFile, adr());
  await write(root, "docs/architecture/adr/0002-other.md", adr("0002"));
  const other = await read(root, "docs/architecture/adr/0002-other.md");
  assert.match(ok(root, "approve", "adr", "0001"), /0001.*|Accepted/);
  assert.match(await read(root, adrFile), /Status: Accepted/);
  assert.equal(await read(root, "docs/architecture/adr/0002-other.md"), other);
  assert.equal((await state(root)).items[4].approval, null);
  assert.equal(run(root, "approve", "architecture").status, 1);
  const before = await read(root, stateFile);
  ok(root, "approve", "adr", "0001");
  assert.equal(await read(root, stateFile), before);
});
test("ADR upstream-only changes can be reapproved; changes to Accepted text cannot", async t => {
  const root = await fixture(t);
  upstream(root);
  await write(root, adrFile, adr());
  ok(root, "approve", "adr", "0001");
  const accepted = await read(root, adrFile);
  await write(root, "docs/product/overview.md", "New assumptions.\n");
  assert.equal(run(root, "approve", "adr", "0001").status, 1);
  upstream(root);
  assert.match(ok(root, "next"), /Needs Review/);
  assert.match(ok(root, "approve", "adr", "0001"), /再承認|re-approved/i);
  assert.equal(await read(root, adrFile), accepted);
  ok(root, "approve", "architecture");
  await write(root, adrFile, accepted.replace("Use Node.js.", "Use another runtime."));
  const before = await read(root, stateFile);
  assert.equal(run(root, "approve", "adr", "0001").status, 1);
  assert.equal(run(root, "approve", "architecture").status, 1);
  assert.equal(await read(root, stateFile), before);
  assert.match(ok(root, "doctor"), /Needs Review/);
});
test("reject works without upstream approvals and safely stores a literal multiline reason", async t => {
  const root = await fixture(t);
  await write(root, adrFile, adr());
  const reason = "Prefer another option.\n## Decision\n- Status: Accepted\n```\n$(not-a-command)";
  ok(root, "reject", "adr", "0001", "--reason", reason);
  const rejected = await read(root, adrFile);
  assert.match(rejected, /Status: Rejected/);
  assert.ok(rejected.includes(reason));
  assert.equal((await state(root)).items[0].approval, null);
  assert.ok(!JSON.stringify(await state(root)).includes(reason));
  const before = await read(root, stateFile);
  ok(root, "reject", "adr", "0001", "--reason", reason);
  assert.equal(await read(root, stateFile), before);
  assert.equal(await read(root, adrFile), rejected);
  assert.equal(run(root, "reject", "adr", "0001", "--reason", "different").status, 1);
  assert.equal(run(root, "approve", "adr", "0001").status, 1);
  await write(root, adrFile, rejected + "Edited.\n");
  assert.equal(run(root, "reject", "adr", "0001", "--reason", reason).status, 1);
});
test("invalid number, duplicate number, ambiguous Status, empty reason and reason overwrite are refused", async t => {
  const root = await fixture(t);
  upstream(root);
  await write(root, adrFile, adr());
  for (const number of ["0000", "1", "9999", "../0001", adrFile]) assert.notEqual(run(root, "approve", "adr", number).status, 0);
  await write(root, "docs/architecture/adr/0001-duplicate.md", adr());
  assert.match(run(root, "approve", "adr", "0001").stderr, /duplicate|重複/i);
  await write(root, "docs/architecture/adr/0001-duplicate.md", adr().replace("Status: Proposed", "Status: Rejected"));
  assert.notEqual(run(root, "reject", "adr", "0001", "--reason", "reason").status, 0);
  const root2 = await fixture(t);
  upstream(root2);
  for (const text of [adr() + "\n- Status: Accepted\n", adr() + "\n## Rejection Reason\nExisting reason.\n"]) {
    await write(root2, adrFile, text);
    const before = await read(root2, stateFile);
    assert.equal(run(root2, "reject", "adr", "0001", "--reason", "replacement").status, 1);
    assert.equal(await read(root2, adrFile), text);
    assert.equal(await read(root2, stateFile), before);
  }
  await write(root2, adrFile, adr());
  assert.notEqual(run(root2, "reject", "adr", "0001", "--reason", "   ").status, 0);
});
test("legacy migration preserves IDs and explicitly records existing Accepted without editing it", async t => {
  const root = await fixture(t, { legacy: true });
  await write(root, adrFile, adr("0001", "Accepted"));
  const text = await read(root, adrFile);
  assert.equal(run(root, "approve", "product-goal").status, 1);
  ok(root, "migrate");
  assert.equal((await state(root)).schemaVersion, 2);
  assert.equal((await state(root)).items[0].id, "product-goal");
  upstream(root, "product-goal");
  assert.equal(run(root, "approve", "adr", "0001").status, 1);
  assert.equal(run(root, "approve", "architecture").status, 1);
  ok(root, "migrate", "adr", "0001");
  assert.equal(await read(root, adrFile), text);
  assert.equal((await state(root)).adr.decisions["0001"].origin, "migration");
  ok(root, "approve", "architecture");
  const before = await read(root, stateFile);
  ok(root, "migrate");
  ok(root, "migrate", "adr", "0001");
  assert.equal(await read(root, stateFile), before);
});
test("valid Supersede preserves old adoption record and catches interrupted relations or body edits", async t => {
  const root = await fixture(t);
  upstream(root);
  await write(root, adrFile, adr());
  ok(root, "approve", "adr", "0001");
  const record = JSON.stringify((await state(root)).adr.decisions["0001"]);
  const second = "docs/architecture/adr/0002-next.md";
  await write(root, second, adr("0002", "Proposed", "ADR-0001"));
  ok(root, "approve", "adr", "0002");
  assert.equal(run(root, "approve", "architecture").status, 1);
  const old = (await read(root, adrFile)).replace("Status: Accepted", "Status: Superseded").replace("Superseded By: —", "Superseded By: ADR-0002");
  await write(root, adrFile, old);
  ok(root, "approve", "architecture");
  assert.equal(JSON.stringify((await state(root)).adr.decisions["0001"]), record);
  await write(root, adrFile, old.replace("Use Node.js.", "Changed decision."));
  assert.equal(run(root, "approve", "architecture").status, 1);
  await write(root, adrFile, old.replace("ADR-0002", "ADR-0001"));
  assert.equal(run(root, "approve", "architecture").status, 1);
});
test("lock prevents updates and read-only commands never recover or remove it", async t => {
  const root = await fixture(t);
  await write(root, ".control-plane/approval.lock", JSON.stringify({ pid: process.pid, token: "owner" }));
  const before = await read(root, stateFile);
  assert.equal(run(root, "approve", "product-overview").status, 1);
  ok(root, "next");
  assert.equal(await read(root, stateFile), before);
  assert.match(await read(root, ".control-plane/approval.lock"), /owner/);
});
test("schema cannot omit ADRs from Architecture scope or declare cyclic ADR upstream", async t => {
  const root = await fixture(t);
  const base = await state(root);
  for (const mutate of [data => { data.items[4].inputDirectories[0].exclude.push("0001-runtime.md"); }, data => { data.adr.dependsOn = ["architecture"]; }, data => { data.schemaVersion = 9; }]) {
    const data = structuredClone(base); mutate(data);
    await write(root, stateFile, JSON.stringify(data));
    const before = await read(root, stateFile);
    assert.equal(run(root, "approve", "product-overview").status, 1);
    assert.equal(await read(root, stateFile), before);
  }
});
test("UTF-8 errors, empty inputs and symlinks are refused before approval", async t => {
  const root = await fixture(t);
  for (const content of [Buffer.from([0xff]), "   \n"]) {
    await write(root, "docs/product/overview.md", content);
    const before = await read(root, stateFile);
    assert.equal(run(root, "approve", "product-overview").status, 1);
    assert.equal(await read(root, stateFile), before);
  }
  if (process.platform !== "win32") {
    const data = await state(root);
    await symlink(path.join(root, "README.md"), path.join(root, "link.md"));
    data.items[0].inputs = ["link.md"];
    await write(root, stateFile, JSON.stringify(data));
    assert.equal(run(root, "approve", "product-overview").status, 1);
  }
});
test("continued ADR replacement chains validate and old upstream does not require reapproval", async t => {
  const root = await fixture(t);
  upstream(root);
  await write(root, adrFile, adr());
  ok(root, "approve", "adr", "0001");
  for (const [number, previous] of [["0002", "0001"], ["0003", "0002"]]) {
    const nextFile = `docs/architecture/adr/${number}-runtime.md`;
    const oldFile = previous === "0001" ? adrFile : `docs/architecture/adr/${previous}-runtime.md`;
    await write(root, nextFile, adr(number, "Proposed", `ADR-${previous}`));
    ok(root, "approve", "adr", number);
    await write(root, oldFile, (await read(root, oldFile)).replace("Status: Accepted", "Status: Superseded").replace("Superseded By: —", `Superseded By: ADR-${number}`));
    ok(root, "approve", "architecture");
  }
  await write(root, "docs/product/overview.md", "Changed assumptions.\n");
  upstream(root);
  ok(root, "approve", "adr", "0003");
  ok(root, "approve", "architecture");
});
test("legacy Superseded migration records current bytes without inventing past adoption", async t => {
  const root = await fixture(t, { legacy: true });
  await write(root, adrFile, adr("0001", "Superseded").replace("Superseded By: —", "Superseded By: ADR-0002"));
  await write(root, "docs/architecture/adr/0002-runtime.md", adr("0002", "Accepted", "ADR-0001"));
  ok(root, "migrate");
  upstream(root, "product-goal");
  ok(root, "migrate", "adr", "0001");
  ok(root, "migrate", "adr", "0002");
  ok(root, "approve", "architecture");
  assert.equal((await state(root)).adr.decisions["0001"].kind, "migrated-superseded");
});
test("next distinguishes document preparation from explicit approval waiting", async t => {
  const prepared = await fixture(t);
  const output = ok(prepared, "next");
  assert.match(output, /Next Step:\s+Approval Pending/);
  assert.match(output, /control-plane approve product-overview/);
  assert.doesNotMatch(output, /私と壁打ち/);
  const incomplete = await fixture(t, { prepared: false });
  assert.match(ok(incomplete, "next"), /Next Step:\s+Product Definition/);
});
test("an approval item cannot silently approve an empty scope", async t => {
  const root = await fixture(t);
  const definition = await state(root);
  definition.items[0].inputs = [];
  await write(root, stateFile, JSON.stringify(definition));
  const before = await read(root, stateFile);
  assert.equal(run(root, "approve", "product-overview").status, 1);
  assert.equal(await read(root, stateFile), before);
});
