import { askEditorScope, askEditors, askItems } from "../../lib/editor/questions";
import { installItem, sourceDir } from "../../lib/editor/service";
import { availableItems } from "../../lib/editor/items";
import { summary, info, warn } from "../../ui/summary";
import { defineCommand } from "../../lib/command";
import { withRegistry } from "../../lib/session";
import { planSteps } from "../../lib/questions";
import { task } from "../../ui/task";

export const add = defineCommand({
  run: (names, flags) =>
    withRegistry(flags, async (reg, src) => {
      const available = await availableItems(sourceDir(reg));
      if (!available.length) return info(`${src.repo} has no editor configs`);

      planSteps(!names.length, !flags.scope, !flags.editor);
      let items = available;
      if (names.length) {
        const missing = names.filter((n) => !available.some((a) => a.id === n));
        if (missing.length)
          throw new Error(`not in repo: ${missing.join(", ")} (available: ${available.map((a) => a.id).join(", ")})`);
        items = available.filter((a) => names.includes(a.id));
      } else {
        items = await askItems(available);
      }

      const scope = await askEditorScope(flags.scope);
      const editors = scope === "user" ? await askEditors(flags.editor) : [null];

      const failed: string[] = [];
      await task("installing", "installed", async () => {
        for (const editor of editors)
          for (const item of items) {
            try {
              await installItem(item, scope, editor, reg, src);
            } catch (e) {
              failed.push(`${item.id}: ${(e as Error).message}`);
            }
          }
      });
      failed.forEach(warn);
      summary(
        `installed ${items.length} · ${scope === "user" ? editors.join(", ") : "project"} · ${scope}`,
        items.map((i) => ({ detail: i.label, name: i.id }))
      );
    }),
  description: "install configs: settings, extensions, keybindings, snippets (asks scope + editors)",
  name: "add"
});
