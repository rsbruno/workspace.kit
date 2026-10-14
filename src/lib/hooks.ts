import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

import type { Agent, Scope } from "./targets";

type HookEntry = { type: string; command: string };
type HookGroup = { matcher?: string; hooks: HookEntry[] };
export type Settings = { hooks?: Record<string, HookGroup[]> } & Record<string, unknown>;

const AGENT_HOOKS = {
  codex: { projectVar: '"$(git rev-parse --show-toplevel)"', settings: "hooks.json", root: ".codex" },
  claude: { projectVar: '"$CLAUDE_PROJECT_DIR"', settings: "settings.json", root: ".claude" }
} as const;

export type HookTarget = {
  settingsRel: string;
  settings: string;
  prefix: string;
  dirRel: string;
  dir: string;
};

export function hookTarget(agent: Agent, scope: Scope, cwd = process.cwd()): HookTarget {
  const cfg = AGENT_HOOKS[agent];
  const base = scope === "global" ? homedir() : cwd;
  const dirRel = `${cfg.root}/hooks`;
  return {
    prefix: scope === "global" ? `${homedir()}/${dirRel}` : `${cfg.projectVar}/${dirRel}`,
    settings: join(base, cfg.root, cfg.settings),
    settingsRel: `${cfg.root}/${cfg.settings}`,
    dir: join(base, dirRel),
    dirRel
  };
}

export async function readSettings(target: HookTarget): Promise<Settings> {
  const raw = await readFile(target.settings, "utf8").catch(() => null);
  if (raw === null) return {};
  try {
    return JSON.parse(raw) as Settings;
  } catch {
    throw new Error(`${target.settingsRel} is not valid JSON; fix it before installing hooks`);
  }
}

export async function writeSettings(target: HookTarget, settings: Settings) {
  await mkdir(dirname(target.settings), { recursive: true });
  await writeFile(target.settings, JSON.stringify(settings, null, 2) + "\n");
}

const isManaged = (target: HookTarget) => (entry: HookEntry) => entry.command.includes(`${target.dirRel}/`);

// the example file is written for claude project scope; retarget its commands
const retarget = (target: HookTarget, command: string) =>
  command.replace(/"\$CLAUDE_PROJECT_DIR\/\.claude\/hooks\/([^"]+)"/g, (_m, file: string) => `"${target.prefix}/${file}"`);

export function mergeHooks(target: HookTarget, current: Settings, incoming: Settings): Settings {
  const managed = isManaged(target);
  const next: Settings = { ...current, hooks: { ...current.hooks } };
  for (const [event, groups] of Object.entries(incoming.hooks ?? {})) {
    const kept = (next.hooks![event] ?? [])
      .map((g) => ({ ...g, hooks: g.hooks.filter((h) => !managed(h)) }))
      .filter((g) => g.hooks.length);
    const fresh = groups.map((g) => ({ ...g, hooks: g.hooks.map((h) => ({ ...h, command: retarget(target, h.command) })) }));
    next.hooks![event] = [...kept, ...fresh];
  }
  return next;
}

export function stripHooks(target: HookTarget, current: Settings): Settings {
  const managed = isManaged(target);
  const next: Settings = { ...current, hooks: {} };
  for (const [event, groups] of Object.entries(current.hooks ?? {})) {
    const kept = groups.map((g) => ({ ...g, hooks: g.hooks.filter((h) => !managed(h)) })).filter((g) => g.hooks.length);
    if (kept.length) next.hooks![event] = kept;
  }
  if (!Object.keys(next.hooks!).length) delete next.hooks;
  return next;
}
