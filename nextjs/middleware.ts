import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET || "fallback-secret-do-not-use-in-prod"
);

const COOKIE_NAME = "torassen_token";

// Pages that require authentication
const PROTECTED_PATHS = ["/home", "/online", "/room", "/match", "/spectate", "/result"];

// Pages only for unauthenticated users
const AUTH_PAGES = ["/login"];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = request.cookies.get(COOKIE_NAME)?.value;

	let isAuthenticated = false;
	if (token) {
		try {
			await jwtVerify(token, JWT_SECRET);
			isAuthenticated = true;
		} catch {
			// Invalid token
		}
	}

	// Redirect root to appropriate page
	if (pathname === "/") {
		const url = request.nextUrl.clone();
		url.pathname = isAuthenticated ? "/home" : "/login";
		return NextResponse.redirect(url);
	}

	// Redirect authenticated users away from login
	if (AUTH_PAGES.some((p) => pathname.startsWith(p)) && isAuthenticated) {
		const url = request.nextUrl.clone();
		url.pathname = "/home";
		return NextResponse.redirect(url);
	}

	// Redirect unauthenticated users to login
	if (
		PROTECTED_PATHS.some((p) => pathname.startsWith(p)) &&
		!isAuthenticated
	) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/",
		"/login",
		"/home",
		"/online",
		"/room/:path*",
		"/match/:path*",
		"/spectate/:path*",
		"/result",
	],
};
