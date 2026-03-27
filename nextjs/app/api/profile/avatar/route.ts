import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateAvatarFile, isPngMagicBytes } from "@/lib/validations";
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
    // as File でのキャストは危険（string が来た場合に実行時エラーになる）
    // instanceof File で型ガードを使って安全に絞り込む
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "画像ファイルがありません" }, { status: 400 });
    }

    // ★バリデーション（ファイルサイズ、MIMEタイプ、拡張子を一括チェック）
    const validationError = validateAvatarFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // ★マジックバイト検証（ファイルの中身が本当にPNGか確認）
    // ファイルのバイトデータを先に読み込み、先頭バイトをチェックする
    const bytes = await file.arrayBuffer();
    if (!isPngMagicBytes(bytes)) {
      return NextResponse.json({ error: "ファイルの中身がPNG画像ではありません" }, { status: 400 });
    }

    // ★保存するファイル名は「常に ユーザーID.png」に固定する
    const filename = `${session.user.id}.png`;
    
    // 保存先のフォルダを作ります（すでに存在する場合はエラーにならず無視されます）
    const dirPath = path.join(process.cwd(), "public/images/icon");
    await mkdir(dirPath, { recursive: true });

    const filepath = path.join(dirPath, filename);

    // バリデーション済みのバイトデータをディスクに保存
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // ★仕様3：キャッシュバスター（ブラウザのサボり対策）＋ API経由の画像配信
    // 本番モードのNext.jsはビルド後にpublicに追加されたファイルを配信できないため、
    // 画像を配信するための専用APIルート (/api/profile/avatar/[id]) を経由してブラウザに届ける
    const timestamp = Date.now();
    const imageUrl = `/api/profile/avatar/${session.user.id}?t=${timestamp}`;

    // DBを新しく作ったURL（キャッシュバスター付き）に書き換えます
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    return NextResponse.json({ message: "画像をアップロードしました", imageUrl });
  } catch (error) {
    console.error("Avatar upload error:", error); // ← サーバーログには残す
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}
