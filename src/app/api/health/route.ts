/** Liveness probe: the process is up and serving requests. */
export function GET() {
  return Response.json({ status: "ok" });
}
