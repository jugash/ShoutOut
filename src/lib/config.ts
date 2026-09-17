export const MESSAGE_MAX_LENGTH = 280;

export interface AppConfig {
  /** Shoutouts each person can send per calendar quarter (each recipient uses one). */
  quarterlyBudget: number;
  /** Maximum people in a single shoutout. */
  maxRecipients: number;
}

export const DEFAULT_CONFIG: AppConfig = { quarterlyBudget: 20, maxRecipients: 5 };

function positiveInt(raw: string | undefined, name: string, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive whole number, got "${raw}"`);
  }
  return value;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  return {
    quarterlyBudget: positiveInt(
      env.SHOUTOUT_QUARTERLY_BUDGET,
      "SHOUTOUT_QUARTERLY_BUDGET",
      DEFAULT_CONFIG.quarterlyBudget,
    ),
    maxRecipients: positiveInt(
      env.SHOUTOUT_MAX_RECIPIENTS,
      "SHOUTOUT_MAX_RECIPIENTS",
      DEFAULT_CONFIG.maxRecipients,
    ),
  };
}
