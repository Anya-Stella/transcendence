import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET || "fallback-secret-do-not-use-in-prod"
);

const COOKIE_NAME = "torassen_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface JWTPayload {
	userId: string;
	email: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
	return new SignJWT(payload as unknown as Record<string, unknown>)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		return payload as unknown as JWTPayload;
	} catch {
		return null;
	}
}

export async function setAuthCookie(payload: JWTPayload): Promise<void> {
	const token = await signToken(payload);
	const cookieStore = await cookies();
	cookieStore.set(COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: COOKIE_MAX_AGE,
		path: "/",
	});
}

export async function getAuthFromCookie(): Promise<JWTPayload | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_NAME)?.value;
	if (!token) return null;
	return verifyToken(token);
}

export async function clearAuthCookie(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.set(COOKIE_NAME, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 0,
		path: "/",
	});
}
