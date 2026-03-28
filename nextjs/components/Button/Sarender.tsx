interface Sarender {
    isGameOver: boolean,
    mySide: string,
    clickHandler: () => void;
}

function SarenderButton({ isGameOver, mySide, clickHandler}: Sarender) {
    return (
        <div
            style={{
                position: "fixed",
                bottom: "24px",
                right: "24px",
                display: "flex",
                gap: "12px",
                zIndex: 50,
                pointerEvents: "auto"
            }}
        >
            {!isGameOver && (
                <button
                    style={{
                        padding: "12px 24px",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        border: "2px solid rgba(220, 60, 60, 0.6)",
                        borderRadius: "12px",
                        color: "#fff",
                        background: "rgba(180, 40, 40, 0.7)",
                        backdropFilter: "blur(8px)",
                        cursor: "pointer",
                        boxShadow: "0 4px 16px rgba(180, 40, 40, 0.3)",
                        transition: "all 0.2s ease"
                    }}
                    onClick={clickHandler}
                >
                    {mySide === "spectator" ? "退出する" : "投了する"}
                </button>
            )}
        </div>
    )
}

export default SarenderButton;