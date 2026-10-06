import { refreshAccessToken, getTopTrack } from "./spotify.js";
import { deliverMessage, deliverErrorMessage, DiscordWebhookError } from "./deliver.js";

async function main() {
    try {
        const newAccessToken = await refreshAccessToken();
        const topTrack = await getTopTrack(newAccessToken);
        await deliverMessage(topTrack);
    } catch (error) {
        console.error("Error:", error);
        if(!(error instanceof DiscordWebhookError)){
            try{
                await deliverErrorMessage(error);
            }
            catch(deliverError){
                console.error("Failed to deliver error message to Discord:", deliverError);
            }
        }
        process.exitCode = 1;
    }
}

await main();