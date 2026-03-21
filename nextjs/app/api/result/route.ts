import { NextResponse } from "next/server";
import { getAuthFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { result: "win" | "lose" } }
) {
    const auth = await getAuthFromCookie();
    if (!auth) {
        return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    try {
        const user = await prisma.user.update({
            where: { id: auth.userId },
            data: {
                wins: params.result === "win" ? { increment: 1 } : undefined,
                losses: params.result === "lose" ? { increment: 1 } : undefined,
                totalMatches: { increment: 1 },
            },
        });

        return NextResponse.json({ user });
    } catch (error) {
        return NextResponse.json(
            { error: "戦績の更新に失敗しました" },
            { status: 404 }
        );
    }
}