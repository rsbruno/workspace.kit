import { planSteps, askAgent } from "../../lib/questions";
import { listInstalled } from "../../lib/installed";
import { formatTokens } from "../../lib/skill-info";
import { defineCommand } from "../../lib/command";
import { summary, info } from "../../ui/summary";
import { installedRows } from "../../ui/rows";

export const list = defineCommand({
  run: async (_names, flags) => {
    planSteps(!flags.agent);
    const agent = await askAgent(flags.agent);
    const installed = await listInstalled(agent);
    if (!installed.length) return info(`no skills installed for ${agent}`);

    const total = installed.reduce((sum, i) => sum + i.tokens, 0);
    summary(`${installed.length} skills · ${formatTokens(total)} · ${agent}`, installedRows(installed));
  },
  description: "list installed skills (asks agent)",
  aliases: ["ls"],
  name: "list"
});
