import type { Command } from "../lib/command";

import { skillsCommands } from "./skills";
import { editorCommands } from "./editor";
import { agentsCommands } from "./agents";
import { hooksCommands } from "./hooks";
import { kitCommands } from "./kit";

export const groups: Record<string, Command[]> = {
  skills: skillsCommands,
  editor: editorCommands,
  agents: agentsCommands,
  hooks: hooksCommands,
  kit: kitCommands
};
