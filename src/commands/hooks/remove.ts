import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";

import { writeSettings, readSettings, stripHooks, hookTarget } from "../../lib/hooks";
import { askAgents, planSteps, askScope } from "../../lib/questions";
import { defineCommand } from "../../lib/command";
import { summary, info } from "../../ui/summary";
import { withRegistry } from "../../lib/session";
import { pkg } from "../../lib/pkg";

export const remove = defineCommand({
  run: async (_names, flags) => {
    planSteps(!flags.scope, !flags.agent);
    const scope = await askScope(flags.scope);
    const agents = await askAgents(flags.agent);

    await withRegistry(flags, async (reg) => {
      const known = (await readdir(join(reg.base, pkg.config.hooksPath)).catch(() => [])).filter((f) => f.endsWith(".sh"));

      const rows: { name: string; detail: string }[] = [];
      for (const agent of agents) {
        const target = hookTarget(agent, scope);
        const present = (await readdir(target.dir).catch(() => [])).filter((f) => known.includes(f));
        if (!present.length) continue;
        for (const file of present) await rm(join(target.dir, file), { force: true });
        await writeSettings(target, stripHooks(target, await readSettings(target)));
        rows.push(...present.map((name) => ({ detail: `${agent} ${target.dirRel}`, name })));
      }
      if (!rows.length) return info(`no workspace hooks installed for ${agents.join(", ")} · ${scope}`);
      summary(`removed ${rows.length} hooks · ${scope}`, rows);
    });
  },
  description: "remove guard hooks and their settings entries (asks scope + agents)",
  aliases: ["rm"],
  name: "remove"
});
