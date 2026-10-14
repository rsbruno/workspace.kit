import { writeFile, readFile, rename, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { manifestPath } from "./paths";
export type Kind = "skill" | "editor" | "agents";

export type ManifestEntry = {
  kind: Kind;
  version: string | null;
  repo: string;
  ref: string;
  sha: string;
  hash: string;
  agent: string;
  scope: string;
  installedAt: string;
  data?: unknown;
};

type Installs = Record<string, Record<string, ManifestEntry>>;
type Manifest = { schemaVersion: 1; note: string; installs: Installs };

const NOTE =
  "Managed by the workspace CLI. Local record of what was installed from the git repo, which is the source of truth. Do not edit by hand.";

export async function readManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await readFile(manifestPath(), "utf8"));
  } catch {
    return { schemaVersion: 1, installs: {}, note: NOTE };
  }
}

async function writeManifest(manifest: Manifest) {
  const file = manifestPath();
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify({ ...manifest, note: NOTE }, null, 2) + "\n");
  await rename(tmp, file);
}

export async function recordInstall(installDir: string, name: string, entry: ManifestEntry) {
  const manifest = await readManifest();
  (manifest.installs[installDir] ??= {})[name] = entry;
  await writeManifest(manifest);
}

export async function forgetInstall(installDir: string, name: string) {
  const manifest = await readManifest();
  const dir = manifest.installs[installDir];
  if (!dir?.[name]) return;
  delete dir[name];
  if (!Object.keys(dir).length) delete manifest.installs[installDir];
  await writeManifest(manifest);
}

export type ManagedEntry = { dir: string; name: string; entry: ManifestEntry };

export async function entriesIn(dirs: string[], kind: Kind): Promise<ManagedEntry[]> {
  const manifest = await readManifest();
  return dirs.flatMap((dir) =>
    Object.entries(manifest.installs[dir] ?? {})
      .filter(([, entry]) => entry.kind === kind)
      .map(([name, entry]) => ({ entry, name, dir }))
  );
}
