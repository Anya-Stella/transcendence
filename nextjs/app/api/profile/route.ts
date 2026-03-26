import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  // 1. 誰からのリクエストか確認（認証）
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  try {
    // 2. ブラウザから送られてきたデータ（新しい名前）を受け取る
    const body = await request.json();
    const { name } = body;

    // 3. DBのユーザー情報を上書き更新する
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name },
    });

    return NextResponse.json({ message: "名前を更新しました", user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
