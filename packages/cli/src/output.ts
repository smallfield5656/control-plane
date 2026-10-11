import { styleText } from "node:util";

export interface OutputOptions {
  noColor?: boolean;
  stream?: { isTTY?: boolean };
  env?: NodeJS.ProcessEnv;
}

export function colorEnabled({ noColor = false, stream = process.stdout, env = process.env }: OutputOptions = {}): boolean {
  if (noColor || Boolean(env.NO_COLOR) || Boolean(env.NODE_DISABLE_COLORS) || env.FORCE_COLOR === "0") {
    return false;
  }
  if (env.FORCE_COLOR) return true;
  return Boolean(stream.isTTY) && env.TERM !== "dumb" && !env.CI;
}

// Decide support ourselves to keep behavior consistent across all Node 22 minors.
export function createStyles(options: OutputOptions = {}) {
  const enabled = colorEnabled(options);
  const paint = (format: Parameters<typeof styleText>[0], text: string) =>
    enabled ? styleText(format, text, { validateStream: false }) : text;
  return {
    heading: (text: string) => paint(["cyan", "bold"], text),
    success: (text: string) => paint("green", text),
    warning: (text: string) => paint("yellow", text),
    review: (text: string) => paint(["yellow", "bold"], text),
    error: (text: string) => paint("red", text),
    status: (text: string) => {
      if (text === "Needs Review") return paint(["yellow", "bold"], text);
      if (text === "Setup Incomplete") return paint("red", text);
      if (["Complete", "Bootstrap Complete", "Ready for Validation", "None"].includes(text)) return paint("green", text);
      return paint("yellow", text);
    }
  };
}

export type OutputStyles = ReturnType<typeof createStyles>;
export const plainStyles = createStyles({ noColor: true });
