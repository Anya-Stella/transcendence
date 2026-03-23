"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import MatchBoard from "@/components/MatchBoard";

export default function OnlineMatchPage() {
	const params = useParams();
	const roomId = params.roomId as string;
	const [socket, setSocket] = useState<Socket | null>(null);
	const [wsStatus, setWsStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
	const [mySide, setMySide] = useState<"sente" | "gote" | null>(null);

	useEffect(() => {
		// Use current host for WebSocket connection
		const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
		const wsUrl = `http://${host}:3001`;
		
		const s = io(wsUrl, {
			transports: ["websocket"],
		});

		// Consolidated room state handler
		s.on("roomState", (state: { players: { socketId: string, side?: "b" | "w" }[] }) => {
			console.log("[WS] Room state update:", state);
			const me = state.players.find((p) => p.socketId === s.id);
			if (me && me.side) {
				setMySide(me.side === "b" ? "sente" : "gote");
			}
		});

		s.on("setSide", (data: { side: "sente" | "gote" }) => {
			console.log("[WS] Server setSide:", data.side);
			setMySide(data.side);
		});

		s.on("connect", () => {
			console.log("[WS] Connected. ID:", s.id);
			setWsStatus("connected");
			s.emit("joinRoom", { roomId });
		});

		s.on("disconnect", () => {
			setWsStatus("disconnected");
		});

		setSocket(s);

		return () => {
			s.disconnect();
		};
	}, [roomId]);

	return (
		<MatchBoard
			roomId={roomId}
			socket={socket}
			wsStatus={wsStatus}
			mySide={mySide || "sente"}
			isPreparing={!mySide}
		/>
	);
}
