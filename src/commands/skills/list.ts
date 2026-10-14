import { AGENT_NAMES, parseAgents, parseScope, SCOPES } from "../../lib/targets";
import { listInstalled } from "../../lib/installed";
import { formatTokens } from "../../lib/skill-info";
import { defineCommand } from "../../lib/command";
import { summary, info } from "../../ui/summary";
import { installedRows } from "../../ui/rows";

export const list = defineCommand({
  run: async (_names, flags) => {
    const agents = flags.agent ? parseAgents(flags.agent) : AGENT_NAMES;
    const scopes = flags.scope ? [parseScope(flags.scope)] : SCOPES;

    let shown = 0;
    for (const agent of agents) {
      const installed = await listInstalled(agent, scopes);
      if (!installed.length) continue;
      shown++;
      const total = installed.reduce((sum, i) => sum + i.tokens, 0);
      summary(
        `${installed.length} skills · ${formatTokens(total)} · ${agent}`,
        installedRows(installed).map((row, i) => ({ ...row, name: `${row.name} (${installed[i]!.scope})` }))
      );
    }
    if (!shown) info("no skills installed");
  },
  description: "list installed skills for every agent and scope (filter with --agent / --scope)",
  aliases: ["ls"],
  name: "list"
});
