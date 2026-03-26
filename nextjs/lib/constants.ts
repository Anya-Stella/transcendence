/**
 * アプリ全体で共通利用する「定数（マジックナンバー）」を管理するファイルです。
 */

// ハートビート（オンライン生存報告）の送信間隔 (ミリ秒)
export const HEARTBEAT_INTERVAL_MS = 60000; // 1分

// オンラインとみなす経過時間のボーダー (分)
export const ONLINE_THRESHOLD_MINUTES = 2; // 2分以内
