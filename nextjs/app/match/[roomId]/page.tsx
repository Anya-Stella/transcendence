"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import MatchBoard from "@/components/MatchBoard";
import { useUser } from "@/hooks/useUser";
import { PlayerSide } from "@/types/game";

export default function OnlineMatchPage() {
	const params = useParams();
	const roomId = params.roomId as string;
	const [socket, setSocket] = useState<Socket | null>(null);
	const [wsStatus, setWsStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
	const [mySide, setMySide] = useState<PlayerSide>("spectator");
	const [initialMessages, setInitialMessages] = useState<any[]>([]);
	const userId = useUser();

	useEffect(() => {
		const s = getSocket();
		setSocket(s);

		const onConnect = () => {
			// console.log("[WS] Connected. ID:", s.id);
			setWsStatus("connected");
			s.emit("joinRoom", {
				roomId: roomId,
				isPlayer: true,
				userId: userId
			});
		};

		if (s.connected) {
			onConnect();
		} else {
			s.on("connect", onConnect);
		}

		const onDisconnect = () => {
			setWsStatus("disconnected");
		};

		const onRoomState = (state: { players: { socketId: string, userId?: string, side: "b" | "w" }[], messages?: any[] }) => {
			// console.log("[WS] Room state update:", state);
			if (state.messages) {
				setInitialMessages(state.messages);
			}
			const me = state.players.find((p) =>
				(userId && p.userId === userId) || p.socketId === s.id
			);
			if (me) {
				setMySide(me.side === "b" ? "sente" : "gote");
			} else {
				setMySide("spectator");
			}
		};

		s.on("disconnect", onDisconnect);
		s.on("roomState", onRoomState);

		return () => {
			// s.disconnect(); を削除
			s.off("connect", onConnect);
			s.off("disconnect", onDisconnect);
			s.off("roomState", onRoomState);
		};
	}, [roomId, userId]);

	return (
		<MatchBoard
			roomId={roomId}
			socket={socket}
			wsStatus={wsStatus}
			mySide={mySide}
			isPreparing={wsStatus === "connecting"}
			initialMessages={initialMessages}
		/>
	);
}
