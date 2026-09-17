import { auth } from "@/auth";

// Redirects unauthenticated requests to /signin (see `authorized` callback).
export default auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
