import { join } from "node:path";

import type { Registry, Source } from "../registry";
import type { Item, Ctx } from "./items/types";

import { type EditorScope, type Editor, projectDir, targetFor, userDir } from "./editors";
import { type ManagedEntry, forgetInstall, recordInstall, entriesIn } from "../manifest";
import { hashPath } from "../../utils/fs";
import { findItem } from "./items";
import { pkg } from "../pkg";

export const sourceDir = (reg: Registry) => join(reg.base, pkg.config.vscodePath);

export const itemHash = (src: string, item: Item) => hashPath(join(src, item.source));

export async function installItem(item: Item, scope: EditorScope, editor: Editor | null, reg: Registry, src: Source) {
  const dir = sourceDir(reg);
  const target = targetFor(scope, editor ?? "vscode");
  const restore = await item.apply({ src: dir, target, editor, scope });
  await recordInstall(target, item.id, {
    installedAt: new Date().toISOString(),
    hash: await itemHash(dir, item),
    agent: editor ?? "project",
    kind: "editor",
    repo: src.repo,
    version: null,
    data: restore,
    ref: src.ref,
    sha: reg.sha,
    scope
  });
}

export const managedFor = (editor: Editor) => entriesIn([userDir(editor), projectDir()], "editor");

const ctxOf = (m: ManagedEntry, src: string): Ctx => ({
  editor: m.entry.scope === "user" ? (m.entry.agent as Editor) : null,
  scope: m.entry.scope as EditorScope,
  target: m.dir,
  src
});

export async function revertEntry(m: ManagedEntry, src = ""): Promise<string[]> {
  const item = findItem(m.name);
  if (!item) return [];
  const warnings = await item.revert(ctxOf(m, src), m.entry.data);
  await forgetInstall(m.dir, m.name);
  return warnings;
}
