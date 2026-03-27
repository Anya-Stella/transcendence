import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

// ★ 本番環境ではNext.jsはビルド後に追加されたpublic/内のファイルを配信できないため、
// このAPIルートを通じて動的にファイルを読み込んで返す（画像配信専用API）
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // セキュリティ対策：IDにパス操作文字（../など）が含まれていないかチェック
  if (id.includes("..") || id.includes("/") || id.includes("\\")) {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public/images/icon", `${id}.png`);

  try {
    const fileBuffer = await readFile(filePath);
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        // ブラウザに「10秒だけキャッシュしてOK、でもサーバーに常に確認してね」と指示
        "Cache-Control": "public, max-age=10, must-revalidate",
      },
    });
  } catch {
    // ファイルが見つからない場合は404
    return NextResponse.json({ error: "画像が見つかりません" }, { status: 404 });
  }
}
