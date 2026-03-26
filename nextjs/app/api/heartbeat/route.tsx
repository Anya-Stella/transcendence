import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  // 1. 誰からの生存報告なのか（セッション）を確認する
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインしていません" }, { status: 401 });
  }

  try {
    // 2. そのユーザーの「最終アクセス時刻（lastSeen）」を「今この瞬間」に上書きする！
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastSeen: new Date() },
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ error: "生存報告の更新に失敗しました" }, { status: 500 });
  }
}
