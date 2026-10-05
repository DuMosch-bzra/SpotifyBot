import { writeFile } from "node:fs/promises";

const tokenFile = "tokens.json";

export async function saveTokens(refreshToken: string){
    await writeFile(tokenFile, JSON.stringify({"refreshToken": refreshToken, "savedAt": new Date().toISOString()}));
    console.log("Tokens saved to", tokenFile);
}
