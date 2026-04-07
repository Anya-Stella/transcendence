import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "未認証" }, { status: 401 });
	}

	if (!session.user.id) {
		return NextResponse.json({ error: "ユーザーIDが不明です" }, { status: 400 });
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			id: true,
			name: true,
			email: true,
			image: true,
			totalMatches: true,
			wins: true,
			losses: true,
			createdAt: true,
			lastSeen: true,
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
