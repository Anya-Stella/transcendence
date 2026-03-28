import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth?.user;

  const isLoginPage = nextUrl.pathname.startsWith("/login");
  const isLegalPage = nextUrl.pathname.startsWith("/privacy")
    || nextUrl.pathname.startsWith("/terms");
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isRoot = nextUrl.pathname === "/";

  if (isApiAuthRoute) return;
  if (isLegalPage) return;

  if (isRoot) {
    return Response.redirect(new URL(isAuthenticated ? "/home" : "/login", nextUrl));
  }

  if (isLoginPage) {
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
  matcher: ["/((?!api|_next/static|_next/image|images|favicon.ico).*)", "/"],
};
