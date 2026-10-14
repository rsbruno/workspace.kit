import { writeFile } from "node:fs/promises";

import { readAgentsSource, agentFileStatus, sha256 } from "../../lib/agents";
import { askAgents, planSteps } from "../../lib/questions";
import { summary, info, warn } from "../../ui/summary";
import { recordInstall } from "../../lib/manifest";
import { defineCommand } from "../../lib/command";
import { withRegistry } from "../../lib/session";

export const update = defineCommand({
  run: async (_names, flags) => {
    planSteps(!flags.agent);
    const agents = await askAgents(flags.agent);

    await withRegistry(flags, async (reg, src) => {
      const latest = await readAgentsSource(reg);
      if (latest === null) return info(`${src.repo} has no agents/AGENTS.md`);

      const updated: string[] = [];
      const edited: string[] = [];
      const unmanaged: string[] = [];
      for (const agent of agents) {
        const s = await agentFileStatus(agent, latest);
        if (s.state === "missing" || s.state === "in-sync") continue;
        if (s.state === "edited" && !flags.force) edited.push(s.file);
        else if (s.state === "unmanaged" && !flags.force) unmanaged.push(s.file);
        else {
          await writeFile(s.path, latest);
          await recordInstall(process.cwd(), s.file, {
            installedAt: new Date().toISOString(),
            hash: sha256(latest),
            scope: "project",
            repo: src.repo,
            kind: "agents",
            version: null,
            ref: src.ref,
            sha: reg.sha,
            agent
          });
          updated.push(s.file);
        }
      }

      if (edited.length) warn(`skipped, edited locally (use --force or project-guide to merge): ${edited.join(", ")}`);
      if (unmanaged.length)
        warn(`skipped, not installed by workspace (use --force or project-guide to merge): ${unmanaged.join(", ")}`);
      if (!updated.length) return info("everything up to date");
      summary(
        `updated ${updated.length} · ${src.ref}`,
        updated.map((name) => ({ detail: "from agents/AGENTS.md", name }))
      );
    });
  },
  description: "update CLAUDE.md / AGENTS.md that differ from the repo and were not edited (asks agents)",
  name: "update"
});
