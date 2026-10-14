import type { Installed } from "../lib/installed";
import type { Row } from "./format";

import { formatVersion, formatTokens } from "../lib/skill-info";

export type RegistryInfo = Map<string, { tokens: number; version: string | null; sha: string }>;

export const skillRows = (names: string[], info: RegistryInfo): Row[] =>
  names.map((name) => {
    const i = info.get(name)!;
    return { detail: `${formatVersion(i.version)} · ${formatTokens(i.tokens)}`, name };
  });

export const installedRows = (items: Installed[]): Row[] =>
  items.map((i) => ({
    detail: `${formatVersion(i.entry ? i.entry.version : i.version)} · ${formatTokens(i.tokens)}`,
    name: i.name
  }));
