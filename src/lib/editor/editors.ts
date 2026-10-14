import { homedir } from "node:os";
import { join } from "node:path";

export const EDITORS = {
  cursor: { appDir: "Cursor", label: "Cursor", cli: "cursor" },
  vscode: { label: "VS Code", appDir: "Code", cli: "code" }
} as const;

export const EDITOR_SCOPES = ["user", "project"] as const;

export type Editor = keyof typeof EDITORS;
export type EditorScope = (typeof EDITOR_SCOPES)[number];

export const EDITOR_NAMES = Object.keys(EDITORS) as Editor[];

export function parseEditors(value: string): Editor[] {
  const list = value.split(",").map((s) => s.trim()) as Editor[];
  const bad = list.filter((e) => !EDITOR_NAMES.includes(e));
  if (bad.length) throw new Error(`unknown editor: ${bad.join(", ")} (valid: ${EDITOR_NAMES.join(", ")})`);
  return list;
}

export function parseEditorScope(value: string): EditorScope {
  if (!EDITOR_SCOPES.includes(value as EditorScope)) {
    throw new Error(`unknown scope: ${value} (valid: ${EDITOR_SCOPES.join(", ")})`);
  }
  return value as EditorScope;
}

export function userDir(editor: Editor): string {
  const { appDir } = EDITORS[editor];
  const home = homedir();
  const base =
    process.platform === "win32"
      ? (process.env.APPDATA ?? join(home, "AppData", "Roaming"))
      : process.platform === "darwin"
        ? join(home, "Library", "Application Support")
        : (process.env.XDG_CONFIG_HOME ?? join(home, ".config"));
  return join(base, appDir, "User");
}

export const projectDir = (cwd = process.cwd()) => join(cwd, ".vscode");

export const targetFor = (scope: EditorScope, editor: Editor) => (scope === "user" ? userDir(editor) : projectDir());
