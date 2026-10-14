import { readAgentsSource, AGENT_FILES_KEYS, agentFileStatus } from "../../lib/agents";
import { defineCommand } from "../../lib/command";
import { withRegistry } from "../../lib/session";
import { summary } from "../../ui/summary";

export const list = defineCommand({
  run: (_names, flags) =>
    withRegistry(flags, async (reg, src) => {
      const latest = await readAgentsSource(reg);
      const statuses = await Promise.all(AGENT_FILES_KEYS.map((agent) => agentFileStatus(agent, latest)));
      summary(
        `agents files · ${src.ref}`,
        statuses.map((s) => ({ detail: s.state, name: s.file }))
      );
    }),
  description: "show CLAUDE.md / AGENTS.md state against the repo",
  aliases: ["ls"],
  name: "list"
});
