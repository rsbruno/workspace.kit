import type { Command } from "../lib/command";

import { skillsCommands } from "./skills";
import { editorCommands } from "./editor";

export const groups: Record<string, Command[]> = {
  skills: skillsCommands,
  editor: editorCommands
};
