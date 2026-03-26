"use client"; // ブラウザ上で動かすため必須！

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { HEARTBEAT_INTERVAL_MS } from "@/lib/constants";

export function Heartbeat() {
  const { data: session } = useSession();

  useEffect(() => {
    // ログインしていなければ（ゲストなら）、タイマーは動かさない
    if (!session?.user?.id) return;

    // 最初に画面を開いた瞬間にも、1回だけ「元気だよ！」と送っておく
    fetch("/api/heartbeat", { method: "POST" }).catch(() => {});

    // ここから、指定した時間ごと（ミリ秒）に裏でこっそりAPIを叩き続けるタイマーをセット
    const intervalId = setInterval(() => {
      fetch("/api/heartbeat", { method: "POST" }).catch((err) => {
        // もしサーバーが落ちてても、ユーザーの画面の邪魔にならないよう裏のログに出すだけにする
        console.error("Heartbeat error", err);
      });
    }, HEARTBEAT_INTERVAL_MS);

    // 【重要】画面からこの部品が取り外された時（ログアウト時など）、タイマーを綺麗に止める（お片付け）
    // これを書かないと、永遠にタイマーが増殖してパソコンが重くなります
    return () => clearInterval(intervalId);
  }, [session?.user?.id]); // ← ログイン状態（ユーザーID）が変わった時だけタイマーをやり直す

  // 「透明な部品」なので、画面には一切何も表示させない
  return null;
}
