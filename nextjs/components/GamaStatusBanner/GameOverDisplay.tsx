interface GameOverDisplay {
    gameOver: string
}

function GameOverDisplay({ gameOver }: GameOverDisplay) {
    return (
        <div
            className="game-over-banner"
            style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 24px",
                background: "rgba(232, 131, 74, 0.2)",
                border: "2px solid #e8834a",
                borderRadius: "30px",
                backdropFilter: "blur(10px)",
                boxShadow: "0 0 20px rgba(232, 131, 74, 0.4)",
                animation: "fadeIn 0.5s ease-out"
            }}
        >
            <span style={{ fontSize: "1.2rem", color: "#f5e6c8", fontWeight: 800 }}> {gameOver}</span>
        </div>
    )
}

export default GameOverDisplay;