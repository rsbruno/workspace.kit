import type { EditorScope, Editor } from "../../lib/editor/editors";

import { installItem, revertEntry, managedFor, sourceDir, itemHash } from "../../lib/editor/service";
import { askEditor } from "../../lib/editor/questions";
import { summary, info, warn } from "../../ui/summary";
import { defineCommand } from "../../lib/command";
import { findItem } from "../../lib/editor/items";
import { withRegistry } from "../../lib/session";
import { planSteps } from "../../lib/questions";

export const update = defineCommand({
  run: async (_names, flags) => {
    planSteps(!flags.editor);
    const editor = await askEditor(flags.editor);
    const managed = await managedFor(editor);
    if (!managed.length) return info(`no configs installed for ${editor}`);

    await withRegistry(flags, async (reg, src) => {
      const dir = sourceDir(reg);
      const updated: { name: string; detail: string }[] = [];
      for (const m of managed) {
        const item = findItem(m.name);
        if (!item || (await itemHash(dir, item).catch(() => null)) === null) continue;
        if ((await itemHash(dir, item)) === m.entry.hash) continue;
        (await revertEntry(m, dir)).forEach(warn);
        await installItem(
          item,
          m.entry.scope as EditorScope,
          m.entry.scope === "user" ? (m.entry.agent as Editor) : null,
          reg,
          src
        );
        updated.push({ detail: m.entry.scope, name: m.name });
      }
      if (!updated.length) return info(`everything up to date · ${editor}`);
      summary(`updated ${updated.length} · ${editor}`, updated);
    });
  },
  description: "reapply configs that differ from the repo (asks editor)",
  name: "update"
});
