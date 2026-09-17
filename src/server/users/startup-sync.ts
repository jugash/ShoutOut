import { getDb } from "@/lib/db";
import { runKeycloakSync, syncCredentialsFromEnv } from "./sync-users";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Syncs people from Keycloak once when the server starts, so everyone can be
 * recognised straight after a deploy. Retries while Keycloak is still starting.
 */
export async function startupSync({
  attempts = 10,
  delayMs = 15_000,
  run = runKeycloakSync,
  env = process.env,
}: {
  attempts?: number;
  delayMs?: number;
  run?: typeof runKeycloakSync;
  env?: Record<string, string | undefined>;
} = {}): Promise<boolean> {
  const credentials = syncCredentialsFromEnv(env);
  if (!credentials || env.SHOUTOUT_SYNC_ON_STARTUP === "false") {
    return false;
  }
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await run(getDb(), credentials);
      console.info("[user-sync] startup sync complete", result);
      return true;
    } catch (error) {
      console.warn(
        `[user-sync] startup sync attempt ${attempt}/${attempts} failed:`,
        (error as Error).message,
      );
      if (attempt < attempts) await sleep(delayMs);
    }
  }
  return false;
}
