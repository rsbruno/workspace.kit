import { homedir } from "node:os";
import { join } from "node:path";

export function stateDir(): string {
  if (process.env.WORKSPACE_HOME) return process.env.WORKSPACE_HOME;
  const home = homedir();
  const base =
    process.platform === "win32"
      ? (process.env.LOCALAPPDATA ?? join(home, "AppData", "Local"))
      : process.platform === "darwin"
        ? join(home, "Library", "Application Support")
        : (process.env.XDG_STATE_HOME ?? join(home, ".local", "state"));
  return join(base, "workspace");
}

export const manifestPath = () => join(stateDir(), "manifest.json");
