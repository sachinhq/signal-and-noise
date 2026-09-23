# Signal & Noise

A live, room-code trivia showdown for 1–12 players. The host creates a room, shares the four-character code, and starts eight timed questions. Everyone sees the same question, timer, reveal, running scores, and final leaderboard. No accounts or installs.

## Run it

Requires Node.js 18 or newer.

```sh
npm install
npm start
```

Open `http://localhost:3000`. To play across devices on the same network, open the host computer's LAN address on each device. For players outside your network, deploy this Node app to a host that supports WebSockets (for example Render, Railway, or Fly.io). Use the generated public HTTPS URL as the project link.

## Hosting notes

The server serves the complete app and Socket.IO over the same port. Set `PORT` if your provider requires it. `/health` provides a basic health check. Room state lives in memory; rooms are intentionally ephemeral and reset if the server restarts. Keep one server instance unless you add a shared Socket.IO adapter and shared room storage.

## Project submission copy

**Title:** Signal & Noise — A Live Trivia Showdown

**Description:** Bring your group chat into the same room for eight fast, delightfully questionable rounds of trivia. Share a four-letter code, join from any phone or laptop, and race the clock together. No logins, app installs, or awkward icebreakers required—just quick questions, live scorekeeping, surprising facts, and very public bragging rights.

**Cover image:** `outputs/signal-noise-cover.svg`
