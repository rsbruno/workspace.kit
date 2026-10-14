import { rm } from "node:fs/promises";

import { askAgents, planSteps } from "../../lib/questions";
import { summary, info, warn } from "../../ui/summary";
import { agentFileStatus } from "../../lib/agents";
import { forgetInstall } from "../../lib/manifest";
import { defineCommand } from "../../lib/command";

export const remove = defineCommand({
  run: async (_names, flags) => {
    planSteps(!flags.agent);
    const agents = await askAgents(flags.agent);

    const removed: string[] = [];
    const kept: string[] = [];
    for (const agent of agents) {
      const s = await agentFileStatus(agent, null);
      if (s.state === "missing") continue;
      if (s.state !== "outdated" && !flags.force) {
        kept.push(s.file);
        continue;
      }
      await rm(s.path, { force: true });
      await forgetInstall(process.cwd(), s.file);
      removed.push(s.file);
    }
    if (kept.length) warn(`kept, edited or not installed by workspace (use --force): ${kept.join(", ")}`);
    if (!removed.length) return info("nothing removed");
    summary(
      `removed ${removed.length}`,
      removed.map((name) => ({ detail: "agents", name }))
    );
  },
  description: "remove CLAUDE.md / AGENTS.md installed by workspace and not edited (asks agents)",
  aliases: ["rm"],
  name: "remove"
});
