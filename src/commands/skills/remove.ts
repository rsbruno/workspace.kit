import { rm } from "node:fs/promises";

import { askInstalled, planSteps, askAgent } from "../../lib/questions";
import { listInstalled } from "../../lib/installed";
import { forgetInstall } from "../../lib/manifest";
import { defineCommand } from "../../lib/command";
import { summary, info } from "../../ui/summary";
import { installedRows } from "../../ui/rows";

export const remove = defineCommand({
  run: async (names, flags) => {
    planSteps(!flags.agent, !names.length);
    const agent = await askAgent(flags.agent);
    const installed = await listInstalled(agent);
    if (!installed.length) return info(`no skills installed for ${agent}`);

    let chosen = installed;
    if (names.length) {
      const missing = names.filter((n) => !installed.some((i) => i.name === n));
      if (missing.length) throw new Error(`not installed for ${agent}: ${missing.join(", ")}`);
      chosen = installed.filter((i) => names.includes(i.name));
    } else {
      chosen = await askInstalled(installed);
    }

    for (const i of chosen) {
      await rm(i.dir, { recursive: true, force: true });
      await forgetInstall(i.baseDir, i.name);
    }
    summary(`removed ${chosen.length} · ${agent}`, installedRows(chosen));
  },
  description: "remove skills (asks agent)",
  aliases: ["rm"],
  name: "remove"
});
