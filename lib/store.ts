// Tiny JSON file store for local state (data/state/, gitignored). Writes are atomic (temp file + rename).
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "data", "state");

export function read<T>(name: string, fallback: T): T {
  const file = path.join(DIR, `${name}.json`);
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function write<T>(name: string, value: T): void {
  mkdirSync(DIR, { recursive: true });
  const file = path.join(DIR, `${name}.json`);
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2));
  renameSync(tmp, file);
}

export function remove(name: string): void {
  const file = path.join(DIR, `${name}.json`);
  if (existsSync(file)) rmSync(file);
}
