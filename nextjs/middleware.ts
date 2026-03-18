import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth?.user;

  const isPublicPage = nextUrl.pathname.startsWith("/login");
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isRoot = nextUrl.pathname === "/";

  if (isApiAuthRoute) return;

  if (isRoot) {
    return Response.redirect(new URL(isAuthenticated ? "/home" : "/login", nextUrl));
  }

  if (isPublicPage) {
    if (isAuthenticated) {
      return Response.redirect(new URL("/home", nextUrl));
    }
    return;
  }

  if (!isAuthenticated) {
    return Response.redirect(new URL("/login", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)", "/"],
};
