import type { Flags } from "./command";

import { resolveSource, type Registry, openRegistry, type Source } from "./registry";
import { task } from "../ui/task";

export async function withRegistry<T>(flags: Flags, fn: (reg: Registry, src: Source) => Promise<T>): Promise<T> {
  const src = resolveSource(flags);
  const reg = await task(`fetching ${src.repo}`, `fetched ${src.repo}`, () => openRegistry(src));
  try {
    return await fn(reg, src);
  } finally {
    await reg.cleanup();
  }
}
