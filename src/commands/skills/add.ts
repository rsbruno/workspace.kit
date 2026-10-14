import { join } from "node:path";

import { filterByCategory, registryInfo, askAgents, askSkills, planSteps, askScope } from "../../lib/questions";
import { recordInstall } from "../../lib/manifest";
import { defineCommand } from "../../lib/command";
import { copyDir, hashDir } from "../../utils/fs";
import { withRegistry } from "../../lib/session";
import { targetDir } from "../../lib/targets";
import { summary } from "../../ui/summary";
import { skillRows } from "../../ui/rows";
import { task } from "../../ui/task";

export const add = defineCommand({
  run: (names, flags) =>
    withRegistry(flags, async (reg, src) => {
      planSteps(!names.length, !flags.scope, !flags.agent);
      const info = await registryInfo(reg);

      if (!names.length) names = await askSkills(reg, info, filterByCategory(reg, flags.category));
      const missing = names.filter((n) => !reg.skills.has(n));
      if (missing.length) throw new Error(`not found in ${src.repo}: ${missing.join(", ")}`);

      const scope = await askScope(flags.scope);
      const agents = await askAgents(flags.agent);

      await task("installing", "installed", async () => {
        for (const name of names) {
          const from = reg.skills.get(name)!;
          const hash = await hashDir(from);
          for (const agent of agents) {
            const baseDir = targetDir(agent, scope);
            await copyDir(from, join(baseDir, name));
            await recordInstall(baseDir, name, {
              installedAt: new Date().toISOString(),
              version: info.get(name)!.version,
              repo: src.repo,
              kind: "skill",
              ref: src.ref,
              sha: reg.sha,
              agent,
              scope,
              hash
            });
          }
        }
      });
      summary(`installed ${names.length} · ${agents.join(", ")} · ${scope}`, skillRows(names, info));
    }),
  description: "install skills (asks scope + agents)",
  name: "add"
});
