// /api/internal routes authenticate with their own bearer token.
const PUBLIC_PREFIXES = [
  "/signin",
  "/api/auth",
  "/api/health",
  "/api/ready",
  "/api/internal",
  "/brand",
  "/about",
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
