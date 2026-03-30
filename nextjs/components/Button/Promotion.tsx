import { Move } from "@torassen/shogi-logic";
import { SetStateAction } from "react";

interface PromotionButton {
    pendingPromotion: {
    id: string;
    move: Move;
    },
    executeMove: (id: string, move: Move) => void,
    setPendingPromotion: (value: SetStateAction<{
    id: string;
    move: Move;
} | null>) => void
}

export default function PromotionButton(props: PromotionButton) {
    return (
        <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "40px",
            borderRadius: "32px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            textAlign: "center",
            minWidth: "300px",
            color: "white",
            animation: "fadeIn 0.3s ease-out"
        }}>
            <h2 style={{
                margin: "0 0 30px 0",
                fontSize: "24px",
                fontWeight: "light",
                letterSpacing: "0.1em",
                textTransform: "uppercase"
            }}>成りますか？</h2>
            <div style={{
                display: "flex",
                gap: "20px",
                justifyContent: "center"
            }}>
                <button
                    onClick={() => {
                        props.executeMove(props.pendingPromotion.id, { ...props.pendingPromotion.move, promote: true });
                        props.setPendingPromotion(null);
                    }}
                    style={{
                        padding: "16px 32px",
                        fontSize: "18px",
                        borderRadius: "16px",
                        border: "none",
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        color: "white",
                        cursor: "pointer",
                        boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.3)",
                        transition: "transform 0.2s, box-shadow 0.2s"
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                    成る
                </button>
                <button
                    onClick={() => {
                        props.executeMove(props.pendingPromotion.id, { ...props.pendingPromotion.move, promote: false });
                        props.setPendingPromotion(null);
                    }}
                    style={{
                        padding: "16px 32px",
                        fontSize: "18px",
                        borderRadius: "16px",
                        border: "none",
                        background: "rgba(255, 255, 255, 0.15)",
                        color: "white",
                        cursor: "pointer",
                        transition: "background 0.2s, transform 0.2s"
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"; }}
                >
                    成らない
                </button>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -40%); }
                    to { opacity: 1; transform: translate(-50%, -50%); }
                }
            `}} />
        </div>
    )
}