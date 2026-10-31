
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function apiRequest(endpoint, options = {}) {
    if (!API_BASE_URL) {
        throw new Error(
            "Backend URL is missing. Check your client/.env file."
        );
    }

    try {
        const response = await fetch(
            `${API_BASE_URL.replace(/\/$/, "")}${endpoint}`,
            {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                },
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message || `Request failed with status ${response.status}`
            );
        }

        return data;
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error(
                "Unable to connect to the game server. Check your internet connection or backend CORS settings."
            );
        }

        throw error;
    }
}

// Create a new game session
export function startGame(playerName = "Player") {
    return apiRequest("/api/game/start", {
        method: "POST",
        body: JSON.stringify({ playerName }),
    });
}

// Move from INTRODUCTION to VILLAGE_CHOICE
export function continueGame(sessionId) {
    return apiRequest("/api/game/continue", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
    });
}

// Submit the player's major character choice
export function submitChoice(sessionId, selected, rejected) {
    return apiRequest("/api/game/choice", {
        method: "POST",
        body: JSON.stringify({
            sessionId,
            selected,
            rejected,
        }),
    });
}

// Send the player's response to Milo
export function talkToMilo(sessionId, responseId) {
    return apiRequest("/api/game/talk", {
        method: "POST",
        body: JSON.stringify({
            sessionId,
            character: "MILO",
            responseId,
        }),
    });
}

// Send the player's response to The Forgotten
export function respondToForgotten(sessionId, responseId) {
    return apiRequest("/api/game/forgotten", {
        method: "POST",
        body: JSON.stringify({
            sessionId,
            responseId,
        }),
    });
}

// Submit the final ending choice
export function chooseEnding(sessionId, endingChoice) {
    return apiRequest("/api/game/ending", {
        method: "POST",
        body: JSON.stringify({
            sessionId,
            endingChoice,
        }),
    });
}
