import { spawnSync } from "node:child_process";
import { join } from "node:path";

import type { Item, Ctx } from "./types";

import { parseJsonc, removePath, writeText, readText, setPath } from "../jsonc";
import { backupFile } from "../backup";
import { EDITORS } from "../editors";

type Restore = { added: string[] };

const idsFrom = (text: string, label: string) => parseJsonc<{ recommendations?: string[] }>(text, label).recommendations ?? [];

function cli(ctx: Ctx, args: string[]) {
  const bin = EDITORS[ctx.editor!].cli;
  const result = spawnSync(bin, args, { encoding: "utf8" });
  if (result.error) throw new Error(`"${bin}" not found in PATH (needed to manage user extensions)`);
  return result;
}

export const extensions: Item = {
  async apply(ctx) {
    const wanted = idsFrom((await readText(join(ctx.src, "extensions.json")))!, "repo extensions.json");

    if (ctx.scope === "user") {
      const installed = cli(ctx, ["--list-extensions"]).stdout.toLowerCase().split(/\s+/);
      const added: string[] = [];
      for (const id of wanted) {
        if (installed.includes(id.toLowerCase())) continue;
        const r = cli(ctx, ["--install-extension", id]);
        if (r.status === 0) added.push(id);
      }
      return { added } satisfies Restore;
    }

    const file = join(ctx.target, "extensions.json");
    let text = (await readText(file)) ?? '{\n  "recommendations": []\n}\n';
    const current = idsFrom(text, file);
    const added = wanted.filter((id) => !current.includes(id));
    if (added.length) {
      await backupFile(file);
      added.forEach((id, n) => (text = setPath(text, ["recommendations", current.length + n], id, true)));
      await writeText(file, text);
    }
    return { added } satisfies Restore;
  },
  async revert(ctx, data) {
    const { added } = data as Restore;
    if (ctx.scope === "user") {
      for (const id of added) cli(ctx, ["--uninstall-extension", id]);
      return [];
    }
    const file = join(ctx.target, "extensions.json");
    let text = await readText(file);
    if (text === null) return [];
    for (const id of added) {
      const current = idsFrom(text, file);
      const index = current.indexOf(id);
      if (index >= 0) text = removePath(text, ["recommendations", index]);
    }
    await writeText(file, text);
    return [];
  },
  source: "extensions.json",

  label: "extensions",

  id: "extensions"
};
