import type { ManagedEntry } from "../manifest";
import type { Item } from "./items/types";

import { parseEditorScope, type EditorScope, EDITOR_SCOPES, EDITOR_NAMES, parseEditors, type Editor, EDITORS } from "./editors";
import { type Option, selectMany, selectOne } from "../../ui/prompt";
import { shortSha } from "../skill-info";

const editorOptions = (): Option<Editor>[] => EDITOR_NAMES.map((e) => ({ detail: EDITORS[e].label, value: e, name: e }));

export async function askEditor(flag?: string): Promise<Editor> {
  if (flag) {
    const editors = parseEditors(flag);
    if (editors.length !== 1) throw new Error("pass a single --editor");
    return editors[0]!;
  }
  return selectOne("editor", editorOptions());
}

export async function askEditors(flag?: string): Promise<Editor[]> {
  return flag ? parseEditors(flag) : selectMany("editors", editorOptions());
}

export async function askEditorScope(flag?: string): Promise<EditorScope> {
  if (flag) return parseEditorScope(flag);
  const options = EDITOR_SCOPES.map((s) => ({
    detail: s === "user" ? "global, for your user" : "this project (.vscode)",
    value: s,
    name: s
  }));
  return selectOne("scope", options);
}

export async function askItems(items: Item[]): Promise<Item[]> {
  return selectMany(
    "configs",
    items.map((value) => ({ detail: value.label, name: value.id, value }))
  );
}

export const managedRows = (entries: ManagedEntry[]) =>
  entries.map((m) => ({ detail: `${m.entry.scope} · ${shortSha(m.entry.sha)}`, name: m.name }));

export async function askManaged(entries: ManagedEntry[], message: string): Promise<ManagedEntry[]> {
  const rows = managedRows(entries);
  return selectMany(
    message,
    entries.map((value, i) => ({ detail: rows[i]!.detail, name: value.name, value }))
  );
}
