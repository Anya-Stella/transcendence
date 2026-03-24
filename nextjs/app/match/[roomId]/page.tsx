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
    const [mySide, setMySide] = useState<"sente" | "gote" | "spectator">("spectator"); // 観戦者状態も追加
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/me")
            .then((res) => res.json())
            .then((data) => {
                if (data.user) setUserId(data.user.id);
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (!userId && wsStatus === "connecting") return;

        const s = io("http://localhost:3001", {
            transports: ["websocket"],
        });

        s.on("connect", () => {
            setWsStatus("connected");
            s.emit("joinRoom", {
                roomId: roomId,
                isPlayer: true,
                userId: userId
            });
        });

        s.on("disconnect", () => {
            setWsStatus("disconnected");
        });

        s.on("roomState", (state: { players: { socketId: string, userId?: string, side: "b" | "w" }[] }) => {
            const me = state.players.find((p) => 
                (userId && p.userId === userId) || p.socketId === s.id
            );

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
        />
    );
}