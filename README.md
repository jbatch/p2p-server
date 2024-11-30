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
- 🔌 Reconnection handling

## Getting Started

### Server Setup

1. Prerequisites:

   - Node.js >= 18.0.0
   - npm or yarn
   - TypeScript knowledge (for development)

2. Installation:

```bash
# Clone the repository
git clone https://github.com/jbatch/p2p-server.git

# Navigate to project directory
cd p2p-server

# Install dependencies
yarn install
```

### Client Integration

1. Install the client package in your game project:

```bash
yarn add @jbatch/webrtc-client
```

2. Basic usage:

```typescript
import { useWebRTC, useSignaling } from "@jbatch/webrtc-client";

function GameComponent() {
  const {
    isConnected,
    currentRoom,
    peers,
    availableRooms,
    error,
    createRoom,
    joinRoom,
    listRooms,
    reconnectionState,
    rejoinRoom,
  } = useSignaling("http://your-signaling-server:3001");

  const { state, startConnection, sendMessage, addMessageHandler } = useWebRTC(
    socket,
    roomId,
    peers
  );

  // Handle reconnection
  useEffect(() => {
    if (reconnectionState.canRejoin) {
      rejoinRoom();
    }
  }, [reconnectionState.canRejoin]);

  // Your game logic here
}
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

## Handling Disconnects and Reconnection

The server implements a robust reconnection system that allows players to seamlessly rejoin their game session after temporary disconnections (e.g., network issues, browser refresh).

### Key Features

- 60-second reconnection window
- Automatic session tracking
- Seamless state recovery
- Host migration during disconnects
- Peer status updates

### How it Works

1. When a client first connects, they receive a unique reconnection token
2. If disconnected, clients have 60 seconds to reconnect using their token
3. During disconnection, the client's spot in the room is reserved
4. Other peers are notified of the disconnection status
5. When reconnecting, if their previous session is valid:
   - Client receives a `reconnection-possible` event with their previous room info
   - Client can choose to rejoin using `rejoinRoom()`
   - Other peers are notified when the client rejoins

### Client Implementation

```typescript
const { reconnectionState, rejoinRoom } = useSignaling(
  "http://your-signaling-server:3001",
  {
    // Optional: Use sessionStorage instead of localStorage for tokens
    storage: sessionStorage,
  }
);

// Handle reconnection
useEffect(() => {
  if (reconnectionState.canRejoin) {
    rejoinRoom();
  }
}, [reconnectionState.canRejoin]);
```

## API Reference

### Socket.IO Events

#### Client → Server

| Event       | Payload                                     | Description                   |
| ----------- | ------------------------------------------- | ----------------------------- |
| create-room | `{ gameType: string, maxClients?: number }` | Create a new room             |
| join-room   | `{ roomId: string }`                        | Join an existing room         |
| rejoin-room | `{ roomId: string }`                        | Rejoin after disconnection    |
| signal      | `{ peerId: string, signal: any }`           | Forward WebRTC signal to peer |
| list-rooms  | `{ gameType: string }`                      | Get list of available rooms   |

#### Server → Client

| Event                 | Payload                                 | Description                   |
| --------------------- | --------------------------------------- | ----------------------------- |
| room-created          | `{ roomId: string, gameType: string }`  | Room creation confirmed       |
| peer-joined           | `{ peerId: string }`                    | New peer joined room          |
| peer-left             | `{ peerId: string }`                    | Peer left room                |
| peer-disconnected     | `{ peerId: string, timestamp: number }` | Peer temporarily disconnected |
| peer-rejoined         | `{ peerId: string, peers: Peer[] }`     | Peer reconnected to room      |
| room-joined           | `{ roomId: string, peers: Peer[] }`     | Successfully joined room      |
| room-list             | `{ rooms: Array<RoomInfo> }`            | List of available rooms       |
| session-created       | `{ reconnectionToken: string }`         | New session token issued      |
| reconnection-possible | `{ roomId: string, gameType: string }`  | Reconnection available        |
| room-peers-updated    | `{ peers: Peer[] }`                     | Updated list of room peers    |
| error                 | `{ message: string }`                   | Error message                 |

## Security

This server implements several security measures:

- Helmet.js for HTTP security headers
- CORS configuration
- Input validation
- Rate limiting (TODO)
- WebSocket authentication (TODO)

## Example Implementation

Check out the [example](example) directory for a complete implementation showing how to:

- Create and join rooms
- Establish WebRTC connections
- Handle peer connections
- Send and receive messages
- Implement reconnection handling

## License

MIT License - see the [LICENSE](LICENSE) file for details.
