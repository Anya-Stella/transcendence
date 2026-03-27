/**
 * アプリ全体で共通利用する「定数（マジックナンバー）」を管理するファイルです。
 */

// ハートビート（オンライン生存報告）の送信間隔 (ミリ秒)
export const HEARTBEAT_INTERVAL_MS = 60000; // 1分

// オンラインとみなす経過時間のボーダー (分)
export const ONLINE_THRESHOLD_MINUTES = 2; // 2分以内

// アバター画像のアップロード制限
export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const AVATAR_ALLOWED_MIME_TYPES = ["image/png"];
export const AVATAR_ALLOWED_EXTENSIONS = [".png"];

// PNGファイルの先頭8バイトに必ず含まれる署名（マジックバイト）
// 【由来】全てのPNGファイルはこのバイト列から始まると国際規格で定められている
export const PNG_MAGIC_BYTES = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
