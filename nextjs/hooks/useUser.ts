import { useState, useEffect } from "react"

export function useUser() {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/me")
            .then(res => res.json())
            .then(data => { if (data.user) setUserId(data.user.id); });
    }, []);

    return userId;
}
