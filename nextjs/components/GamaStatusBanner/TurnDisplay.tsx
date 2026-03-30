interface TurnDisplayProps {
    turnIsSente: boolean;
}

function TurnDisplay({ turnIsSente }: TurnDisplayProps) {
    return <span    
                style={{
                    padding: "10px 28px",
                    borderRadius: "30px",
                    fontSize: "1.05rem",
                    letterSpacing: "0.1em",
                    fontWeight: 900,
                    background: "rgba(20, 15, 10, 0.8)",
                    color: turnIsSente ? "#e8834a" : "#6495ed",
                    border: `2px solid ${turnIsSente ? "rgba(232, 131, 74, 0.8)" : "rgba(100, 149, 237, 0.8)"}`,
                    boxShadow: `0 0 15px ${turnIsSente ? "rgba(232, 131, 74, 0.3)" : "rgba(100, 149, 237, 0.3)"}, inset 0 0 8px rgba(255, 255, 255, 0.05)`,
                    backdropFilter: "blur(12px)",
                    textShadow: `0 0 10px ${turnIsSente ? "rgba(232, 131, 74, 0.4)" : "rgba(100, 149, 237, 0.4)"}`
                }}
            >
                {turnIsSente ? "▲ 先手の番" : "△ 後手の番"}
            </span>
}

export default TurnDisplay; 