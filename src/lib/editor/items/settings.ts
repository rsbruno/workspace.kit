import { isDeepStrictEqual } from "node:util";
import { join } from "node:path";

import type { Item } from "./types";

import { parseJsonc, removePath, writeText, readText, setPath } from "../jsonc";
import { backupFile } from "../backup";

type KeyRestore = { had: boolean; prev: unknown; applied: unknown };
type Restore = { keys: Record<string, KeyRestore> };

export const settings: Item = {
  async apply({ target, src }) {
    const file = join(target, "settings.json");
    const wanted = parseJsonc<Record<string, unknown>>((await readText(join(src, "settings.json")))!, "repo settings.json");
    let text = (await readText(file)) ?? "{}";
    const current = parseJsonc<Record<string, unknown>>(text, file);

    const restore: Restore = { keys: {} };
    for (const [key, value] of Object.entries(wanted)) {
      if (isDeepStrictEqual(current[key], value)) continue;
      restore.keys[key] = { had: key in current, prev: current[key], applied: value };
      text = setPath(text, [key], value);
    }
    if (Object.keys(restore.keys).length) {
      await backupFile(file);
      await writeText(file, text);
    }
    return restore;
  },
  async revert({ target }, data) {
    const file = join(target, "settings.json");
    const text0 = await readText(file);
    if (text0 === null) return [];
    let text = text0;
    const warnings: string[] = [];
    const current = parseJsonc<Record<string, unknown>>(text, file);

    for (const [key, r] of Object.entries((data as Restore).keys)) {
      if (!isDeepStrictEqual(current[key], r.applied)) {
        warnings.push(`settings: "${key}" changed locally, left as is`);
        continue;
      }
      text = r.had ? setPath(text, [key], r.prev) : removePath(text, [key]);
    }
    await writeText(file, text);
    return warnings;
  },
  source: "settings.json",

  label: "settings.json",

  id: "settings"
};
