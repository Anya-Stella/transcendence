import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";

// ───── プロフィール更新（Command） ─────
export async function PUT(request: Request) {
  // 1. 誰からのリクエストか確認（認証）
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  try {
    // 2. ブラウザから送られてきたデータ（新しい名前）を受け取る
    const body = await request.json();

    // 3. バリデーション（signupSchema から name のルールだけ再利用）
    const result = signupSchema.pick({ name: true }).safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    // 4. DBのユーザー情報を上書き更新する（バリデーション済みの安全な値を使う）
    // select で返すカラムを限定し、passwordHash などの機密情報が漏れるのを防ぐ
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: result.data.name },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    return NextResponse.json({ message: "名前を更新しました", user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
