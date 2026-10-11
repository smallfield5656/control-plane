export interface CommandDefinition { name: string; usage: string; options: string[]; min: number; max: number; directory?: boolean }
export const GLOBAL_OPTIONS = ["--no-color", "--help"];
export const COMMANDS: CommandDefinition[] = [
  { name: "init", usage: "init <directory>", options: [], min: 1, max: 1, directory: true },
  { name: "doctor", usage: "doctor [directory]", options: [], min: 0, max: 1, directory: true },
  { name: "next", usage: "next [directory]", options: [], min: 0, max: 1, directory: true },
  { name: "bootstrap", usage: "bootstrap [directory]  alias for next", options: [], min: 0, max: 1, directory: true },
  { name: "check", usage: "check [directory]", options: [], min: 0, max: 1, directory: true },
  { name: "approve", usage: "approve <item-id> | approve adr <number>", options: [], min: 1, max: 2 },
  { name: "reject", usage: 'reject adr <number> --reason "<reason>"', options: ["--reason"], min: 2, max: 2 },
  { name: "migrate", usage: "migrate [adr <number>]", options: [], min: 0, max: 2 },
  { name: "recover", usage: "recover --complete | --rollback", options: ["--complete", "--rollback"], min: 0, max: 0 },
  { name: "completion", usage: "completion <bash|powershell>", options: [], min: 1, max: 1 }
];
