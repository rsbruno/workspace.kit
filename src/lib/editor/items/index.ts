import { access } from "node:fs/promises";
import { join } from "node:path";

import type { Item } from "./types";

import { keybindings } from "./keybindings";
import { extensions } from "./extensions";
import { settings } from "./settings";
import { snippets } from "./snippets";

export const ITEMS: Item[] = [settings, extensions, keybindings, snippets];

export const findItem = (id: string) => ITEMS.find((i) => i.id === id);

export async function availableItems(src: string): Promise<Item[]> {
  const found: Item[] = [];
  for (const item of ITEMS) {
    if (
      await access(join(src, item.source)).then(
        () => true,
        () => false
      )
    )
      found.push(item);
  }
  return found;
}
