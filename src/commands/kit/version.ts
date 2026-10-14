import { defineCommand } from "../../lib/command";
import { info } from "../../ui/summary";
import { pkg } from "../../lib/pkg";

export const version = defineCommand({
  run: async () => info(`${pkg.displayName ?? pkg.name} v${pkg.version}`),
  description: "show the installed CLI version",
  name: "version"
});
