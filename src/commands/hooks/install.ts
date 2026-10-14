import { readFile, copyFile, readdir, mkdir, chmod } from "node:fs/promises";
import { join } from "node:path";

import type { Registry, Source } from "../../lib/registry";

import { writeSettings, type Settings, readSettings, mergeHooks, hooksDir } from "../../lib/hooks";
import { summary, info, warn } from "../../ui/summary";
import { task } from "../../ui/task";
import { pkg } from "../../lib/pkg";

export async function installHooks(reg: Registry, src: Source) {
  const from = join(reg.base, pkg.config.hooksPath);
  const files = (await readdir(from).catch(() => [])).filter((f) => f.endsWith(".sh"));
  if (!files.length) return info(`${src.repo} has no ${pkg.config.hooksPath}`);

  const example = JSON.parse(await readFile(join(from, "settings.example.json"), "utf8")) as Settings;

  await task("installing", "installed", async () => {
    await mkdir(hooksDir(), { recursive: true });
    for (const file of files) {
      const target = join(hooksDir(), file);
      await copyFile(join(from, file), target);
      await chmod(target, 0o755);
    }
    await writeSettings(mergeHooks(await readSettings(), example));
  });

  warn("hooks need `jq` installed");
  summary(
    `installed ${files.length} hooks · project · ${src.ref}`,
    files.map((name) => ({ detail: ".claude/hooks", name }))
  );
}
