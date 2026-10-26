# SpotifyBot

Posts the album cover of your most-listened-to Spotify track of the last ~4 weeks to a Discord channel.
The idea: you get the cover on your phone and can set it as your Discord profile picture with one click.

> **Status:** works as a one-off script that posts through a Discord webhook.
> A real Discord bot with slash commands (`/topsong`) is the next stage and not built yet.

## How it works

1. `npm run login` runs a one-time Spotify login (OAuth Authorization Code flow) and saves a refresh token to `tokens.json`.
2. `npm start` swaps that refresh token for a short-lived access token, asks Spotify for your #1 track (`time_range=short_term`) and posts the track name, artist(s) and cover to Discord.
3. If anything fails, an error message is posted to the same channel. If the Spotify login has expired, the message says so, so you know to run `npm run login` again.

"Last 4 weeks" is Spotify's rolling `short_term` window, not a calendar month.

## Requirements

- Node.js 22 or newer
- A Spotify **Premium** account (required for Spotify's development mode)
- A Spotify app from the [developer dashboard](https://developer.spotify.com/dashboard) with the redirect URI
  `http://127.0.0.1:8888/callback`
- A Discord webhook for a (private) channel: *Edit Channel → Integrations → Webhooks → New Webhook*

## Setup

```bash
npm install
```

Create a `.env` file in the project root (it's gitignored):

```env
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Then log in once:

```bash
npm run login
```

Open the printed link (it's also posted to Discord), click "Agree" on Spotify, and the refresh token is saved to `tokens.json`.
The login has to be done in a browser on the same machine that runs the script, because Spotify redirects to `127.0.0.1`.

## Usage

```bash
npm start           # fetch the top track and post it to Discord
npm run login       # (re)do the Spotify login
npm run typecheck   # type-check the whole project
```

Always run commands from the project root, because `.env` and `tokens.json` are resolved relative to it.
`npm start` exits with code 1 on failure, so a scheduler (e.g. Windows Task Scheduler) can detect failed runs.

## Project structure

| File | Kind | Purpose |
|---|---|---|
| `src/index.ts` | entry point | Monthly job: refresh token → top track → post to Discord, with error reporting |
| `src/login.ts` | entry point | One-time Spotify login with a local callback server on port 8888 |
| `src/spotify.ts` | module | `refreshAccessToken()`, `getTopTrack()`, `SpotifyAuthError` |
| `src/deliver.ts` | module | Posts messages to the Discord webhook, `DiscordWebhookError` |
| `src/tokenStore.ts` | module | Reads and writes `tokens.json` |
| `playground/` | — | Throwaway learning exercises and manual tests (gitignored) |

Entry points are run directly and do work immediately. Modules only export functions and have no side effects on import.

## Security notes

- Secrets live only in `.env` and `tokens.json`, both gitignored. Never commit or log them.
- Only the `user-top-read` scope is requested.
- The login uses a random `state` value to protect the callback against CSRF.
- The webhook URL works like a password: anyone who has it can post to the channel.
- Discord messages set `allowed_mentions: { parse: [] }`, so track names can't ping anyone.
- If Spotify rotates the refresh token, the new one is saved automatically.

## Roadmap

- [ ] Discord bot with a `/topsong` slash command (discord.js, runs on the home PC/server)
- [ ] Monthly post with catch-up: post as soon as the bot runs if this month hasn't been posted yet
- [ ] Optional: weekly top track (needs polling "recently played" and storing plays in SQLite)
