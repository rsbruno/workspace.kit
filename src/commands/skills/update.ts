import { type Installed, listInstalled } from "../../lib/installed";
import { planSteps, askScope, askAgent } from "../../lib/questions";
import { formatVersion, readVersion } from "../../lib/skill-info";
import { summary, info, warn } from "../../ui/summary";
import { recordInstall } from "../../lib/manifest";
import { defineCommand } from "../../lib/command";
import { copyDir, hashDir } from "../../utils/fs";
import { withRegistry } from "../../lib/session";

export const update = defineCommand({
  run: async (_names, flags) => {
    planSteps(!flags.scope, !flags.agent);
    const scope = await askScope(flags.scope);
    const agent = await askAgent(flags.agent);
    const installed = await listInstalled(agent, [scope]);
    if (!installed.length) return info(`no skills installed for ${agent} · ${scope}`);

    await withRegistry(flags, async (reg, src) => {
      const updated: { item: Installed; detail: string }[] = [];
      const unmanaged: string[] = [];
      const modified: string[] = [];

      for (const i of installed) {
        const from = reg.skills.get(i.name);
        if (!from) continue;
        if (!i.entry) {
          unmanaged.push(i.name);
          continue;
        }
        const latestHash = await hashDir(from);
        if (latestHash === i.entry.hash) continue;
        if (i.modified && !flags.force) {
          modified.push(`${i.name} (${i.scope})`);
          continue;
        }

        const version = await readVersion(from);
        await copyDir(from, i.dir);
        await recordInstall(i.baseDir, i.name, {
          ...i.entry,
          installedAt: new Date().toISOString(),
          hash: latestHash,
          repo: src.repo,
          ref: src.ref,
          sha: reg.sha,
          version
        });
        updated.push({
          detail: `${formatVersion(i.entry.version)} → ${formatVersion(version)}`,
          item: i
        });
      }

      if (unmanaged.length) warn(`skipped, not installed by workspace: ${unmanaged.join(", ")}`);
      if (modified.length) warn(`skipped, edited locally (use --force): ${modified.join(", ")}`);
      if (!updated.length) return info(`everything up to date · ${agent} · ${scope}`);
      summary(
        `updated ${updated.length} · ${agent} · ${scope}`,
        updated.map((u) => ({ name: u.item.name, detail: u.detail }))
      );
    });
  },
  description: "reinstall skills that differ from the repo (asks scope + agent)",
  name: "update"
});
