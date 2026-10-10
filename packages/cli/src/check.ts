import { access } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

export class CheckError extends Error {}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export interface CheckCommand {
  command: string;
  args: string[];
  script: string;
}

export async function resolveCheckCommand(rootDir = process.cwd(), platform = process.platform): Promise<CheckCommand> {
  const root = path.resolve(rootDir);
  const shellScript = path.join(root, "scripts/check.sh");
  const powerShellScript = path.join(root, "scripts/check.ps1");
  const hasShell = await exists(shellScript);
  const hasPowerShell = await exists(powerShellScript);

  if (platform === "win32") {
    if (hasPowerShell) {
      return {
        command: "powershell.exe",
        args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", powerShellScript],
        script: "scripts/check.ps1"
      };
    }
    if (hasShell) {
      return { command: "bash", args: [shellScript], script: "scripts/check.sh" };
    }
  } else {
    if (hasShell) {
      return { command: "bash", args: [shellScript], script: "scripts/check.sh" };
    }
    if (hasPowerShell) {
      return { command: "pwsh", args: ["-NoProfile", "-File", powerShellScript], script: "scripts/check.ps1" };
    }
  }

  throw new CheckError("No validation entry point found. Expected scripts/check.sh or scripts/check.ps1.");
}

export async function runProjectCheck(rootDir = process.cwd()): Promise<number> {
  const root = path.resolve(rootDir);
  const resolved = await resolveCheckCommand(root);

  return await new Promise<number>((resolve, reject) => {
    const child = spawn(resolved.command, resolved.args, {
      cwd: root,
      stdio: "inherit",
      shell: false
    });

    child.once("error", (error) => {
      reject(new CheckError(`Failed to start ${resolved.script}: ${error.message}`));
    });

    child.once("exit", (code, signal) => {
      if (signal) {
        reject(new CheckError(`${resolved.script} terminated by signal ${signal}.`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}
