import http from "node:http";
import { saveTokens } from "./tokenStore.js";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const expectedState = crypto.randomUUID();
const redirectUri = "http://127.0.0.1:8888/callback";

if (!clientId || !clientSecret) {
  console.error("Missing CLIENT_ID or CLIENT_SECRET in environment variables.");
  process.exit(1);
}

const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "user-top-read",
    state: expectedState
});

const authorizeUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;


const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1:8888");

    //check for callback url
    if (url.pathname !== "/callback") {
        res.writeHead(404).end("Not found");
        return;
    }

    //check for error (Happens when user press "Cancel" on the Spotify login page)
    const error = url.searchParams.get("error");
    if (error) {
        res.writeHead(400).end(`Error: ${error}`);
        console.log("Got an error:", error);
        return;
    }

    //search the url for the access code and state
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
        res.writeHead(400).end(`No code found`);
        console.log("No code found");
        return;
    }
    
    if(state !== expectedState) {
        res.writeHead(400).end(`State mismatch`);
        console.log("State mismatch:", state);
        return;
    }

    try {
        const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64")
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code: code,
                redirect_uri: redirectUri
            })
        });

        if (!tokenResponse.ok) {
            throw new Error(`Failed to fetch token: ${tokenResponse.status} ${await tokenResponse.text()}`);
        }

        const tokenData: TokenResponse = await tokenResponse.json();

        await saveTokens(tokenData.refresh_token);

    } catch (error) {
        console.error("Error fetching token:", error);
        res.writeHead(502).end("Error fetching token");
        return;
    }

    res.writeHead(200).end(`Authorization code received. You can close this window.`);
    server.close(() => {
        console.log("Server closed");
    });
});

server.listen(8888, () => {
  console.log(`Open ${authorizeUrl}`);
});