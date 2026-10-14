import { writeFile, mkdtemp, readdir, access, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { basename, join } from "node:path";
import { tmpdir } from "node:os";

import { pkg } from "./pkg";

export type Source = { repo: string; ref: string };
export type Registry = { base: string; root: string; sha: string; skills: Map<string, string>; cleanup: () => Promise<void> };

export function resolveSource(flags: { ref?: string }): Source {
  return { ref: flags.ref ?? pkg.config.ref, repo: pkg.config.repo };
}

async function findSkills(dir: string, out = new Map<string, string>()) {
  if (
    await access(join(dir, "SKILL.md")).then(
      () => true,
      () => false
    )
  ) {
    out.set(basename(dir), dir);
    return out;
  }
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory() && !e.name.startsWith(".git")) await findSkills(join(dir, e.name), out);
  }
  return out;
}

function githubHeaders(extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extra };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function resolveSha(src: Source): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${src.repo}/commits/${encodeURIComponent(src.ref)}`, {
    headers: githubHeaders({ Accept: "application/vnd.github.sha" }),
    cache: "no-store"
  }).catch((e: Error) => {
    throw new Error(`cannot reach github.com (${e.message})`);
  });
  if (!res.ok) throw new Error(`cannot resolve ${src.repo}@${src.ref}: ${res.status} ${res.statusText}`);
  return (await res.text()).trim();
}

export async function openRegistry(src: Source): Promise<Registry> {
  const sha = await resolveSha(src);
  const tmp = await mkdtemp(join(tmpdir(), "workspace-"));
  const res = await fetch(`https://codeload.github.com/${src.repo}/tar.gz/${sha}`, {
    headers: githubHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    await rm(tmp, { recursive: true, force: true });
    throw new Error(`fetch ${src.repo}@${src.ref} failed: ${res.status} ${res.statusText}`);
  }
  const tarball = join(tmp, "repo.tgz");
  await writeFile(tarball, Buffer.from(await res.arrayBuffer()));
  const tar = spawnSync("tar", ["-xzf", tarball, "-C", tmp], { encoding: "utf8" });
  if (tar.status !== 0) throw new Error(`tar failed: ${tar.stderr}`);

  const top = (await readdir(tmp, { withFileTypes: true })).find((e) => e.isDirectory())!.name;
  const base = join(tmp, top);
  const root = join(base, pkg.config.skillsPath);
  return {
    cleanup: () => rm(tmp, { recursive: true, force: true }),
    skills: await findSkills(root),
    base,
    root,
    sha
  };
}
