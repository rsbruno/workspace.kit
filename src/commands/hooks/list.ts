import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { readSettings, HOOKS_DIR, hooksDir } from "../../lib/hooks";
import { defineCommand } from "../../lib/command";
import { withRegistry } from "../../lib/session";
import { summary, info } from "../../ui/summary";
import { pkg } from "../../lib/pkg";

export const list = defineCommand({
  run: (_names, flags) =>
    withRegistry(flags, async (reg, src) => {
      const from = join(reg.base, pkg.config.hooksPath);
      const known = (await readdir(from).catch(() => [])).filter((f) => f.endsWith(".sh"));
      if (!known.length) return info(`${src.repo} has no ${pkg.config.hooksPath}`);

      const registered = JSON.stringify((await readSettings()).hooks ?? {});
      const rows = await Promise.all(
        known.map(async (name) => {
          const local = await readFile(join(hooksDir(), name), "utf8").catch(() => null);
          const latest = await readFile(join(from, name), "utf8");
          const file = local === null ? "missing" : local === latest ? "in-sync" : "outdated";
          const settings = registered.includes(`${HOOKS_DIR}/${name}`) ? "registered" : "not registered";
          return { detail: `${file} · ${settings}`, name };
        })
      );
      summary(`hooks · ${src.ref}`, rows);
    }),
  description: "show hook scripts and settings registration against the repo",
  aliases: ["ls"],
  name: "list"
});
