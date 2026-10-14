import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

import type { Registry } from "./registry";

import { readManifest } from "./manifest";
import { pkg } from "./pkg";

export const AGENT_FILES = { claude: "CLAUDE.md", codex: "AGENTS.md" } as const;
export type AgentFile = keyof typeof AGENT_FILES;

export const AGENT_FILES_KEYS = Object.keys(AGENT_FILES) as AgentFile[];

export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

export async function readAgentsSource(reg: Registry): Promise<string | null> {
  return readFile(join(reg.base, pkg.config.agentsPath, "AGENTS.md"), "utf8").catch(() => null);
}

export type AgentFileState = "missing" | "in-sync" | "outdated" | "edited" | "unmanaged";

export type AgentFileStatus = {
  agent: AgentFile;
  file: string;
  path: string;
  state: AgentFileState;
  current: string | null;
  recordedHash?: string;
};

export async function agentFileStatus(agent: AgentFile, latest: string | null, cwd = process.cwd()): Promise<AgentFileStatus> {
  const file = AGENT_FILES[agent];
  const path = join(cwd, file);
  const current = await readFile(path, "utf8").catch(() => null);
  const recordedHash = (await readManifest()).installs[cwd]?.[file]?.hash;
  const base = { recordedHash, current, agent, file, path };
  if (current === null) return { ...base, state: "missing" };
  const hash = sha256(current);
  if (latest !== null && hash === sha256(latest)) return { ...base, state: "in-sync" };
  if (!recordedHash) return { ...base, state: "unmanaged" };
  return { ...base, state: hash === recordedHash ? "outdated" : "edited" };
}
