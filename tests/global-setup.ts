import { execSync } from "node:child_process";
import { rmSync, mkdirSync } from "node:fs";
import path from "node:path";

// Fresh schema in a dedicated SQLite file before every test run. The
// Use an absolute SQLite URL. Prisma 6's schema engine can fail without a
// diagnostic on some macOS/Node combinations when asked to create a database
// through a relative file URL.
export default function setup() {
  const dbFile = path.join(process.cwd(), "tests", "test.db");
  rmSync(dbFile, { force: true });
  rmSync(path.join(process.cwd(), "tests", ".uploads"), { recursive: true, force: true });
  mkdirSync(path.join(process.cwd(), "tests", ".uploads"), { recursive: true });
  execSync("npx prisma db push --skip-generate", {
    // Prisma 6.19's macOS schema engine intermittently exits without a
    // diagnostic when logging is entirely disabled under Node 26.
    env: { ...process.env, DATABASE_URL: `file:${dbFile}`, RUST_LOG: "info" },
    stdio: "pipe",
  });
}
