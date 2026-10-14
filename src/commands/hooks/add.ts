import { askAgents, planSteps, askScope } from "../../lib/questions";
import { defineCommand } from "../../lib/command";
import { withRegistry } from "../../lib/session";
import { installHooks } from "./install";

export const add = defineCommand({
  run: async (_names, flags) => {
    planSteps(!flags.scope, !flags.agent);
    const scope = await askScope(flags.scope);
    const agents = await askAgents(flags.agent);
    await withRegistry(flags, (reg, src) => installHooks(reg, src, scope, agents));
  },
  description: "install guard hooks and register them in the agent settings (asks scope + agents)",
  name: "add"
});
