
interface GameResultProps {
    clickHandler: (show: boolean) => void;
}

function GameResultButton({ clickHandler }: GameResultProps) {
    return (
        <div style={{
            position: "fixed",
            bottom: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            animation: "fadeIn 0.5s ease-out",
            pointerEvents: "auto"
        }}
        >
            <button
                onClick={() => clickHandler(true)}
                style={{
                    padding: "18px 48px",
                    fontSize: "1.25rem",
                    fontWeight: 900,
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "#ffffff",
                    borderRadius: "40px",
                    cursor: "pointer",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)",
                    letterSpacing: "0.2em",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05) translateY(-2px)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                }}
            >
                結果を確認する
            </button>
        </div>
    );
}

export default GameResultButton;