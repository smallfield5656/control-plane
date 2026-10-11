import { execFileSync } from "node:child_process";
import { copyFile, lstat, mkdir, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const repoTemplate = path.join(repoRoot, "template");
const packagedTemplate = path.join(packageRoot, "template");

const info = await lstat(repoTemplate).catch(() => undefined);
if (!info?.isDirectory()) {
  throw new Error(`Template source not found: ${repoTemplate}`);
}

// The Git index defines the asset inventory; contents come from the working tree.
// No extra manifest or second editable Template source is introduced.
const tracked = execFileSync("git", ["ls-files", "-z", "--", "template/"], {
  cwd: repoRoot,
  encoding: "utf8"
}).split("\0").filter(Boolean);
if (!tracked.includes("template/.gitignore")) {
  throw new Error("Tracked template/.gitignore is required. Stage new Template assets with git add before building.");
}

// A path guard catches accidental credential files, not arbitrary secrets in text.
const forbidden = /(^|\/)(\.env(?:\..*)?|\.npmrc|auth\.json|credentials(?:\..*)?)$|\.(?:key|pem|p12|pfx)$/i;
const realTemplate = await realpath(repoTemplate);
await rm(packagedTemplate, { recursive: true, force: true });
try {
  for (const asset of tracked) {
    const relative = path.relative(repoTemplate, path.resolve(repoRoot, asset));
    if (!relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error(`Invalid template asset path: ${asset}`);
    }
    if (forbidden.test(asset) && path.basename(asset) !== ".env.example") {
      throw new Error(`Forbidden template asset: ${asset}`);
    }
    if (relative === "gitignore.template") {
      throw new Error(`Reserved template asset: ${asset}`);
    }
    const source = path.join(repoRoot, asset);
    if (!(await lstat(source)).isFile()) {
      throw new Error(`Template asset must be a regular file: ${asset}`);
    }
    const resolvedRelative = path.relative(realTemplate, await realpath(source));
    if (resolvedRelative.startsWith(`..${path.sep}`) || path.isAbsolute(resolvedRelative)) {
      throw new Error(`Template asset resolves outside the template: ${asset}`);
    }
    if (resolvedRelative !== relative) {
      throw new Error(`Template asset resolves through a symbolic directory: ${asset}`);
    }
    // npm excludes .gitignore itself. init restores this transport-only name.
    const destination = path.join(packagedTemplate, relative === ".gitignore" ? "gitignore.template" : relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }
} catch (error) {
  await rm(packagedTemplate, { recursive: true, force: true });
  throw error;
}
console.log(`Staged ${tracked.length} tracked Template assets.`);
