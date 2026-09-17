export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startupSync } = await import("./server/users/startup-sync");
    void startupSync();
  }
}
