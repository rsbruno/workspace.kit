import { writeFile } from "node:fs/promises";

import { readAgentsSource, agentFileStatus, AGENT_FILES, sha256 } from "../../lib/agents";
import { askAgents, planSteps } from "../../lib/questions";
import { summary, info, warn } from "../../ui/summary";
import { recordInstall } from "../../lib/manifest";
import { defineCommand } from "../../lib/command";
import { withRegistry } from "../../lib/session";
import { task } from "../../ui/task";

export const add = defineCommand({
  run: async (_names, flags) => {
    planSteps(!flags.agent);
    const agents = await askAgents(flags.agent);

    await withRegistry(flags, async (reg, src) => {
      const content = await readAgentsSource(reg);
      if (content === null) return info(`${src.repo} has no agents/AGENTS.md`);

      const written: string[] = [];
      const skipped: string[] = [];
      await task("writing", "written", async () => {
        for (const agent of agents) {
          const status = await agentFileStatus(agent, content);
          if (status.state === "in-sync") continue;
          if (status.current !== null && !flags.force) {
            skipped.push(status.file);
            continue;
          }
          await writeFile(status.path, content);
          await recordInstall(process.cwd(), status.file, {
            installedAt: new Date().toISOString(),
            hash: sha256(content),
            scope: "project",
            repo: src.repo,
            kind: "agents",
            version: null,
            ref: src.ref,
            sha: reg.sha,
            agent
          });
          written.push(status.file);
        }
      });

      if (skipped.length)
        warn(`kept existing ${skipped.join(", ")}; ask the agent to run project-guide to merge, or use --force`);
      if (!written.length) return info("nothing to write");
      summary(
        `written ${written.length} · ${src.ref}`,
        written.map((name) => ({ detail: AGENT_FILES.claude === name ? "claude" : "codex", name }))
      );
    });
  },
  description: "write CLAUDE.md / AGENTS.md from the shared agents file (asks agents)",
  name: "add"
});
