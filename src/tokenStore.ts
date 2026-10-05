import { writeFile, readFile } from "node:fs/promises";

const tokenFile = "tokens.json";

export async function saveTokens(refreshToken: string){
    await writeFile(tokenFile, JSON.stringify({"refreshToken": refreshToken, "savedAt": new Date().toISOString()}));
    console.log("Tokens saved to", tokenFile);
}

export async function loadTokens(): Promise<{refreshToken: string, savedAt: string} | null> {   
    try{
        const data = await readFile(tokenFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return null;
        }
        throw error;
    }
}
