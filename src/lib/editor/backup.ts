import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import { stateDir } from "../paths";

export async function backupFile(file: string): Promise<string | null> {
  const dir = join(stateDir(), "backups");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = join(dir, `${stamp}-${file.replace(/[\\/:]/g, "_")}`);
  return copyFile(file, dest).then(
    () => dest,
    () => null
  );
}
