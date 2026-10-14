import type { EditorScope, Editor } from "../editors";

export type Ctx = { src: string; target: string; editor: Editor | null; scope: EditorScope };

export type Item = {
  id: string;
  label: string;
  source: string;
  apply: (ctx: Ctx) => Promise<unknown>;
  revert: (ctx: Ctx, restore: unknown) => Promise<string[]>;
};
