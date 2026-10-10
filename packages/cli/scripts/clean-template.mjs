import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const packagedTemplate = path.resolve(here, "../template");
await rm(packagedTemplate, { recursive: true, force: true });
