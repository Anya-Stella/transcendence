import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
	const auth = await getAuthFromCookie();
	if (!auth) {
		return NextResponse.json({ error: "未認証" }, { status: 401 });
	}

	const user = await prisma.user.findUnique({
		where: { id: auth.userId },
		select: {
			id: true,
			name: true,
			email: true,
			avatarUrl: true,
			totalMatches: true,
			wins: true,
			losses: true,
			createdAt: true,
		},
	});

	if (!user) {
		return NextResponse.json(
			{ error: "ユーザーが見つかりません" },
			{ status: 404 }
		);
	}

	return NextResponse.json({ user });
}
