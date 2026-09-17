import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, loadConfig } from "./config";

describe("loadConfig", () => {
  it("uses defaults when unset or blank", () => {
    expect(loadConfig({})).toEqual(DEFAULT_CONFIG);
    expect(
      loadConfig({
        SHOUTOUT_QUARTERLY_BUDGET: " ",
        SHOUTOUT_MAX_RECIPIENTS: "",
        SHOUTOUT_ANALYTICS_VISIBILITY: " ",
      }),
    ).toEqual({ quarterlyBudget: 20, maxRecipients: 5, analyticsVisibility: "admins" });
  });

  it("reads values from the environment", () => {
    expect(
      loadConfig({
        SHOUTOUT_QUARTERLY_BUDGET: "12",
        SHOUTOUT_MAX_RECIPIENTS: "3",
        SHOUTOUT_ANALYTICS_VISIBILITY: "everyone",
      }),
    ).toEqual({ quarterlyBudget: 12, maxRecipients: 3, analyticsVisibility: "everyone" });
  });

  it.each(["0", "-2", "2.5", "lots"])("rejects invalid budget %s", (raw) => {
    expect(() => loadConfig({ SHOUTOUT_QUARTERLY_BUDGET: raw })).toThrow(
      /SHOUTOUT_QUARTERLY_BUDGET must be a positive whole number/,
    );
  });

  it("rejects unknown analytics visibility", () => {
    expect(() => loadConfig({ SHOUTOUT_ANALYTICS_VISIBILITY: "managers" })).toThrow(
      'SHOUTOUT_ANALYTICS_VISIBILITY must be one of admins, everyone, got "managers"',
    );
  });

  it("uses process.env by default", () => {
    expect(loadConfig().quarterlyBudget).toBeGreaterThan(0);
  });
});
