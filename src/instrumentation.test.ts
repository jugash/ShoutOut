import { afterEach, describe, expect, it, vi } from "vitest";

const startupSync = vi.fn().mockResolvedValue(true);
vi.mock("./server/users/startup-sync", () => ({ startupSync }));

const { register } = await import("./instrumentation");

describe("register", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    startupSync.mockClear();
  });

  it("starts the user sync on the Node.js runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    await register();
    expect(startupSync).toHaveBeenCalledOnce();
  });

  it("skips other runtimes", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    await register();
    expect(startupSync).not.toHaveBeenCalled();
  });
});
