import type { TopTrack } from "./spotify.js";

export class DiscordWebhookError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DiscordWebhookError";
    }
}

export async function deliverMessage(track: TopTrack) {

    const message = {
        content: `Top Track of the last 4 weeks: **${track.name}** by **${track.artists}**`,
        allowed_mentions: { parse: [] },
        embeds: [
            {
                image: {
                    url: track.albumImageUrl
                }
            }
        ]
    };

    await postMessageToDiscord(message);
}

export async function deliverErrorMessage(error: unknown) {

    const message = {
        content: `An error occurred: ${error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300)}`,
        allowed_mentions: { parse: [] }
    };

    await postMessageToDiscord(message);

}

interface DiscordMessage {
    content: string;
    allowed_mentions?: { parse: string[] };
    embeds?: { image: { url: string } }[];
}

async function postMessageToDiscord(message: DiscordMessage) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        throw new DiscordWebhookError("Missing DISCORD_WEBHOOK_URL in environment variables.");
    }

    try{
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(message)
        });

        if(!response.ok){
            throw new DiscordWebhookError(`Failed to send message to Discord. HTTP status: ${response.status} ${await response.text()}`);
        }

    }   
    catch(error){
        throw new DiscordWebhookError(`Failed to send message to Discord: ${error}`);
    }
}