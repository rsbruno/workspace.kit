import type { Command } from "../lib/command";

import { skillsCommands } from "./skills";
import { editorCommands } from "./editor";
import { kitCommands } from "./kit";

export const groups: Record<string, Command[]> = {
  skills: skillsCommands,
  editor: editorCommands,
  kit: kitCommands
};
