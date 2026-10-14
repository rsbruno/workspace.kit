export type Flags = { agent?: string; editor?: string; scope?: string; ref?: string; force?: boolean };

export type Command = {
  name: string;
  aliases?: string[];
  description: string;
  run: (args: string[], flags: Flags) => Promise<void>;
};

export const defineCommand = (command: Command) => command;

export function findCommand(commands: Command[], name: string) {
  return commands.find((c) => c.name === name || c.aliases?.includes(name));
}
