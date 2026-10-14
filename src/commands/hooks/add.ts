import { defineCommand } from "../../lib/command";
import { withRegistry } from "../../lib/session";
import { installHooks } from "./install";

export const add = defineCommand({
  description: "install guard hooks into .claude/hooks and register them in .claude/settings.json",
  run: (_names, flags) => withRegistry(flags, installHooks),
  name: "add"
});
