import { readFile } from "node:fs/promises";
import { join } from "node:path";

const CHARS_PER_TOKEN = 4;

async function frontmatter(skillDir: string): Promise<string> {
  const text = await readFile(join(skillDir, "SKILL.md"), "utf8").catch(() => "");
  return /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
}

export async function estimateTokens(skillDir: string): Promise<number> {
  return Math.ceil((await frontmatter(skillDir)).length / CHARS_PER_TOKEN);
}

export async function readVersion(skillDir: string): Promise<string | null> {
  const match = /^version:\s*["']?([^"'\r\n]+?)["']?\s*$/m.exec(await frontmatter(skillDir));
  return match?.[1] ?? null;
}

export const formatTokens = (n: number) => `~${n} tok`;

export const shortSha = (sha: string) => (/^[0-9a-f]{40}$/.test(sha) ? sha.slice(0, 7) : sha);

export const DEFAULT_VERSION = "1.0.0";

export const formatVersion = (version: string | null) => `v${version ?? DEFAULT_VERSION}`;
