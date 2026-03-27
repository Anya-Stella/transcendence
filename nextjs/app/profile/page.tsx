"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
	// 1. Auth.jsからセッション情報と、セッションを再取得するための update 関数をもらう
	const { data: session, update } = useSession();

	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState("");

	// セッションが読み込まれたら、現在の名前を入力フォームの初期値にセットする
	useEffect(() => {
		if (session?.user?.name) {
			setName(session.user.name);
		}
	}, [session]);

	// 保存ボタンを押したときの処理
	const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setMessage("");

		try {
			// 2. プロフィール更新API（PUT /api/profile）に送信する
			const res = await fetch("/api/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name }),
			});

			if (res.ok) {
				setMessage("更新しました！");
				// 3. Auth.js のセッション情報も最新に更新（これで右上の名前もすぐ置き換わります）
				await update({ name });
			} else {
				const errorData = await res.json();
				setMessage(`エラー: ${errorData.error}`);
			}
		} catch (error) {
			setMessage("通信エラーが発生しました");
		} finally {
			setIsLoading(false);
		}
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]; // 選択されたファイルを取り出す
		if (!file) return;
		setIsLoading(true);
		setMessage("アップロード中...");
		// 1. ファイル送信専用の「梱包箱」にファイルを詰める
		const formData = new FormData();
		formData.append("file", file);
		try {
		  // 2. 画像アップロード専用API（PUT /api/profile/avatar）を叩く
		  const res = await fetch("/api/profile/avatar", {
			method: "PUT",
			// 【超重要】 FormData を送るときは "Content-Type" を書いてはいけません！（ブラウザが自動で特別な境界線付きのヘッダーを作ってくれます）
			body: formData,
		  });
		  if (res.ok) {
			const data = await res.json();
		setMessage("画像を更新しました！");
		// 3. 通行証（セッション）も最新の画像URLに即座に更新する
		await update({ image: data.imageUrl });
		  } else {
			const errorData = await res.json();
			setMessage(`エラー: ${errorData.error}`);
		  }
		} catch (error) {
		  setMessage("通信エラーが発生しました");
		} finally {
		  setIsLoading(false);
		}
	  };

	return (
		<div className="wafuu-page">
			<div className="wafuu-bg" style={{ backgroundImage: "url(/images/home-bg.png)" }} />

			<header className="wafuu-header">
				<div className="wafuu-header-logo">プロフィール設定</div>
				<div className="wafuu-header-right">
					<Link href="/home" className="wafuu-header-btn" style={{ textDecoration: "none" }}>
						ホームに戻る
					</Link>
				</div>
			</header>

			<div className="wafuu-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
				<div className="wafuu-menu" style={{ width: "100%", maxWidth: "600px", padding: "2rem", backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "8px" }}>
					<h2 style={{ textAlign: "center", marginBottom: "2rem", color: "#333" }}>ユーザー情報</h2>

					<div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
						<img
							src={session?.user?.image || "/images/default-avatar.png"}
							alt="User Avatar"
							style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "3px solid #ccc" }}
						/>
						<div style={{ marginTop: "1rem" }}>
              				<label 
                				htmlFor="avatar-upload" 
                				style={{ cursor: isLoading ? "wait" : "pointer", padding: "0.5rem 1rem", backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px", fontSize: "0.9rem", color: "#333" }}
              				>
                				画像を変更 (PNGのみ)
              				</label>
              				<input
                			  id="avatar-upload"
                			  type="file"
                			  accept="image/png"
                			  onChange={handleImageUpload}
                			  disabled={isLoading}
                			  style={{ display: "none" }}
              				/>
            			</div>
					</div>

					{/* 入力フォーム */}
					<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
						<div>
							<label htmlFor="name" style={{ display: "block", marginBottom: "0.5rem", color: "#333", fontWeight: "bold" }}>プレイヤー名</label>
							<input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								style={{ width: "100%", padding: "0.75rem", borderRadius: "4px", border: "1px solid #ccc", color: "#000", fontSize: "1rem" }}
							/>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							style={{ padding: "0.75rem", backgroundColor: "#333", color: "white", border: "none", borderRadius: "4px", cursor: isLoading ? "wait" : "pointer", fontSize: "1rem" }}
						>
							{isLoading ? "保存中..." : "保存する"}
						</button>

						{/* 結果メッセージの表示 */}
						{message && (
							<p style={{ textAlign: "center", color: message.includes("エラー") ? "#d32f2f" : "#2e7d32", fontWeight: "bold" }}>
								{message}
							</p>
						)}
					</form>

				</div>
			</div>
		</div>
	);
}
