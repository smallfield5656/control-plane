import { cp, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "..");
const repoTemplate = path.resolve(packageRoot, "../../template");
const packagedTemplate = path.join(packageRoot, "template");

const info = await stat(repoTemplate).catch(() => undefined);
if (!info?.isDirectory()) {
  throw new Error(`Template source not found: ${repoTemplate}`);
}

await rm(packagedTemplate, { recursive: true, force: true });
await cp(repoTemplate, packagedTemplate, { recursive: true });
console.log(`Staged template from ${repoTemplate}`);
