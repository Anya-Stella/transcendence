"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { isOnline } from "@/lib/utils";

interface UserProfile {
	id: string;
	name: string;
	image: string | null;
	lastSeen: string | null;
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
			{/* 背景 */}
			<div
				className="wafuu-bg"
				style={{ backgroundImage: "url(/images/home-bg.png)" }}
			/>

			<Header
				title="将棋ゲーム"
				pageName="フレンド管理"
				backHref="/home"
				backLabel="戻る"
			/>

			{/* コンテンツ */}
			<div className="wafuu-content" style={{ justifyContent: "flex-start", paddingTop: "80px" }}>
				<div
					className="wafuu-flex-col wafuu-gap-16"
					style={{ width: "100%", maxWidth: "600px", alignItems: "center" }}
				>

					{/* フレンド追加 */}
					<div className="wafuu-card" style={{ maxWidth: "100%" }}>
						<h3 className="wafuu-label" style={{ fontSize: "1rem", marginBottom: "12px" }}>フレンド追加</h3>
						<form onSubmit={handleSendRequest} className="wafuu-flex-col wafuu-gap-12">
							<div style={{ display: "flex", gap: "8px" }}>
								<input
									className="wafuu-input"
									type="email"
									placeholder="メールアドレスを入力"
									value={searchEmail}
									onChange={(e) => setSearchEmail(e.target.value)}
									required
									style={{ flex: 1 }}
								/>
								<button type="submit" className="wafuu-btn-primary" style={{ width: "auto", padding: "0 20px" }}>
									申請
								</button>
							</div>
							{message.text && (
								<div className={message.type === "error" ? "wafuu-error" : "wafuu-badge wafuu-badge-success"} style={{ width: "100%", textAlign: "center" }}>
									{message.text}
								</div>
							)}
						</form>
					</div>

					{loading ? (
						<div className="wafuu-text-center wafuu-pulse" style={{ color: "#f5e6c8", marginTop: "2rem" }}>
							読み込み中...
						</div>
					) : (
						<div className="wafuu-flex-col wafuu-gap-16" style={{ width: "100%" }}>
							{/* 承認待ち（自分宛） */}
							{pendingRequests.length > 0 && (
								<div className="wafuu-card" style={{ maxWidth: "100%" }}>
									<h3 className="wafuu-label" style={{ fontSize: "1rem", marginBottom: "12px" }}>承認待ち（あなた宛て）</h3>
									<div className="wafuu-flex-col wafuu-gap-12">
										{pendingRequests.map((req) => {
											const online = isOnline(req.user.lastSeen);
											return (
												<div key={req.friendshipId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid rgba(212, 175, 55, 0.1)" }}>
													<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
														<img
															src={req.user.image || "/images/default-avatar.png"}
															alt="avatar"
															style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid rgba(212, 175, 55, 0.3)" }}
														/>
														<div className="wafuu-flex-col">
															<span style={{ color: "#f5e6c8", fontWeight: "600", fontSize: "0.95rem" }}>{req.user.name}</span>
															<span className="wafuu-badge" style={{ padding: 0, fontSize: "0.7rem", color: online ? "#4ade80" : "#ff8888" }}>
																{online ? "● オンライン" : "● オフライン"}
															</span>
														</div>
													</div>
													<div style={{ display: "flex", gap: "8px" }}>
														<button onClick={() => handleAcceptRequest(req.friendshipId)} className="wafuu-header-btn" style={{ borderColor: "#4ade80", color: "#4ade80" }}>承認</button>
														<button onClick={() => handleRejectOrRemove(req.friendshipId)} className="wafuu-header-btn">拒否</button>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}

							{/* フレンド一覧 */}
							<div className="wafuu-card" style={{ maxWidth: "100%" }}>
								<h3 className="wafuu-label" style={{ fontSize: "1rem", marginBottom: "12px" }}>現在のフレンド ({friends.length})</h3>
								{friends.length === 0 ? (
									<p className="wafuu-text-center" style={{ color: "rgba(245, 230, 200, 0.4)", padding: "1rem 0" }}>フレンドはまだいません。</p>
								) : (
									<div className="wafuu-flex-col wafuu-gap-12">
										{friends.map((friend) => {
											const online = isOnline(friend.user.lastSeen);
											return (
												<div key={friend.friendshipId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid rgba(212, 175, 55, 0.1)" }}>
													<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
														<img
															src={friend.user.image || "/images/default-avatar.png"}
															alt="avatar"
															style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(212, 175, 55, 0.3)" }}
														/>
														<div className="wafuu-flex-col">
															<span style={{ color: "#f5e6c8", fontWeight: "600" }}>{friend.user.name}</span>
															<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
																<span style={{ fontSize: "0.75rem", color: online ? "#4ade80" : "#ff8888" }}>
																	{online ? "● オンライン" : "● オフライン"}
																</span>
																{friend.wins !== undefined && friend.losses !== undefined && (
																	<span style={{ fontSize: "0.75rem", color: "rgba(245, 230, 200, 0.6)" }}>
																		({friend.wins}勝 {friend.losses}敗)
																	</span>
																)}
															</div>
														</div>
													</div>
													<button onClick={() => handleRejectOrRemove(friend.friendshipId)} className="wafuu-header-btn" style={{ borderColor: "rgba(200, 50, 50, 0.4)", color: "#ff8888" }}>
														削除
													</button>
												</div>
											);
										})}
									</div>
								)}
							</div>

							{/* 送信済みの申請 */}
							{sentRequests.length > 0 && (
								<div className="wafuu-card" style={{ maxWidth: "100%" }}>
									<h3 className="wafuu-label" style={{ fontSize: "1rem", marginBottom: "12px" }}>送信済みの申請</h3>
									<div className="wafuu-flex-col wafuu-gap-12">
										{sentRequests.map((req) => {
											const online = isOnline(req.user.lastSeen);
											return (
												<div key={req.friendshipId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid rgba(212, 175, 55, 0.1)" }}>
													<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
														<img
															src={req.user.image || "/images/default-avatar.png"}
															alt="avatar"
															style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid rgba(245, 230, 200, 0.1)" }}
														/>
														<span style={{ color: "rgba(245, 230, 200, 0.7)", fontSize: "0.9rem" }}>{req.user.name}</span>
													</div>
													<button onClick={() => handleRejectOrRemove(req.friendshipId)} className="wafuu-header-btn" style={{ fontSize: "0.75rem" }}>
														取り消し
													</button>
												</div>
											);
										})}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
