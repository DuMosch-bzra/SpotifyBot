import { loadTokens, saveTokens } from "./tokenStore.js";

interface TopTracksResponse { 
    items: {
        album: { images: { url: string }[]; };
        artists: { name: string }[];
        name: string;
    }[];
}

export async function getTopTracks(accessToken: string) {

    const response = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=1&offset=0', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${await response.text()}`);
    }
    const data: TopTracksResponse = await response.json();
    return data.items.map(track => ({
        name: track.name,
        artists: track.artists.map(artist => artist.name).join(", "),
        albumImageUrl: track.album.images[0]?.url || ""
    }));
}

interface TokenResponse {
    access_token: string;
    refresh_token?: string;
}

export async function refreshAccessToken() {

    const refreshToken = (await loadTokens())?.refreshToken;
    
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    if (!refreshToken) {
        console.error("No refresh token found. Please log in first.");
        throw new Error("No refresh token found. Please log in first.");
    }

    if (!clientId || !clientSecret) {
        console.error("Missing CLIENT_ID or CLIENT_SECRET in environment variables.");
        throw new Error("Missing CLIENT_ID or CLIENT_SECRET in environment variables.");
    }


    const payload = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64")
    },
    body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    }),
}

    const response = await fetch('https://accounts.spotify.com/api/token', payload);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${await response.text()}`);
    }
    const data: TokenResponse = await response.json();
    if (data.refresh_token && data.refresh_token !== refreshToken) {
        await saveTokens(data.refresh_token);
    }
    return data.access_token;
}
