# Generic WebRTC Signaling Server

A game-agnostic WebRTC signaling server designed to facilitate peer-to-peer connections for multiplayer games and real-time applications. This server handles room management, peer discovery, and WebRTC signaling while remaining completely independent of any specific game logic.

## Features

- 🎮 Game-agnostic design
- 🤝 WebRTC connection facilitation
- 🏠 Room management
- 👥 Dynamic matchmaking
- 🔄 Automatic host migration
- 🔍 Room discovery
- 📊 Health monitoring
- 🚀 Production-ready logging
- ⚡ TypeScript support

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- TypeScript knowledge (for development)

## Installation

```bash
# Clone the repository
git clone https://github.com/jbatch/p2p-server.git

# Navigate to project directory
cd p2p-server

# Install dependencies
yarn install
```

## Configuration

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=*
LOG_LEVEL=debug
MAX_ROOMS=1000
ROOM_TIMEOUT_MS=3600000
```

### Environment Variables

| Variable        | Description                               | Default     |
| --------------- | ----------------------------------------- | ----------- |
| NODE_ENV        | Environment (development/production/test) | development |
| PORT            | Server port                               | 3001        |
| CORS_ORIGIN     | CORS allowed origins                      | \*          |
| LOG_LEVEL       | Logging level (debug/info/warn/error)     | info        |
| MAX_ROOMS       | Maximum number of concurrent rooms        | 1000        |
| ROOM_TIMEOUT_MS | Room timeout in milliseconds              | 3600000     |

## Usage

### Development

```bash
# Start development server with hot reload
yarn dev

# Check types
yarn typecheck

# Lint code
yarn lint

# Format code
yarn format
```

### Production

```bash
# Build project
yarn build

# Start production server
yarn start
```

## API Reference

### Socket.IO Events

#### Client → Server

| Event       | Payload                                     | Description                   |
| ----------- | ------------------------------------------- | ----------------------------- |
| create-room | `{ gameType: string, maxClients?: number }` | Create a new room             |
| join-room   | `{ roomId: string }`                        | Join an existing room         |
| signal      | `{ peerId: string, signal: any }`           | Forward WebRTC signal to peer |
| list-rooms  | `{ gameType: string }`                      | Get list of available rooms   |

#### Server → Client

| Event        | Payload                                | Description              |
| ------------ | -------------------------------------- | ------------------------ |
| room-created | `{ roomId: string, gameType: string }` | Room creation confirmed  |
| peer-joined  | `{ peerId: string }`                   | New peer joined room     |
| peer-left    | `{ peerId: string }`                   | Peer left room           |
| room-joined  | `{ roomId: string, peers: string[] }`  | Successfully joined room |
| room-list    | `{ rooms: Array<RoomInfo> }`           | List of available rooms  |
| error        | `{ message: string }`                  | Error message            |

## Client Integration Example

```typescript
import { io } from "socket.io-client";

// Connect to signaling server
const socket = io("http://localhost:3001");

// Create a new room
socket.emit("create-room", {
  gameType: "your-game-name",
  maxClients: 2,
});

// Listen for room creation
socket.on("room-created", ({ roomId }) => {
  console.log(`Room created: ${roomId}`);
});

// Join existing room
socket.emit("join-room", { roomId: "shared-room-id" });

// Handle peer joining
socket.on("peer-joined", ({ peerId }) => {
  // Initialize WebRTC connection
});

// Forward WebRTC signals
socket.on("signal", ({ peerId, signal }) => {
  // Handle incoming WebRTC signal
});

// Handle errors
socket.on("error", ({ message }) => {
  console.error(`Error: ${message}`);
});
```

## Security

This server implements several security measures:

- Helmet.js for HTTP security headers
- CORS configuration
- Input validation
- Rate limiting (TODO)
- WebSocket authentication (TODO)
