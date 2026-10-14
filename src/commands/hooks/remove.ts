import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";

import { writeSettings, readSettings, stripHooks, hooksDir } from "../../lib/hooks";
import { defineCommand } from "../../lib/command";
import { summary, info } from "../../ui/summary";
import { withRegistry } from "../../lib/session";
import { pkg } from "../../lib/pkg";

export const remove = defineCommand({
  run: (_names, flags) =>
    withRegistry(flags, async (reg) => {
      const known = (await readdir(join(reg.base, pkg.config.hooksPath)).catch(() => [])).filter((f) => f.endsWith(".sh"));
      const present = (await readdir(hooksDir()).catch(() => [])).filter((f) => known.includes(f));
      if (!present.length) return info("no workspace hooks installed in this project");

      for (const file of present) await rm(join(hooksDir(), file), { force: true });
      await writeSettings(stripHooks(await readSettings()));
      summary(
        `removed ${present.length} hooks`,
        present.map((name) => ({ detail: ".claude/hooks", name }))
      );
    }),
  description: "remove guard hooks and their .claude/settings.json entries",
  aliases: ["rm"],
  name: "remove"
});
