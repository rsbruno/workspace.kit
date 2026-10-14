import { readFile, readdir, access, mkdir, stat, cp, rm } from "node:fs/promises";
import { relative, join } from "node:path";
import { createHash } from "node:crypto";

export async function copyDir(from: string, to: string) {
  await rm(to, { recursive: true, force: true });
  await mkdir(to, { recursive: true });
  await cp(from, to, { recursive: true });
}

export async function hashDir(dir: string): Promise<string> {
  const h = createHash("sha256");
  const walk = async (d: string) => {
    const entries = (await readdir(d, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else {
        h.update(relative(dir, p));
        h.update(await readFile(p));
      }
    }
  };
  await walk(dir);
  return h.digest("hex");
}

export async function exists(p: string) {
  return access(join(p, "SKILL.md")).then(
    () => true,
    () => false
  );
}

export async function hashPath(p: string): Promise<string> {
  const info = await stat(p);
  return info.isDirectory()
    ? hashDir(p)
    : createHash("sha256")
        .update(await readFile(p))
        .digest("hex");
}
