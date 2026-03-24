"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import MatchBoard from "@/components/MatchBoard";

export default function OnlineMatchPage() {
	const params = useParams();
	const roomId = params.roomId as string;
	const { data: session, status } = useSession();
	const [socket, setSocket] = useState<Socket | null>(null);
	const [wsStatus, setWsStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
	const [mySide, setMySide] = useState<"sente" | "gote" | "spectator">("spectator");
	const userId = (session?.user as any)?.id ?? null;

	useEffect(() => {
		if (status === "loading") return;

		const s = io({
			transports: ["websocket"],
		});

		s.on("connect", () => {
			console.log("[WS] Connected. ID:", s.id);
			setWsStatus("connected");
			s.emit("joinRoom", {
				roomId: roomId.toUpperCase(),
				isPlayer: true,
				userId: userId
			});
		});

		s.on("disconnect", () => {
			setWsStatus("disconnected");
		});

		s.on("setSide", (data: { side: "sente" | "gote" }) => {
			console.log("[WS] Server setSide:", data.side);
			setMySide(data.side);
		});

		s.on("setSide", (data: { side: "sente" | "gote" }) => {
			console.log("[WS] Server setSide:", data.side);
			setMySide(data.side);
		});

		s.on("roomState", (state: { players: { socketId: string, userId?: string, side: "b" | "w" }[] }) => {
			console.log("[WS] Room state update:", state);
			// 自分のSocketIDを最優先で探し、なければUserIDで探す
			const me = state.players.find((p) => p.socketId === s.id) ||
				state.players.find((p) => userId && p.userId === userId);

			if (me) {
				setMySide(me.side === "b" ? "sente" : "gote");
			} else {
				setMySide("spectator");
			}
		});

		setSocket(s);

		return () => {
			s.disconnect();
		};
	}, [roomId, userId]);

	return (
		<MatchBoard
			roomId={roomId}
			socket={socket}
			wsStatus={wsStatus}
			mySide={mySide}
			isPreparing={wsStatus === "connecting"}
		/>
	);
}
