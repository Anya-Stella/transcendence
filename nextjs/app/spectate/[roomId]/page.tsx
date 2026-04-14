"use client";

import MatchBoard from "@/components/MatchBoard";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function SpectateRoomPage() {
    const params = useParams();
    const roomId = params.roomId as string;

    const [socket, setSocket] = useState<Socket | null>(null);
    const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
    const [mySide, setMySide] = useState<"sente" | "gote" | "spectator">("spectator");

    useEffect(() => {
        const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
        const wsUrl = `https://${host}:8080`;

        const s = io(wsUrl);

        s.on("connect", () => {
            setWsStatus("connected");
            s.emit("joinRoom", {roomId: roomId,isPlayer:false});
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
		/>
	);
}