import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";
import argon2 from "argon2";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsed = signupSchema.safeParse(body);

		if (!parsed.success) {
			const errors = parsed.error.errors.map((e) => e.message);
			return NextResponse.json({ error: errors[0] }, { status: 400 });
		}

		const { email, password, name } = parsed.data;

		// Check if email already exists
		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return NextResponse.json(
				{ error: "このメールアドレスは既に登録されています" },
				{ status: 409 }
			);
		}

		// Hash password
		const passwordHash = await argon2.hash(password);

		// Create user
		const user = await prisma.user.create({
			data: { email, name, passwordHash },
		});

		return NextResponse.json(
			{
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Signup error:", error);
		return NextResponse.json(
			{ error: "サーバーエラーが発生しました" },
			{ status: 500 }
		);
	}
}
