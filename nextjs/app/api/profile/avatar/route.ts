import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ★メソッドは「リソースの上書き」を意味する PUT が正解です
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "画像ファイルがありません" }, { status: 400 });
    }

    // ★仕様1：拡張子の制限（セキュリティと容量の担保）
    // ファイル名（例: myphoto.PNG）の末尾を取り出し、小文字（.png）にして判定します
    const ext = path.extname(file.name).toLowerCase();
    if (ext !== ".png") {
      return NextResponse.json({ error: "アップロード可能なファイルは PNG (.png) のみです" }, { status: 400 });
    }

    // ★仕様2：保存するファイル名は「常に ユーザーID.png」に固定する
    // 【由来】何度アップロードされても、常にパソコンの中の「ユーザーID.png」が上書きされるため、
    // ゴミ（永遠に使われない古い画像）がサーバーに溜まっていくのを防ぐことができます！
    const filename = `${session.user.id}.png`;
    
    // 保存先のフォルダを作ります（すでに存在する場合はエラーにならず無視されます）
    const dirPath = path.join(process.cwd(), "public/images/icon");
    await mkdir(dirPath, { recursive: true });

    // Node.jsの機能を使って、フルパス（保存先）を作ります
    const filepath = path.join(dirPath, filename);

    // バイトデータ（Buffer：0と1の数字の羅列）に変換して、ディスクに保存します
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // ★仕様3：キャッシュバスター（ブラウザのサボり対策）＋ API経由の画像配信
    // 本番モードのNext.jsはビルド後にpublicに追加されたファイルを配信できないため、
    // 画像を配信するための専用APIルート (/api/profile/avatar/[id]) を経由してブラウザに届ける
    const timestamp = Date.now();
    const imageUrl = `/api/profile/avatar/${session.user.id}?t=${timestamp}`;

    // DBを新しく作ったURL（キャッシュバスター付き）に書き換えます
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    return NextResponse.json({ message: "画像をアップロードしました", imageUrl });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ 
      error: "アップロードに失敗しました", 
      details: errorMessage,
      code: error.code
    }, { status: 500 });
  }
}
