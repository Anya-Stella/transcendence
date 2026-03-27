import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    try {
        // リクエストボディから結果を取得
        // フロントエンド側で JSON.stringify({ result: "win" }) のように送る想定
        const { result } = await req.json() as { result: "win" | "lose" };

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                // resultの値に基づいてインクリメント対象を切り替え
                wins: result === "win" ? { increment: 1 } : undefined,
                losses: result === "lose" ? { increment: 1 } : undefined,
                totalMatches: { increment: 1 },
            },
            select: {
                id: true,
                name: true,
                totalMatches: true,
                wins: true,
                losses: true,
            },
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error(error); // デバッグ用にエラーをログ出力
        return NextResponse.json(
            { error: "戦績の更新に失敗しました" },
            { status: 500 } // 404より500（サーバーエラー）が一般的です
        );
    }
}
