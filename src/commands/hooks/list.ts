import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { type Settings, readSettings, hookTarget } from "../../lib/hooks";
import { AGENT_NAMES, SCOPES } from "../../lib/targets";
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

      const rows = [];
      for (const scope of SCOPES) {
        for (const agent of AGENT_NAMES) {
          const target = hookTarget(agent, scope);
          const registered = JSON.stringify((await readSettings(target).catch(() => ({}) as Settings)).hooks ?? {});
          for (const name of known) {
            const local = await readFile(join(target.dir, name), "utf8").catch(() => null);
            const latest = await readFile(join(from, name), "utf8");
            const file = local === null ? "missing" : local === latest ? "in-sync" : "outdated";
            const settings = registered.includes(`${target.dirRel}/${name}`) ? "registered" : "not registered";
            rows.push({ name: `${name} (${agent}, ${scope})`, detail: `${file} · ${settings}` });
          }
        }
      }
      summary(`hooks · ${src.ref}`, rows);
    }),
  description: "show hook scripts and settings registration per agent and scope",
  aliases: ["ls"],
  name: "list"
});
