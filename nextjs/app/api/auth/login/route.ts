import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { setAuthCookie } from "@/lib/auth";
import argon2 from "argon2";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsed = loginSchema.safeParse(body);

		if (!parsed.success) {
			const errors = parsed.error.errors.map((e) => e.message);
			return NextResponse.json({ error: errors[0] }, { status: 400 });
		}

		const { email, password } = parsed.data;

		// Find user
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user || !user.passwordHash) {
			return NextResponse.json(
				{ error: "メールアドレスまたはパスワードが正しくありません" },
				{ status: 401 }
			);
		}

		// Verify password
		const valid = await argon2.verify(user.passwordHash, password);
		if (!valid) {
			return NextResponse.json(
				{ error: "メールアドレスまたはパスワードが正しくありません" },
				{ status: 401 }
			);
		}

		// Set JWT cookie
		await setAuthCookie({ userId: user.id, email: user.email! });

		return NextResponse.json({
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json(
			{ error: "サーバーエラーが発生しました" },
			{ status: 500 }
		);
	}
}
