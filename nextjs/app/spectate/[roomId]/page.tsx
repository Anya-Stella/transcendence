"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function SpectateRoomPage() {
	const params = useParams();
	const roomId = params.roomId as string;

	return (
		<div>
			<header className="header">
				<Link
					href="/home"
					className="header-logo"
					style={{ textDecoration: "none" }}
				>
					🐯 虎戦
				</Link>
			</header>

			<div className="page page-top">
				<div className="card card-wide">
					<h3 className="card-title">👁️ 観戦中</h3>
					<div style={{ textAlign: "center" }}>
						<div className="room-id mb-16">{roomId}</div>
						<p className="text-muted mb-24">
							観戦機能は現在準備中です。<br />
							今後のアップデートをお楽しみに！
						</p>
						<Link
							href="/home"
							className="btn btn-outline"
							style={{ textAlign: "center" }}
						>
							← ホームに戻る
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
