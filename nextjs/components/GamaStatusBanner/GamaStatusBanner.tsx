import GameOverDisplay from "./GameOverDisplay";
import OteDisplay from "./OteDisplay";
import TurnDisplay from "./TurnDisplay";

interface GameStatusBanner {
    turnIsSente: boolean,
    isCheck: boolean,
    isGameOver: boolean,
    gameOver: string,
    mySide: string,
    isMyTurn: boolean,
    roomId: string | null,
}

function GameStatusBanner({ turnIsSente, isCheck, isGameOver, gameOver, mySide, isMyTurn, roomId }: GameStatusBanner) {
    return (
        <div style={{
            position: "fixed",
            top: "76px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            zIndex: 50,
            pointerEvents: "auto"
        }}>
            <TurnDisplay turnIsSente={turnIsSente} />

            {isCheck && <OteDisplay/>}

            {isGameOver && <GameOverDisplay gameOver={gameOver}/>}
            
            {roomId && !gameOver && (
                <span style={{ color: "rgba(245, 230, 200, 0.6)", fontSize: "0.9rem", fontWeight: 700 }}>
                    {mySide === "spectator" ? "（観戦中）" : (isMyTurn ? "（あなたの番です）" : "（相手の番です）")}
                </span>
            )}
        </div>
    )
}

export default GameStatusBanner;