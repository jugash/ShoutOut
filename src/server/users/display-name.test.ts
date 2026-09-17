import { describe, expect, it } from "vitest";
import { displayName } from "./upsert-from-oidc";

describe("displayName", () => {
  it("prefers the name claim", () => {
    expect(displayName({ name: "Alice Admin", given_name: "A" })).toBe("Alice Admin");
  });

  it("joins given and family names", () => {
    expect(displayName({ given_name: "Bob", family_name: "Builder" })).toBe("Bob Builder");
    expect(displayName({ given_name: "Bob" })).toBe("Bob");
  });

  it("falls back to username, email, then Unknown", () => {
    expect(displayName({ preferred_username: "carol" })).toBe("carol");
    expect(displayName({ email: "dave@example.com" })).toBe("dave@example.com");
    expect(displayName({})).toBe("Unknown");
  });
});
