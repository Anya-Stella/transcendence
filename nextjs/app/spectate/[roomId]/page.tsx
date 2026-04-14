"use client";

import MatchBoard from "@/components/MatchBoard";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { PlayerSide } from "@/types/game";

export default function SpectateRoomPage() {
    const params = useParams();
    const roomId = params.roomId as string;

    const [socket, setSocket] = useState<Socket | null>(null);
    const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
    const [mySide, setMySide] = useState<PlayerSide>("spectator");
    const [initialMessages, setInitialMessages] = useState<any[]>([]);

    useEffect(() => {
        const s = io("http://localhost:3001", {
            transports: ["websocket"],
        });

        s.on("connect", () => {
            setWsStatus("connected");
            s.emit("joinRoom", {roomId: roomId,isPlayer:false});
        });

        s.on("roomState", (state: { messages?: any[] }) => {
            if (state.messages) {
                setInitialMessages(state.messages);
            }
        });

        s.on("disconnect", () => setWsStatus("disconnected"));

        setSocket(s);
        return () => { s.disconnect(); };
    }, [roomId]);

    return (
		<MatchBoard
			roomId={roomId}
			socket={socket}
			wsStatus={wsStatus}
			mySide={mySide}
			initialMessages={initialMessages}
		/>
	);
}