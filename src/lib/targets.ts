import { homedir } from "node:os";
import { join } from "node:path";

export const AGENTS = {
  claude: { dir: ".claude/skills" },
  codex: { dir: ".agents/skills" }
} as const;

export const SCOPES = ["project", "global"] as const;

export type Agent = keyof typeof AGENTS;
export type Scope = (typeof SCOPES)[number];

export const AGENT_NAMES = Object.keys(AGENTS) as Agent[];

export function parseAgents(value: string): Agent[] {
  const list = value.split(",").map((s) => s.trim()) as Agent[];
  const bad = list.filter((a) => !AGENT_NAMES.includes(a));
  if (bad.length) throw new Error(`unknown agent: ${bad.join(", ")} (valid: ${AGENT_NAMES.join(", ")})`);
  return list;
}

export function parseScope(value: string): Scope {
  if (!SCOPES.includes(value as Scope)) throw new Error(`unknown scope: ${value} (valid: ${SCOPES.join(", ")})`);
  return value as Scope;
}

export function targetDir(agent: Agent, scope: Scope, cwd = process.cwd()): string {
  return join(scope === "global" ? homedir() : cwd, AGENTS[agent].dir);
}
