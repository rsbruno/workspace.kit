import type { Command } from "../../lib/command";

import { version } from "./version";
import { update } from "./update";

export const kitCommands: Command[] = [update, version];
