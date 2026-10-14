import type { Installed } from "./installed";
import type { Registry } from "./registry";

import { AGENT_NAMES, parseAgents, parseScope, type Agent, type Scope, SCOPES } from "./targets";
import { type Option, selectMany, planSteps, selectOne } from "../ui/prompt";
import { type RegistryInfo, installedRows, skillRows } from "../ui/rows";
import { estimateTokens, readVersion } from "./skill-info";

const plain = <T extends string>(values: readonly T[]): Option<T>[] => values.map((v) => ({ value: v, name: v }));

export { planSteps };

export async function askAgent(flag?: string): Promise<Agent> {
  if (flag) {
    const agents = parseAgents(flag);
    if (agents.length !== 1) throw new Error("pass a single --agent");
    return agents[0]!;
  }
  return selectOne("agent", plain(AGENT_NAMES));
}

export async function askAgents(flag?: string): Promise<Agent[]> {
  return flag ? parseAgents(flag) : selectMany("agents", plain(AGENT_NAMES));
}

export async function askScope(flag?: string): Promise<Scope> {
  return flag ? parseScope(flag) : selectOne("scope", plain(SCOPES));
}

export async function registryInfo(reg: Registry): Promise<RegistryInfo> {
  const info: RegistryInfo = new Map();
  for (const [name, dir] of reg.skills) {
    info.set(name, { tokens: await estimateTokens(dir), version: await readVersion(dir), sha: reg.sha });
  }
  return info;
}

export function filterByCategory(reg: Registry, flag?: string): string[] {
  const names = [...reg.skills.keys()].sort();
  if (!flag) return names;
  const wanted = flag.split(",").map((s) => s.trim());
  const known = new Set(reg.categories.values());
  const bad = wanted.filter((c) => !known.has(c));
  if (bad.length) throw new Error(`unknown category: ${bad.join(", ")} (valid: ${[...known].sort().join(", ")})`);
  return names.filter((n) => wanted.includes(reg.categories.get(n) ?? ""));
}

export async function askSkills(reg: Registry, info: RegistryInfo, names: string[]): Promise<string[]> {
  const rows = skillRows(names, info);
  return selectMany(
    "skills",
    names.map((value, i) => ({ detail: rows[i]!.detail, name: value, value }))
  );
}

export async function askInstalled(installed: Installed[]): Promise<Installed[]> {
  const rows = installedRows(installed);
  return selectMany(
    "remove",
    installed.map((value, i) => ({ detail: rows[i]!.detail, name: value.name, value }))
  );
}
