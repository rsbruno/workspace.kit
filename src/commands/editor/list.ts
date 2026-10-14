import { managedRows, askEditor } from "../../lib/editor/questions";
import { managedFor } from "../../lib/editor/service";
import { defineCommand } from "../../lib/command";
import { summary, info } from "../../ui/summary";
import { planSteps } from "../../lib/questions";

export const list = defineCommand({
  run: async (_names, flags) => {
    planSteps(!flags.editor);
    const editor = await askEditor(flags.editor);
    const managed = await managedFor(editor);
    if (!managed.length) return info(`no configs installed for ${editor}`);
    summary(`${managed.length} configs · ${editor}`, managedRows(managed));
  },
  description: "list installed configs (asks editor)",
  aliases: ["ls"],
  name: "list"
});
