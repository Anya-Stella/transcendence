import { z } from "zod";

export const signupSchema = z.object({
	email: z
		.string()
		.email("有効なメールアドレスを入力してください"),
	password: z
		.string()
		.min(8, "パスワードは8文字以上にしてください"),
	name: z
		.string()
		.min(1, "名前を入力してください")
		.max(50, "名前は50文字以内にしてください"),
});

export const loginSchema = z.object({
	email: z
		.string()
		.email("有効なメールアドレスを入力してください"),
	password: z
		.string()
		.min(1, "パスワードを入力してください"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

import {
	AVATAR_MAX_SIZE_BYTES,
	AVATAR_ALLOWED_MIME_TYPES,
	AVATAR_ALLOWED_EXTENSIONS,
	PNG_MAGIC_BYTES,
} from "@/lib/constants";

// PNGファイルの先頭8バイトに必ず含まれる署名（マジックバイト）

/**
 * アバター画像ファイルを3段階で検証する
 * @returns エラーメッセージ（問題なければ null）
 */
export function validateAvatarFile(file: File): string | null {
	// 1. ファイルサイズの確認（サーバー側でも制限し、Nginx依存にしない）
	if (file.size > AVATAR_MAX_SIZE_BYTES) {
		return `ファイルサイズは${AVATAR_MAX_SIZE_BYTES / 1024 / 1024}MB以内にしてください`;
	}

	// 2. MIMEタイプの確認（ブラウザが申告するファイル種別）
	if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.type)) {
		return "アップロード可能なファイルは PNG 画像のみです";
	}

	// 3. 拡張子の確認（ファイル名の末尾）
	const ext = file.name.toLowerCase().split(".").pop();
	if (!ext || !AVATAR_ALLOWED_EXTENSIONS.includes(`.${ext}`)) {
		return "アップロード可能なファイルは PNG (.png) のみです";
	}

	return null; // 問題なし
}

/**
 * バイトデータの先頭がPNGのマジックバイトと一致するか検証する
 * 【由来】拡張子やMIMEタイプは簡単に偽装できるが、ファイルの中身（先頭バイト）は嘘をつけない
 * @returns true = 正規のPNGファイル
 */
export function isPngMagicBytes(buffer: ArrayBuffer): boolean {
	const header = new Uint8Array(buffer).slice(0, 8);
	return PNG_MAGIC_BYTES.every((byte, i) => header[i] === byte);
}

