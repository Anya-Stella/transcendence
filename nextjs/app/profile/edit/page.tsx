"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";

export default function ProfileEditPage() {
	// 1. Auth.jsからセッション情報と、セッションを再取得するための update 関数をもらう
	const { data: session, update } = useSession();

	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState({ text: "", type: "" });

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
		setMessage({ text: "", type: "" });

		try {
			// 2. プロフィール更新API（PUT /api/profile）に送信する
			const res = await fetch("/api/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name }),
			});

			if (res.ok) {
				setMessage({ text: "更新しました！", type: "success" });
				// 3. Auth.js のセッション情報も最新に更新（これで右上の名前もすぐ置き換わります）
				await update({ name });
			} else {
				const errorData = await res.json();
				setMessage({ text: `エラー: ${errorData.error}`, type: "error" });
			}
		} catch (error) {
			setMessage({ text: "通信エラーが発生しました", type: "error" });
		} finally {
			setIsLoading(false);
		}
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]; // 選択されたファイルを取り出す
		if (!file) return;
		setIsLoading(true);
		setMessage({ text: "アップロード中...", type: "info" });
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
				setMessage({ text: "画像を更新しました！", type: "success" });
				// 3. 通行証（セッション）も最新の画像URLに即座に更新する
				await update({ image: data.imageUrl });
			} else {
				const errorData = await res.json();
				setMessage({ text: `エラー: ${errorData.error}`, type: "error" });
			}
		} catch (error) {
			setMessage({ text: "通信エラーが発生しました", type: "error" });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="wafuu-page">
			{/* 背景 */}
			<div
				className="wafuu-bg"
				style={{ backgroundImage: "url(/images/home-bg.png)" }}
			/>

			<Header
				title="将棋ゲーム"
				pageName="プロフィール編集"
				backHref="/profile"
				backLabel="戻る"
			/>

			{/* コンテンツ */}
			<div className="wafuu-content" style={{ justifyContent: "flex-start", paddingTop: "80px" }}>
				<div
					className="wafuu-flex-col wafuu-gap-16"
					style={{ width: "100%", maxWidth: "500px", alignItems: "center" }}
				>
					<h2 className="wafuu-heading">プロフィール編集</h2>

					<div className="wafuu-card" style={{ maxWidth: "100%", textAlign: "center" }}>
						{/* アバター表示 */}
						<div style={{ position: "relative", marginBottom: "2rem", display: "inline-block" }}>
							<img
								src={session?.user?.image || "/images/default-avatar.png"}
								alt="User Avatar"
								className="wafuu-profile-avatar"
							/>
							<div style={{ marginTop: "1rem" }}>
								<label
									htmlFor="avatar-upload"
									className="wafuu-header-btn"
									style={{
										cursor: isLoading ? "wait" : "pointer",
										display: "inline-block"
									}}
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
						<form onSubmit={handleSubmit} className="wafuu-flex-col wafuu-gap-16">
							<div style={{ textAlign: "left" }}>
								<label htmlFor="name" className="wafuu-label">プレイヤー名</label>
								<input
									id="name"
									className="wafuu-input"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
									autoComplete="off"
									style={{ textAlign: "center", fontSize: "1.1rem" }}
								/>
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="wafuu-btn-primary"
							>
								{isLoading ? "保存中..." : "保存する"}
							</button>

							{/* 結果メッセージの表示 */}
							{message.text && (
								<div className={message.type === "error" ? "wafuu-error" : message.type === "info" ? "wafuu-badge wafuu-badge-info" : "wafuu-badge wafuu-badge-success"} style={{ width: "100%", textAlign: "center", marginTop: "10px" }}>
									{message.text}
								</div>
							)}
						</form>
					</div>

					<div className="wafuu-mt-16" style={{ width: "100%" }}>
						<Link href="/profile" className="wafuu-btn-outline">
							プロフィールに戻る
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
