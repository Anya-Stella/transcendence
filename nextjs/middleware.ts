import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET || "fallback-secret-do-not-use-in-prod"
);

const COOKIE_NAME = "torassen_token";

// Pages only for unauthenticated users
const PUBLIC_PAGES = ["/login"];

async function verifyToken(token: string | undefined): Promise<boolean>
{
	if (!token)
		return false;
	try {
		await jwtVerify(token, JWT_SECRET);
		return true;
	}
	catch {
		return false;
	}
}

function redirect(request: NextRequest, pathname: string)
{
	const url = request.nextUrl.clone();
	url.pathname = pathname;
	return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest)
{
	const { pathname } = request.nextUrl;
	const token = request.cookies.get(COOKIE_NAME)?.value;
	const isAuthenticated = await verifyToken(token);

	// Redirect root to appropriate page
	if (pathname === "/")
		return redirect(request, isAuthenticated ? "/home" : "/login");

	// Redirect authenticated users away from login
	if (PUBLIC_PAGES.some((p) => pathname.startsWith(p)))
	{
		if(isAuthenticated)
			return redirect(request, "/home");
		return NextResponse.next();
	}

	// the other
	if (!isAuthenticated)
		return redirect(request, "/login");

	return NextResponse.next();
}

//settings for using middleware
export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico).*)"
	],
};
