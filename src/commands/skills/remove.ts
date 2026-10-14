import { rm } from "node:fs/promises";

import { askInstalled, planSteps, askScope, askAgent } from "../../lib/questions";
import { listInstalled } from "../../lib/installed";
import { forgetInstall } from "../../lib/manifest";
import { defineCommand } from "../../lib/command";
import { summary, info } from "../../ui/summary";
import { installedRows } from "../../ui/rows";

export const remove = defineCommand({
  run: async (names, flags) => {
    planSteps(!flags.scope, !flags.agent, !names.length);
    const scope = await askScope(flags.scope);
    const agent = await askAgent(flags.agent);
    const installed = await listInstalled(agent, [scope]);
    if (!installed.length) return info(`no skills installed for ${agent} · ${scope}`);

    let chosen = installed;
    if (names.length) {
      const missing = names.filter((n) => !installed.some((i) => i.name === n));
      if (missing.length) throw new Error(`not installed for ${agent} · ${scope}: ${missing.join(", ")}`);
      chosen = installed.filter((i) => names.includes(i.name));
    } else {
      chosen = await askInstalled(installed);
    }

    for (const i of chosen) {
      await rm(i.dir, { recursive: true, force: true });
      await forgetInstall(i.baseDir, i.name);
    }
    summary(`removed ${chosen.length} · ${agent} · ${scope}`, installedRows(chosen));
  },
  description: "remove skills (asks scope + agent)",
  aliases: ["rm"],
  name: "remove"
});
