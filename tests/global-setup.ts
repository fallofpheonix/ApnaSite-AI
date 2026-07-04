import { execSync } from "node:child_process";
import { rmSync, mkdirSync } from "node:fs";
import path from "node:path";

// Fresh schema in a dedicated SQLite file before every test run. The
// DATABASE_URL in prisma is resolved relative to prisma/, so file:./test.db
// lands at prisma/test.db.
export default function setup() {
  const dbFile = path.join(process.cwd(), "prisma", "test.db");
  rmSync(dbFile, { force: true });
  rmSync(path.join(process.cwd(), "tests", ".uploads"), { recursive: true, force: true });
  mkdirSync(path.join(process.cwd(), "tests", ".uploads"), { recursive: true });
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "pipe",
  });
}
