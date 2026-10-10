import { existsSync } from "node:fs";
import { cp, mkdtemp, readdir, rename, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export class InitError extends Error {}

export function defaultTemplateDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packaged = path.resolve(here, "../template");
  if (existsSync(packaged)) {
    return packaged;
  }
  return path.resolve(here, "../../../template");
}

async function assertTemplate(templateDir: string): Promise<void> {
  let info;
  try {
    info = await stat(templateDir);
  } catch {
    throw new InitError(`Template directory not found: ${templateDir}`);
  }
  if (!info.isDirectory()) {
    throw new InitError(`Template path is not a directory: ${templateDir}`);
  }
}

async function assertTargetDoesNotExist(targetDir: string): Promise<void> {
  try {
    await stat(targetDir);
  } catch {
    return;
  }
  throw new InitError(`Target already exists: ${targetDir}`);
}

export async function initProject(targetDir: string, templateDir = defaultTemplateDir()): Promise<void> {
  const target = path.resolve(targetDir);
  const template = path.resolve(templateDir);

  await assertTemplate(template);
  await assertTargetDoesNotExist(target);

  const parent = path.dirname(target);
  const stagingRoot = await mkdtemp(path.join(parent === target ? tmpdir() : parent, ".control-plane-init-"));
  const stagedProject = path.join(stagingRoot, "project");

  try {
    await cp(template, stagedProject, { recursive: true, errorOnExist: true, force: false });
    const entries = await readdir(stagedProject);
    if (entries.length === 0) {
      throw new InitError("Template directory is empty.");
    }
    await rename(stagedProject, target);
  } catch (error) {
    await rm(stagingRoot, { recursive: true, force: true });
    throw error;
  }

  await rm(stagingRoot, { recursive: true, force: true });
}
