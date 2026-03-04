import { NextResponse } from "next/server";

const COOKIE_NAME = "torassen_token";

export async function POST() {
	const response = NextResponse.json({ success: true });
	response.cookies.set(COOKIE_NAME, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 0,
		path: "/",
	});
	response.cookies.delete(COOKIE_NAME);
	return response;
}
