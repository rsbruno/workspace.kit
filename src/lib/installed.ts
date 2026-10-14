import { readdir } from "node:fs/promises";
import { join } from "node:path";

import { type Agent, type Scope, targetDir, SCOPES } from "./targets";
import { type ManifestEntry, readManifest } from "./manifest";
import { estimateTokens, readVersion } from "./skill-info";
import { hashDir, exists } from "../utils/fs";

export type Installed = {
  name: string;
  scope: Scope;
  dir: string;
  baseDir: string;
  tokens: number;
  version: string | null;
  entry?: ManifestEntry;
  modified: boolean;
};

export async function listInstalled(agent: Agent, scopes: readonly Scope[] = SCOPES): Promise<Installed[]> {
  const manifest = await readManifest();
  const out: Installed[] = [];
  for (const scope of scopes) {
    const baseDir = targetDir(agent, scope);
    const entries = await readdir(baseDir, { withFileTypes: true }).catch(() => []);
    for (const e of entries) {
      const dir = join(baseDir, e.name);
      if (!e.isDirectory() || !(await exists(dir))) continue;
      const entry = manifest.installs[baseDir]?.[e.name];
      out.push({
        modified: entry ? (await hashDir(dir)) !== entry.hash : false,
        tokens: await estimateTokens(dir),
        version: await readVersion(dir),
        name: e.name,
        baseDir,
        scope,
        entry,
        dir
      });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name) || a.scope.localeCompare(b.scope));
}
