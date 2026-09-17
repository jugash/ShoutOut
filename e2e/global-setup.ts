import { execFileSync } from "node:child_process";

/**
 * Removes shoutouts left behind by earlier E2E runs (messages tagged [e2e]) so
 * demo users' quarterly budgets don't drain. Only runs against the local k3d
 * deployment; set E2E_SKIP_DB_CLEANUP=1 to skip.
 */
export default function globalSetup() {
  if (process.env.E2E_SKIP_DB_CLEANUP) return;
  const namespace = process.env.E2E_NAMESPACE ?? "shoutout";
  try {
    execFileSync(
      "kubectl",
      [
        "-n",
        namespace,
        "exec",
        "shoutout-postgres-0",
        "--",
        "psql",
        "-U",
        "shoutout",
        "-d",
        "shoutout",
        "-c",
        "DELETE FROM shoutouts WHERE message LIKE '%[e2e]%'; " +
          "DELETE FROM cards WHERE title LIKE 'E2E %'; " +
          "DELETE FROM company_values WHERE name LIKE 'E2E %'; " +
          "DELETE FROM audit_logs WHERE details::text LIKE '%E2E %'",
      ],
      { stdio: "pipe" },
    );
  } catch (error) {
    console.warn("E2E cleanup skipped:", (error as Error).message.split("\n")[0]);
  }
}
