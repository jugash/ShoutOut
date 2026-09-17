export const MESSAGE_MAX_LENGTH = 280;

export const ANALYTICS_VISIBILITY = ["admins", "everyone"] as const;
export type AnalyticsVisibility = (typeof ANALYTICS_VISIBILITY)[number];

export interface AppConfig {
  /** Shoutouts each person can send per calendar quarter (each recipient uses one). */
  quarterlyBudget: number;
  /** Maximum people in a single shoutout. */
  maxRecipients: number;
  /** Who can open the analytics dashboard. */
  analyticsVisibility: AnalyticsVisibility;
}

export const DEFAULT_CONFIG: AppConfig = {
  quarterlyBudget: 20,
  maxRecipients: 5,
  analyticsVisibility: "admins",
};

function oneOf<T extends string>(
  raw: string | undefined,
  name: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = raw?.trim();
  if (!value) return fallback;
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`${name} must be one of ${allowed.join(", ")}, got "${raw}"`);
  }
  return value as T;
}

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
    analyticsVisibility: oneOf(
      env.SHOUTOUT_ANALYTICS_VISIBILITY,
      "SHOUTOUT_ANALYTICS_VISIBILITY",
      ANALYTICS_VISIBILITY,
      DEFAULT_CONFIG.analyticsVisibility,
    ),
  };
}
