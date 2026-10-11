import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { adr, fixture, ok, packageDir, read, run, state, stateFile, write } from "./helpers/project.mjs";
const transactionUrl = pathToFileURL(path.join(packageDir, "dist/approval-transaction.js")).href;
const { APPROVAL_JOURNAL, APPROVAL_LOCK, commitApprovalTransaction, recoverApprovalTransaction, withApprovalLock } = await import(transactionUrl);
const adrFile = "docs/architecture/adr/0001-runtime.md";
async function changes(root, large = false) {
  const text = adr() + (large ? "x".repeat(1300000) : "");
  await write(root, adrFile, text);
  const data = await state(root);
  data.items[0].label = "Updated Overview";
  return [
    { file: adrFile, before: Buffer.from(text), after: Buffer.from(text.replace("Status: Proposed", "Status: Accepted")) },
    { file: stateFile, before: await readFile(path.join(root, stateFile)), after: Buffer.from(JSON.stringify(data, null, 2) + "\n") }
  ];
}
for (const phase of ["journal", "first file", "all files"]) for (const direction of ["complete", "rollback"]) {
  test(`recovery ${direction} is repeatable after failure at ${phase}`, async t => {
    const root = await fixture(t);
    const edits = await changes(root);
    const fail = async () => { throw new Error("simulated failure"); };
    const hooks = phase === "journal" ? { afterJournal: fail } : { afterWrite: async index => { if (index === (phase === "first file" ? 0 : 1)) await fail(); } };
    await assert.rejects(withApprovalLock(root, () => commitApprovalTransaction(root, edits, hooks)), /simulated failure/);
    const journal = await read(root, APPROVAL_JOURNAL);
    assert.match(ok(root, "next"), /recover/);
    assert.equal(await read(root, APPROVAL_JOURNAL), journal);
    assert.equal(run(root, "approve", "product-overview").status, 1);
    await assert.rejects(recoverApprovalTransaction(root, direction, { afterWrite: fail }), /simulated failure/);
    ok(root, "recover", `--${direction}`);
    for (const edit of edits) assert.deepEqual(await readFile(path.join(root, edit.file)), direction === "complete" ? edit.after : edit.before);
    await assert.rejects(read(root, APPROVAL_JOURNAL), { code: "ENOENT" });
    ok(root, "recover", `--${direction}`);
  });
}
test("a journal larger than the input-file limit is recoverable within the journal limit", async t => {
  const root = await fixture(t);
  const edits = await changes(root, true);
  await assert.rejects(withApprovalLock(root, () => commitApprovalTransaction(root, edits, { afterJournal: async () => { throw Error("interrupted"); } })), /interrupted/);
  assert.ok((await readFile(path.join(root, APPROVAL_JOURNAL))).length > 2 * 1024 * 1024);
  ok(root, "recover", "--complete");
  assert.deepEqual(await readFile(path.join(root, adrFile)), edits[0].after);
});
test("external edit to any target refuses all recovery writes", async t => {
  const root = await fixture(t);
  const edits = await changes(root);
  await assert.rejects(withApprovalLock(root, () => commitApprovalTransaction(root, edits, { afterWrite: async () => { throw Error("interrupted"); } })), /interrupted/);
  await write(root, stateFile, "External content.\n");
  const beforeAdr = await read(root, adrFile), beforeState = await read(root, stateFile), beforeJournal = await read(root, APPROVAL_JOURNAL);
  assert.equal(run(root, "recover", "--rollback").status, 1);
  assert.equal(await read(root, adrFile), beforeAdr);
  assert.equal(await read(root, stateFile), beforeState);
  assert.equal(await read(root, APPROVAL_JOURNAL), beforeJournal);
});
test("corrupt hash and malicious journal paths are rejected without writing targets", async t => {
  const root = await fixture(t);
  const edits = await changes(root);
  await assert.rejects(withApprovalLock(root, () => commitApprovalTransaction(root, edits, { afterJournal: async () => { throw Error("interrupted"); } })), /interrupted/);
  const original = JSON.parse(await read(root, APPROVAL_JOURNAL));
  for (const mutate of [j => { j.changes[0].afterHash = "bad"; }, j => { j.changes[0].file = "../outside.md"; }, j => { j.changes[0].file = "docs/product/overview.md"; }]) {
    const journal = structuredClone(original); mutate(journal);
    await write(root, APPROVAL_JOURNAL, JSON.stringify(journal));
    assert.equal(run(root, "recover", "--complete").status, 1);
    for (const edit of edits) assert.deepEqual(await readFile(path.join(root, edit.file)), edit.before);
  }
});
test("real process crash leaves a lock that cannot be bypassed before explicit recovery", async t => {
  const root = await fixture(t);
  const edits = await changes(root);
  const script = `import { readFile } from 'node:fs/promises'; import path from 'node:path'; import { withApprovalLock, commitApprovalTransaction } from ${JSON.stringify(transactionUrl)}; const root = process.argv[1]; const edits = ${JSON.stringify(edits.map(e => ({ file: e.file, before: e.before.toString("base64"), after: e.after.toString("base64") })))}.map(e => ({file:e.file,before:Buffer.from(e.before,'base64'),after:Buffer.from(e.after,'base64')})); await withApprovalLock(root, () => commitApprovalTransaction(root, edits, {afterWrite: async () => process.exit(19)}));`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", script, root], { stdio: "pipe" });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  let stderr = ""; child.stderr.on("data", data => { stderr += data; });
  const exit = await new Promise(resolve => child.on("close", resolve));
  assert.equal(exit, 19, stderr);
  const lock = JSON.parse(await read(root, APPROVAL_LOCK));
  assert.equal(lock.pid, child.pid);
  assert.equal(run(root, "approve", "product-overview").status, 1);
  assert.equal(run(root, "recover", "--complete").status, 1);
  // The test knows the exact child has exited; mirrors the documented manual stale-lock step.
  await unlink(path.join(root, APPROVAL_LOCK));
  ok(root, "recover", "--complete");
  for (const edit of edits) assert.deepEqual(await readFile(path.join(root, edit.file)), edit.after);
});
test("concurrent processes cannot overwrite an approval read before the lock", { timeout: 15000 }, async t => {
  const root = await fixture(t);
  const stateUrl = pathToFileURL(path.join(packageDir, "dist/bootstrap-state.js")).href;
  const script = `import {readFile} from 'node:fs/promises'; import path from 'node:path'; import {withApprovalLock,commitApprovalTransaction} from ${JSON.stringify(transactionUrl)}; import {readBootstrapState,hashBootstrapInput} from ${JSON.stringify(stateUrl)}; const root=process.argv[1]; await withApprovalLock(root, async()=>{ const file=${JSON.stringify(stateFile)}; const before=await readFile(path.join(root,file)); const state=await readBootstrapState(root); const item=state.definition.items[0]; item.label='Concurrent reviewed overview'; const files={}; for(const file of state.items[0].approvalScope) files[file]=await hashBootstrapInput(root,file); item.approval={status:'approved',files}; process.stdout.write('locked\\n'); await new Promise(resolve=>process.stdin.once('data',resolve)); process.stdin.pause(); await commitApprovalTransaction(root,[{file,before,after:Buffer.from(JSON.stringify(state.definition,null,2)+'\\n')}]); });`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", script, root], { stdio: "pipe" });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  let stderr = ""; child.stderr.on("data", data => { stderr += data; });
  await new Promise((resolve, reject) => { child.stdout.once("data", resolve); child.once("error", reject); child.once("exit", code => { if (code !== 0) reject(Error(stderr)); }); });
  const before = await read(root, stateFile);
  assert.equal(run(root, "approve", "requirements").status, 1);
  assert.equal(await read(root, stateFile), before);
  const completed = new Promise(resolve => child.once("close", resolve));
  child.stdin.end("continue\n");
  assert.equal(await completed, 0, stderr);
  ok(root, "approve", "requirements");
  const final = await state(root);
  assert.equal(final.items[0].label, "Concurrent reviewed overview");
  assert.ok(final.items[0].approval);
  assert.ok(final.items[1].approval);
});
