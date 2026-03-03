"use client";

import { useParams } from "next/navigation";
import MatchBoard from "@/components/MatchBoard";

export default function OnlineMatchPage() {
	const params = useParams();
	const roomId = params.roomId as string;

	return <MatchBoard roomId={roomId} />;
}
