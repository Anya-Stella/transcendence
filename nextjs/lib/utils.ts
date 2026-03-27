/**
 * アプリ全体で共通利用する「便利関数（ユーティリティ）」を管理するファイルです。
 */

import { ONLINE_THRESHOLD_MINUTES } from "./constants";

// 最終アクセス時刻を受け取り、それが現在から指定時間以内なら true（オンライン）を返す
export const isOnline = (lastSeen?: string | Date | null) => {
  if (!lastSeen) return false;
  
  const lastMs = new Date(lastSeen).getTime();
  const nowMs = new Date().getTime();
  
  // 差分を分単位に直す
  const diffMinutes = (nowMs - lastMs) / (1000 * 60);
  
  return diffMinutes < ONLINE_THRESHOLD_MINUTES; 
};
