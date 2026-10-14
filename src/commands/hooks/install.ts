import { readFile, copyFile, readdir, mkdir, chmod } from "node:fs/promises";
import { join } from "node:path";

import type { Registry, Source } from "../../lib/registry";

import { writeSettings, type Settings, readSettings, mergeHooks, hookTarget } from "../../lib/hooks";
import { askAgents, planSteps, askScope } from "../../lib/questions";
import { summary, info, warn } from "../../ui/summary";
import { task } from "../../ui/task";
import { pkg } from "../../lib/pkg";

export async function installHooks(reg: Registry, src: Source, flags: { agent?: string; scope?: string } = {}) {
  const from = join(reg.base, pkg.config.hooksPath);
  const files = (await readdir(from).catch(() => [])).filter((f) => f.endsWith(".sh"));
  if (!files.length) return info(`${src.repo} has no ${pkg.config.hooksPath}`);

  const example = JSON.parse(await readFile(join(from, "settings.example.json"), "utf8")) as Settings;

  planSteps(!flags.scope, !flags.agent);
  const scope = await askScope(flags.scope);
  const agents = await askAgents(flags.agent);

  await task("installing", "installed", async () => {
    for (const agent of agents) {
      const target = hookTarget(agent, scope);
      await mkdir(target.dir, { recursive: true });
      for (const file of files) {
        const dest = join(target.dir, file);
        await copyFile(join(from, file), dest);
        await chmod(dest, 0o755);
      }
      await writeSettings(target, mergeHooks(target, await readSettings(target), example));
    }
  });

  warn("hooks need `jq` installed");
  summary(
    `installed ${files.length} hooks · ${agents.join(", ")} · ${scope} · ${src.ref}`,
    agents.flatMap((agent) => files.map((name) => ({ detail: `${agent} ${hookTarget(agent, scope).dirRel}`, name })))
  );
}
