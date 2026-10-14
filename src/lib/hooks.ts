import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export const HOOKS_DIR = ".claude/hooks";
export const SETTINGS_FILE = ".claude/settings.json";

type HookEntry = { type: string; command: string };
type HookGroup = { matcher?: string; hooks: HookEntry[] };
export type Settings = { hooks?: Record<string, HookGroup[]> } & Record<string, unknown>;

export const settingsPath = (cwd = process.cwd()) => join(cwd, SETTINGS_FILE);
export const hooksDir = (cwd = process.cwd()) => join(cwd, HOOKS_DIR);

export async function readSettings(cwd = process.cwd()): Promise<Settings> {
  const raw = await readFile(settingsPath(cwd), "utf8").catch(() => null);
  if (raw === null) return {};
  try {
    return JSON.parse(raw) as Settings;
  } catch {
    throw new Error(`${SETTINGS_FILE} is not valid JSON; fix it before installing hooks`);
  }
}

export async function writeSettings(settings: Settings, cwd = process.cwd()) {
  await mkdir(join(cwd, ".claude"), { recursive: true });
  await writeFile(settingsPath(cwd), JSON.stringify(settings, null, 2) + "\n");
}

const isManaged = (entry: HookEntry) => entry.command.includes(`${HOOKS_DIR}/`);

export function mergeHooks(current: Settings, incoming: Settings): Settings {
  const next: Settings = { ...current, hooks: { ...current.hooks } };
  for (const [event, groups] of Object.entries(incoming.hooks ?? {})) {
    const kept = (next.hooks![event] ?? [])
      .map((g) => ({ ...g, hooks: g.hooks.filter((h) => !isManaged(h)) }))
      .filter((g) => g.hooks.length);
    next.hooks![event] = [...kept, ...groups];
  }
  return next;
}

export function stripHooks(current: Settings): Settings {
  const next: Settings = { ...current, hooks: {} };
  for (const [event, groups] of Object.entries(current.hooks ?? {})) {
    const kept = groups.map((g) => ({ ...g, hooks: g.hooks.filter((h) => !isManaged(h)) })).filter((g) => g.hooks.length);
    if (kept.length) next.hooks![event] = kept;
  }
  if (!Object.keys(next.hooks!).length) delete next.hooks;
  return next;
}
