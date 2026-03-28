"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export default function DefeatAnimation() {
    const [animationData, setAnimationData] = useState<any>(null);

    useEffect(() => {
        fetch("https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/lottie.json")
            .then((res) => res.json())
            .then((data) => setAnimationData(data))
            .catch((err) => console.error("Failed to load Lottie animation:", err));
    }, []);

    if (!animationData) return <div style={{ width: "120px", height: "120px", margin: "0 auto", marginBottom: "20px" }} />;

    return (
        <div style={{ width: "120px", height: "120px", margin: "0 auto", marginBottom: "20px" }}>
            <Lottie animationData={animationData} loop={true} />
        </div>
    );
}
