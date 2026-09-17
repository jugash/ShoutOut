import { describe, expect, it } from "vitest";
import { DomainError } from "./errors";

describe("DomainError", () => {
  it("carries a code, message and optional field", () => {
    const error = new DomainError("BUDGET_EXCEEDED", "No budget", "recipientIds");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("DomainError");
    expect(error.code).toBe("BUDGET_EXCEEDED");
    expect(error.field).toBe("recipientIds");
    expect(new DomainError("NOT_FOUND", "Missing").field).toBeUndefined();
  });
});
