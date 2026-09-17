import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, loadConfig } from "./config";

describe("loadConfig", () => {
  it("uses defaults when unset or blank", () => {
    expect(loadConfig({})).toEqual(DEFAULT_CONFIG);
    expect(loadConfig({ SHOUTOUT_QUARTERLY_BUDGET: " ", SHOUTOUT_MAX_RECIPIENTS: "" })).toEqual({
      quarterlyBudget: 20,
      maxRecipients: 5,
    });
  });

  it("reads values from the environment", () => {
    expect(loadConfig({ SHOUTOUT_QUARTERLY_BUDGET: "12", SHOUTOUT_MAX_RECIPIENTS: "3" })).toEqual({
      quarterlyBudget: 12,
      maxRecipients: 3,
    });
  });

  it.each(["0", "-2", "2.5", "lots"])("rejects invalid budget %s", (raw) => {
    expect(() => loadConfig({ SHOUTOUT_QUARTERLY_BUDGET: raw })).toThrow(
      /SHOUTOUT_QUARTERLY_BUDGET must be a positive whole number/,
    );
  });

  it("uses process.env by default", () => {
    expect(loadConfig().quarterlyBudget).toBeGreaterThan(0);
  });
});
