interface MyInfo {
    mySide: string
}

function MyInfo({ mySide }: MyInfo) {
    return (
        <div
            style={{
                position: "fixed",
                bottom: "24px",
                left: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
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
                    <span className="board-player-badge badge-sente" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>先手</span>
                ) : mySide === "gote" ? (
                    <>
                        <span style={{ color: "#f5e6c8", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.02em" }}>あなた</span>
                        <span className="board-player-badge badge-gote" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>後手</span>
                    </>
                ) : (
                    <>
                        <span className="board-player-badge badge-sente" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>先手</span>
                        <span style={{ color: "#f5e6c8", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.02em" }}>あなた</span>
                    </>
                )}
            </div>
        </div>
    )
}

export default MyInfo;