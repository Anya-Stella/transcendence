"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isOnline } from "@/lib/utils";

interface UserProfile {
	id: string;
	name: string;
	image: string | null;
	lastSeen: string;
}

interface FriendshipData {
	friendshipId: string;
	user: UserProfile;
	createdAt: string;
	wins?: number;
	losses?: number;
}

export default function FriendsPage() {
	const router = useRouter();

	const [friends, setFriends] = useState<FriendshipData[]>([]);
	const [pendingRequests, setPendingRequests] = useState<FriendshipData[]>([]);
	const [sentRequests, setSentRequests] = useState<FriendshipData[]>([]);

	const [searchEmail, setSearchEmail] = useState("");
	const [message, setMessage] = useState({ text: "", type: "" });
	const [loading, setLoading] = useState(true);

	const fetchFriendsData = async () => {
		try {
			const res = await fetch("/api/friends");
			if (!res.ok) {
				if (res.status === 401) router.push("/login");
				return;
			}
			const data = await res.json();
			setFriends(data.friends || []);
			setPendingRequests(data.pendingRequests || []);
			setSentRequests(data.sentRequests || []);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchFriendsData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSendRequest = async (e: React.FormEvent) => {
		e.preventDefault();
		setMessage({ text: "", type: "" });

		if (!searchEmail) return;

		try {
			const res = await fetch("/api/friends", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ targetEmail: searchEmail }),
			});
			const data = await res.json();

			if (!res.ok) {
				setMessage({ text: data.error || "申請に失敗しました", type: "error" });
			} else {
				setMessage({ text: "フレンド申請を送信しました！", type: "success" });
				setSearchEmail("");
				fetchFriendsData();
			}
		} catch {
			setMessage({ text: "エラーが発生しました", type: "error" });
		}
	};

	const handleAcceptRequest = async (friendshipId: string) => {
		try {
			const res = await fetch(`/api/friends/${friendshipId}`, { method: "PUT" });
			if (res.ok) fetchFriendsData();
		} catch (error) {
			console.error(error);
		}
	};

	const handleRejectOrRemove = async (friendshipId: string) => {
		if (!confirm("本当に削除・拒否しますか？")) return;
		try {
			const res = await fetch(`/api/friends/${friendshipId}`, { method: "DELETE" });
			if (res.ok) fetchFriendsData();
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="wafuu-page">
			{/* 背景 (home-bg.pngなど共通のものを利用) */}
			<div
				className="wafuu-bg"
				style={{ backgroundImage: "url(/images/home-bg.png)" }}
			/>

			{/* ヘッダー */}
			<header className="wafuu-header">
				<div className="wafuu-header-logo">
					<Link href="/home" style={{ color: "var(--light)", textDecoration: "none" }}>
						⬅ 戻る
					</Link>
				</div>
				<div className="wafuu-header-right">
					<span className="wafuu-header-username">フレンド一覧</span>
				</div>
			</header>

			{/* コンテンツ */}
			<div className="wafuu-content" style={{ marginTop: "2rem", maxWidth: "800px", margin: "2rem auto", padding: "0 1rem" }}>

				{/* 申請フォームエリア */}
				<div style={{ background: "var(--secondary)", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem" }}>
					<h3 style={{ color: "var(--dark)", marginBottom: "1rem" }}>フレンド追加</h3>
					<form onSubmit={handleSendRequest} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
						<input
							type="email"
							placeholder="ユーザーのメールアドレス"
							value={searchEmail}
							onChange={(e) => setSearchEmail(e.target.value)}
							style={{ flex: 1, minWidth: "200px", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
							required
						/>
						<button type="submit" className="wafuu-header-btn" style={{ background: "var(--accent)" }}>
							申請を送る
						</button>
					</form>
					{message.text && (
						<div style={{ marginTop: "1rem", color: message.type === "error" ? "red" : "green", fontWeight: "bold" }}>
							{message.text}
						</div>
					)}
				</div>

				{loading ? (
					<p style={{ textAlign: "center", color: "white" }}>読み込み中...</p>
				) : (
					<div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

						{/* 承認待ち（自分宛） */}
						{pendingRequests.length > 0 && (
							<div style={{ background: "rgba(255,255,255,0.9)", padding: "1.5rem", borderRadius: "8px" }}>
								<h3 style={{ color: "var(--dark)", marginBottom: "1rem" }}>承認待ち（あなた宛て）</h3>
								<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
									{pendingRequests.map((req) => {
										const online = isOnline(req.user.lastSeen);
										return (
										<li key={req.friendshipId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
											<span style={{ color: "#333", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
												<img 
													src={req.user.image || "/images/default-avatar.png"} 
													alt="avatar" 
													style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} 
												/>
												<span 
													style={{ fontSize: "0.8rem", cursor: "help" }} 
													title={online ? "現在オンラインです" : "オフライン・退席中"}
													role="img"
													aria-label={online ? "オンライン" : "オフライン"}
												>
													{online ? "🟢" : "⚪"}
												</span>
												{req.user.name}
											</span>
											<div style={{ display: "flex", gap: "10px" }}>
												<button onClick={() => handleAcceptRequest(req.friendshipId)} style={{ background: "var(--accent)", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>承認</button>
												<button onClick={() => handleRejectOrRemove(req.friendshipId)} style={{ background: "#ccc", color: "#333", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>拒否</button>
											</div>
										</li>
									);
									})}
								</ul>
							</div>
						)}

						{/* フレンド一覧 */}
						<div style={{ background: "rgba(255,255,255,0.9)", padding: "1.5rem", borderRadius: "8px" }}>
							<h3 style={{ color: "var(--dark)", marginBottom: "1rem" }}>現在のフレンド ({friends.length})</h3>
							{friends.length === 0 ? (
								<p style={{ color: "#666" }}>フレンドはまだいません。</p>
							) : (
								<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
									{friends.map((friend) => {
										const online = isOnline(friend.user.lastSeen);
										return (
										<li key={friend.friendshipId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
											<span style={{ color: "#333", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
												<img 
													src={friend.user.image || "/images/default-avatar.png"} 
													alt="avatar" 
													style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} 
												/>
												<span 
													style={{ fontSize: "0.8rem", cursor: "help" }} 
													title={online ? "現在オンラインです" : "オフライン・退席中"}
													aria-label={online ? "オンライン" : "オフライン"}
												>
													{online ? "🟢" : "⚪"}
												</span>
												{friend.user.name}
												{friend.wins !== undefined && friend.losses !== undefined && (
													<span style={{ fontSize: "0.9em", color: "#666", marginLeft: "10px", fontWeight: "normal" }}>
														({friend.wins}勝 {friend.losses}敗)
													</span>
												)}
											</span>
											<button onClick={() => handleRejectOrRemove(friend.friendshipId)} style={{ background: "#ff4d4d", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>
												削除
											</button>
										</li>
									);
									})}
								</ul>
							)}
						</div>

						{/* 自分が送った申請 */}
						{sentRequests.length > 0 && (
							<div style={{ background: "rgba(255,255,255,0.9)", padding: "1.5rem", borderRadius: "8px" }}>
								<h3 style={{ color: "var(--dark)", marginBottom: "1rem" }}>送信済みの申請</h3>
								<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
									{sentRequests.map((req) => {
										const online = isOnline(req.user.lastSeen);
										return (
										<li key={req.friendshipId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
											<span style={{ color: "#333", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
												<img 
													src={req.user.image || "/images/default-avatar.png"} 
													alt="avatar" 
													style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} 
												/>
												<span 
													style={{ fontSize: "0.8rem", cursor: "help" }} 
													title={online ? "現在オンラインです" : "オフライン・退席中"}
													aria-label={online ? "オンライン" : "オフライン"}
													role="img"
												>
													{online ? "🟢" : "⚪"}
												</span>
												{req.user.name}
											</span>
											<button onClick={() => handleRejectOrRemove(req.friendshipId)} style={{ background: "#ccc", color: "#333", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>
												取り消し
											</button>
										</li>
									);
									})}
								</ul>
							</div>
						)}

					</div>
				)}
			</div>
		</div>
	);
}
