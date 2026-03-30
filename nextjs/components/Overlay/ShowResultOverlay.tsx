import Link from "next/link";
import VictoryAnimation from "./VictoryAnimation";
import DefeatAnimation from "./DefeatAnimation";

interface ShowResultOverlay {
    isWinner: boolean,
    gameResult: string,
    clickHandler: (show: boolean) => void;
}

function ShowResultOverlay({ isWinner, gameResult, clickHandler }:ShowResultOverlay) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(8px)",
                zIndex: 5000,
                animation: "fadeIn 0.3s ease-out"
            }}
            onClick={() => clickHandler(false)}
        >
            <div
                style={{
                    background: "rgba(20, 15, 10, 0.95)",
                    padding: "60px 80px",
                    borderRadius: "32px",
                    border: `2px solid ${isWinner
                        ? "rgba(212, 175, 55, 0.4)"
                        : "rgba(150, 150, 150, 0.2)"}`,
                    boxShadow: `0 0 60px ${isWinner
                        ? "rgba(212, 175, 55, 0.2)"
                        : "rgba(0, 0, 0, 0.3)"}`,
                    textAlign: "center",
                    minWidth: "400px",
                    animation: "resultPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 結果アイコン */}
                <div style={{ fontSize: "5rem", marginBottom: "20px" }}>
                    {isWinner ? <VictoryAnimation /> : <DefeatAnimation />}
                </div>

                {/* 結果テキスト */}
                <h2
                    style={{
                        fontSize: "4.5rem",
                        fontWeight: 900,
                        letterSpacing: "0.2em",
                        color: isWinner ? "#d4af37" : "#888",
                        textShadow: isWinner
                            ? "0 0 40px rgba(212, 175, 55, 0.6)"
                            : "0 0 20px rgba(255, 255, 255, 0.1)",
                        margin: "0 0 24px",
                        fontFamily: "'M PLUS Rounded 1c', sans-serif"
                    }}
                >
                    {isWinner ? "勝利" : "敗北"}
                </h2>

                <p
                    style={{
                        color: "rgba(245, 230, 200, 0.8)",
                        fontSize: "1.2rem",
                        marginBottom: "48px",
                        fontWeight: 500
                    }}
                >
                    {gameResult || "お疲れ様でした。"}
                </p>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px"
                    }}
                >
                    <Link
                        href="/home"
                        style={{
                            padding: "16px 32px",
                            background: isWinner
                                ? "rgba(212, 175, 55, 0.9)"
                                : "rgba(100, 100, 100, 0.8)",
                            color: "#000",
                            borderRadius: "16px",
                            fontWeight: 900,
                            fontSize: "1.1rem",
                            textDecoration: "none",
                            boxShadow: `0 4px 15px ${isWinner
                                ? "rgba(212, 175, 55, 0.4)"
                                : "rgba(0, 0, 0, 0.2)"}`,
                            transition: "all 0.2s"
                        }}
                    >
                        ホームに戻る
                    </Link>
                    <button
                        onClick={() => clickHandler(false)}
                        style={{
                            background: "transparent",
                            border: "2px solid rgba(245, 230, 200, 0.3)",
                            color: "rgba(245, 230, 200, 0.7)",
                            padding: "12px 24px",
                            borderRadius: "16px",
                            cursor: "pointer",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            transition: "all 0.2s"
                        }}
                    >
                        盤面を振り返る
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ShowResultOverlay;