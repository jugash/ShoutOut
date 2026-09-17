const PUBLIC_PREFIXES = ["/signin", "/api/auth", "/api/health", "/api/ready", "/brand"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
