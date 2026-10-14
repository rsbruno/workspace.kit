import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { defineCommand } from "../../lib/command";
import { withRegistry } from "../../lib/session";
import { hooksDir } from "../../lib/hooks";
import { installHooks } from "./install";
import { info } from "../../ui/summary";
import { pkg } from "../../lib/pkg";

export const update = defineCommand({
  run: (_names, flags) =>
    withRegistry(flags, async (reg, src) => {
      const from = join(reg.base, pkg.config.hooksPath);
      const known = (await readdir(from).catch(() => [])).filter((f) => f.endsWith(".sh"));
      const differs = await Promise.all(
        known.map(
          async (name) =>
            (await readFile(join(hooksDir(), name), "utf8").catch(() => null)) !== (await readFile(join(from, name), "utf8"))
        )
      );
      if (!differs.some(Boolean)) return info("hooks up to date");
      await installHooks(reg, src);
    }),
  description: "reinstall hooks that differ from the repo",
  name: "update"
});
