interface EnemyInfo {
    mySide: string
}

function EnemyInfo({ mySide }: EnemyInfo) {
    return (<div
            style={{
                position: "fixed",
                top: "76px",
                right: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                zIndex: 50,
                pointerEvents: "auto",
                gap: "12px"
            }}
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(20, 15, 10, 0.7)",
                padding: "8px 16px",
                borderRadius: "24px",
                border: "1px solid rgba(232, 131, 74, 0.25)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 15px rgba(0,0,0,0.4)"
            }}>
                {mySide === "spectator" ? (
                    <span className="board-player-badge badge-gote" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>後手</span>
                ) : mySide === "sente" ? (
                    <>
                        <span style={{ color: "#f5e6c8", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.02em" }}>対戦相手</span>
                        <span className="board-player-badge badge-gote" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>後手</span>
                    </>
                ) : (
                    <>
                        <span className="board-player-badge badge-sente" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>先手</span>
                        <span style={{ color: "#f5e6c8", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.02em" }}>対戦相手</span>
                    </>
                )}
            </div>
        </div>
    )
}

export default EnemyInfo;