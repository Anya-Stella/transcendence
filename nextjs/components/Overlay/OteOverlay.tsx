function OteOverlay() {
    return <div
            className="wafuu-pulse"
            style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 100,
                pointerEvents: "none",
                textAlign: "center"
            }}
        >
            <span
                style={{
                    fontSize: "8rem",
                    fontWeight: 900,
                    color: "#000000",
                    textShadow: "0 0 15px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 255, 255, 0.3)",
                    letterSpacing: "0.4em",
                    whiteSpace: "nowrap",
                    filter: "drop-shadow(0 0 10px rgba(0,0,0,0.8))"
                }}
            >
                王手
            </span>
        </div>
}

export default OteOverlay;