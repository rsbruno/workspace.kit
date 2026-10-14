import { defineCommand } from "../../lib/command";
import { withRegistry } from "../../lib/session";
import { installHooks } from "./install";

export const add = defineCommand({
  description: "install guard hooks and register them in the agent settings (asks scope + agents)",
  run: (_names, flags) => withRegistry(flags, (reg, src) => installHooks(reg, src, flags)),
  name: "add"
});
