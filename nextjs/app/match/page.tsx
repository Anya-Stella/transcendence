"use client";

import AiMatchBoard from "@/components/AiMatchBoard";

export default function AiMatchPage() {
	return <AiMatchBoard mySide="sente" aiDepth={6} />;
}