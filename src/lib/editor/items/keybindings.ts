import { isDeepStrictEqual } from "node:util";
import { join } from "node:path";

import type { Item } from "./types";

import { parseJsonc, removePath, writeText, readText, setPath } from "../jsonc";
import { backupFile } from "../backup";

type Binding = Record<string, unknown>;
type Restore = { added: Binding[] };

export const keybindings: Item = {
  async apply({ target, src }) {
    const file = join(target, "keybindings.json");
    const wanted = parseJsonc<Binding[]>((await readText(join(src, "keybindings.json")))!, "repo keybindings.json");
    let text = (await readText(file)) ?? "[]";
    const current = parseJsonc<Binding[]>(text, file);

    const added: Binding[] = [];
    for (const binding of wanted) {
      if (current.some((c) => isDeepStrictEqual(c, binding))) continue;
      text = setPath(text, [current.length + added.length], binding, true);
      added.push(binding);
    }
    if (added.length) {
      await backupFile(file);
      await writeText(file, text);
    }
    return { added } satisfies Restore;
  },
  async revert({ target }, data) {
    const file = join(target, "keybindings.json");
    let text = await readText(file);
    if (text === null) return [];
    const current = parseJsonc<Binding[]>(text, file);
    const indexes = current
      .map((c, i) => ((data as Restore).added.some((a) => isDeepStrictEqual(a, c)) ? i : -1))
      .filter((i) => i >= 0)
      .reverse();
    for (const i of indexes) text = removePath(text, [i]);
    await writeText(file, text);
    return [];
  },
  source: "keybindings.json",

  label: "keybindings.json",

  id: "keybindings"
};
