#!/usr/bin/env node
import { intro, outro } from "@clack/prompts";
import { parseArgs } from "node:util";

import { kitCommands } from "./commands/kit";
import { findCommand } from "./lib/command";
import { header } from "./ui/header";
import { groups } from "./commands";
import { pkg } from "./lib/pkg";

const FLAGS_HELP =
  "flags: --agent claude|codex   --editor vscode|cursor   --scope project|global (skills) · user|project (editor)   --ref <ref>   --force   -v, --version";

function help() {
  header();
  const lines = Object.entries(groups).flatMap(([group, commands]) => [
    `workspace ${group} <command>`,
    "",
    ...commands.map((c) => `  ${c.name.padEnd(8)} ${c.description}`),
    ""
  ]);
  console.log([...lines, "shortcuts: workspace update · workspace version", "", FLAGS_HELP, ""].join("\n"));
}

function parse() {
  try {
    return parseArgs({
      options: {
        version: { type: "boolean", short: "v" },
        editor: { type: "string", short: "e" },
        force: { type: "boolean", short: "f" },
        agent: { type: "string", short: "a" },
        scope: { type: "string", short: "s" },
        help: { type: "boolean", short: "h" },
        ref: { type: "string" }
      },
      allowPositionals: true
    });
  } catch (e) {
    console.error(`error: ${(e as Error).message.split(". ")[0]}`);
    process.exit(1);
  }
}

const { positionals, values } = parse();

if (values.version) {
  console.log(pkg.version);
  process.exit(0);
}

const [group, action, ...rest] = positionals;
const command = group && action ? findCommand(groups[group] ?? [], action) : group ? findCommand(kitCommands, group) : undefined;

if (values.help || !command) {
  help();
  process.exit(values.help ? 0 : 1);
}

try {
  header();
  intro(action ? `workspace ${group} ${command.name}` : `workspace ${command.name}`);
  await command.run(rest, values);
  outro("done");
} catch (e) {
  console.error(`error: ${(e as Error).message}`);
  process.exit(1);
}
