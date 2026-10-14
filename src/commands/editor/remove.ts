import { managedRows, askManaged, askEditor } from "../../lib/editor/questions";
import { revertEntry, managedFor } from "../../lib/editor/service";
import { summary, info, warn } from "../../ui/summary";
import { defineCommand } from "../../lib/command";
import { planSteps } from "../../lib/questions";

export const remove = defineCommand({
  run: async (names, flags) => {
    planSteps(!flags.editor, !names.length);
    const editor = await askEditor(flags.editor);
    const managed = await managedFor(editor);
    if (!managed.length) return info(`no configs installed for ${editor}`);

    let chosen = managed;
    if (names.length) {
      const missing = names.filter((n) => !managed.some((m) => m.name === n));
      if (missing.length) throw new Error(`not installed for ${editor}: ${missing.join(", ")}`);
      chosen = managed.filter((m) => names.includes(m.name));
    } else {
      chosen = await askManaged(managed, "remove");
    }

    for (const m of chosen) (await revertEntry(m)).forEach(warn);
    summary(`removed ${chosen.length} · ${editor}`, managedRows(chosen));
  },
  description: "remove installed configs and restore previous values (asks editor)",
  aliases: ["rm"],
  name: "remove"
});
