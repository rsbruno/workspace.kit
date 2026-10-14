import { copyFile, readdir, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

import type { Item, Ctx } from "./types";

import { hashPath } from "../../../utils/fs";
import { backupFile } from "../backup";

type FileRestore = { name: string; hash: string; backup: string | null };
type Restore = { files: FileRestore[] };

const snippetsDir = (ctx: Ctx) => (ctx.scope === "user" ? join(ctx.target, "snippets") : ctx.target);

export const snippets: Item = {
  async revert(ctx, data) {
    const dest = snippetsDir(ctx);
    const warnings: string[] = [];
    for (const f of (data as Restore).files) {
      const file = join(dest, f.name);
      const hash = await hashPath(file).catch(() => null);
      if (hash === null) continue;
      if (hash !== f.hash) {
        warnings.push(`snippets: ${f.name} changed locally, left as is`);
        continue;
      }
      if (f.backup) await copyFile(f.backup, file);
      else await rm(file, { force: true });
    }
    return warnings;
  },
  async apply(ctx) {
    const dest = snippetsDir(ctx);
    await mkdir(dest, { recursive: true });
    const files: FileRestore[] = [];
    for (const name of await readdir(join(ctx.src, "snippets"))) {
      const from = join(ctx.src, "snippets", name);
      const to = join(dest, name);
      const backup = await backupFile(to);
      await copyFile(from, to);
      files.push({ hash: await hashPath(to), backup, name });
    }
    return { files } satisfies Restore;
  },
  source: "snippets",

  label: "snippets",

  id: "snippets"
};
