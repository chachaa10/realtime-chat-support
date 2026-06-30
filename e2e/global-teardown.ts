import { unlinkSync } from 'node:fs';

export default async function () {
  const dbPath = `${process.cwd()}/test-e2e.db`;
  try {
    unlinkSync(dbPath);
  } catch {
    // ignore if already deleted
  }
}
