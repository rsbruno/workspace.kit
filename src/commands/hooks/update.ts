import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { AGENT_NAMES, SCOPES } from "../../lib/targets";
import { defineCommand } from "../../lib/command";
import { withRegistry } from "../../lib/session";
import { hookTarget } from "../../lib/hooks";
import { installHooks } from "./install";
import { info } from "../../ui/summary";
import { pkg } from "../../lib/pkg";

export const update = defineCommand({
  run: (_names, flags) =>
    withRegistry(flags, async (reg, src) => {
      const from = join(reg.base, pkg.config.hooksPath);
      const known = (await readdir(from).catch(() => [])).filter((f) => f.endsWith(".sh"));
      const outdated: { agent: string; scope: string }[] = [];
      for (const scope of SCOPES) {
        for (const agent of AGENT_NAMES) {
          const dir = hookTarget(agent, scope).dir;
          const installed = (await readdir(dir).catch(() => [])).filter((f) => known.includes(f));
          const stale = await Promise.all(
            installed.map(
              async (name) => (await readFile(join(dir, name), "utf8")) !== (await readFile(join(from, name), "utf8"))
            )
          );
          if (stale.some(Boolean)) outdated.push({ agent, scope });
        }
      }
      if (!outdated.length) return info("hooks up to date");
      for (const { agent, scope } of outdated) await installHooks(reg, src, { agent, scope });
    }),
  description: "reinstall installed hooks that differ from the repo",
  name: "update"
});
