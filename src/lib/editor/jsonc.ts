import { type ParseError, type JSONPath, applyEdits, modify, parse } from "jsonc-parser/lib/esm/main.js";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const FORMAT = { formattingOptions: { insertSpaces: true, tabSize: 2 } };

export async function readText(file: string): Promise<string | null> {
  return readFile(file, "utf8").catch(() => null);
}

export async function writeText(file: string, text: string) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text);
}

export function parseJsonc<T>(text: string, label: string): T {
  const errors: ParseError[] = [];
  const value = parse(text, errors, { allowTrailingComma: true });
  if (errors.length) throw new Error(`invalid JSON in ${label}`);
  return value as T;
}

export function setPath(text: string, path: JSONPath, value: unknown, insertInArray = false): string {
  return applyEdits(text, modify(text, path, value, { ...FORMAT, isArrayInsertion: insertInArray }));
}

export const removePath = (text: string, path: JSONPath) => setPath(text, path, undefined);
