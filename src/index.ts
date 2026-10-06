import { refreshAccessToken, getTopTrack, SpotifyAuthError } from "./spotify.js";
import { deliverTopTrack, deliverErrorMessage, deliverSpotifyErrorMessage, DiscordWebhookError } from "./deliver.js";

async function main() {
    try {
        const newAccessToken = await refreshAccessToken();
        const topTrack = await getTopTrack(newAccessToken);
        await deliverTopTrack(topTrack);
    } catch (error) {
        console.error("Error:", error);
        if(!(error instanceof DiscordWebhookError)){
            try{
                if(error instanceof SpotifyAuthError){
                    await deliverSpotifyErrorMessage(error);
                } else {
                    await deliverErrorMessage(error);
                }
            }
            catch(deliverError){
                console.error("Failed to deliver error message to Discord:", deliverError);
            }
        }
        process.exitCode = 1;
    }
}

await main();