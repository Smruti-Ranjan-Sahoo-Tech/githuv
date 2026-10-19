# Chat Service

Real-time messaging service for the **Githuv** platform. A Socket.IO server on port **4004** that powers the repo chat in the VS Code extension, with REST endpoints for message sync and persistence to MongoDB.

## Features

- **Real-time rooms** — Join a room by ID, broadcast messages, and receive system notices for joins/leaves
- **JWT-authenticated sockets** — Every connection is verified against `JWT_SERVER_SECREAT` (HS256)
- **Persistent history** — Messages upserted to MongoDB; history replayed on join (latest 500)
- **Local-first friendly** — Messages are broadcast first and persisted even if MongoDB is temporarily down; clients re-sync later
- **Image sharing** — Upload chat images to Cloudinary (jpg, jpeg, png, gif, webp, up to 10 MB)
- **TTL-based expiry** — Undelivered messages expire after ~2 months; delivered messages after 7 days once confirmed
- **Cloudinary cleanup** — Scheduled hourly job deletes stored images 7 days after upload
- **CORS** — Allows `http://localhost:*` and `vscode-webview://` origins

## Getting Started

```bash
bun install
cp .env.example .env   # fill in your credentials
bun run dev            # starts on http://localhost:4004
```

## Environment Variables

Template: `.env.example`

| Variable | Description |
|---|---|
| `MongoDB_URI` | MongoDB connection string |
| `JWT_SERVER_SECREAT` | JWT signing secret (must match `server/.env`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## Socket Events

| Event | Direction | Description |
|---|---|---|
| `joinRoom` | client → server | Join a room; server emits history on `receive-message` |
| `send-message` | client → server | Broadcast a message to the room and persist it |
| `receive-message` | server → client | Deliver a chat or system message |
| `message-delivered` | both | Ack delivery (shortens TTL from 2 months to 7 days) |
| `disconnect` | server | Notifies the room that a user left |

## REST API (`/api`)

| Route | Description |
|---|---|
| `POST /messages/sync` | Bulk upsert client messages to MongoDB (local-first sync) |
| `GET /messages/:roomId` | Full history for a room |
| `GET /messages/:roomId/since` | Incremental pull of messages created after a timestamp |
| `POST /messages/delivered` | Mark message IDs as delivered |
| `DELETE /messages/:roomId` | Delete messages in a room (removes their Cloudinary images) |
| `POST /images/upload` | Upload an image to Cloudinary (returns URL + public id) |

## Project Structure

```
chat-service/
├── index.ts              # Socket.IO + Express entry point
└── src/
    ├── config/           # Cloudinary (multer storage), MongoDB connection
    ├── controller/       # Message persistence, sync, delivery, cleanup
    ├── model/            # Mongoose schema with TTL-based expiry
    └── routes/           # REST sync endpoints
```

## Related Services

- **VS Code extension** — the primary client; connects sockets on `ws://localhost:4004`
- **Githuv server** on port 4002 — issues the JWT used for socket auth
- **MongoDB** — required for message persistence (sockets run without it, but messages won't persist)
- **Cloudinary** — stores shared chat images

See the [root README](../README.md) for full platform setup instructions.