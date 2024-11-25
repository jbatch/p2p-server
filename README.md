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

## Extending the WebRTC Hook

The `useWebRTC` hook provides a foundation for peer-to-peer communication. You can extend it to handle custom message types for your specific use case. Here's how to create a custom hook:

### 1. Define Your Message Types

First, define the types for your custom messages:

```typescript
// types.ts
interface BaseMessage {
  type: string;
}

interface GameStateMessage extends BaseMessage {
  type: "GAME_STATE";
  state: {
    score: number;
    position: { x: number; y: number };
  };
}

interface PlayerActionMessage extends BaseMessage {
  type: "PLAYER_ACTION";
  action: string;
  timestamp: number;
}

type GameMessage = GameStateMessage | PlayerActionMessage;
```

### 2. Create a Custom Hook

Create a new hook that wraps `useWebRTC` and handles your specific message types:

```typescript
// useGameConnection.ts
import { useCallback, useEffect } from "react";
import { Socket } from "socket.io-client";
import { useWebRTC } from "./useWebRTC";

export const useGameConnection = (
  socket: Socket | null,
  roomId: string | null,
  peers: string[]
) => {
  const { state, startConnection, sendMessage, addMessageHandler } = useWebRTC(
    socket,
    roomId,
    peers
  );

  // Handle incoming messages
  const handleMessage = useCallback((peerId: string, message: GameMessage) => {
    switch (message.type) {
      case "GAME_STATE":
        // Handle game state update
        console.log(`Received game state from ${peerId}:`, message.state);
        break;
      case "PLAYER_ACTION":
        // Handle player action
        console.log(`Received player action from ${peerId}:`, message.action);
        break;
    }
  }, []);

  // Register message handler
  useEffect(() => {
    return addMessageHandler(handleMessage);
  }, [addMessageHandler, handleMessage]);

  // Custom methods for your game
  const sendGameState = useCallback(
    (peerId: string, state: GameStateMessage["state"]) => {
      sendMessage(peerId, {
        type: "GAME_STATE",
        state,
      });
    },
    [sendMessage]
  );

  const sendPlayerAction = useCallback(
    (peerId: string, action: string) => {
      sendMessage(peerId, {
        type: "PLAYER_ACTION",
        action,
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  return {
    state,
    startConnection,
    sendGameState,
    sendPlayerAction,
  };
};
```

### 3. Use the Custom Hook

Now you can use your custom hook in your game components:

```typescript
// GameComponent.tsx
const Game: React.FC = () => {
  const { state, sendGameState, sendPlayerAction } = useGameConnection(
    socket,
    roomId,
    peers
  );

  const handlePlayerMove = (action: string) => {
    // Send action to all peers
    peers.forEach(peerId => {
      sendPlayerAction(peerId, action);
    });
  };

  const syncGameState = (state: GameState) => {
    // Sync state with all peers
    peers.forEach(peerId => {
      sendGameState(peerId, state);
    });
  };

  return (
    // Your game UI
  );
};
```

### Best Practices

1. **Message Validation**: Always validate incoming messages before processing them:

   ```typescript
   const isGameStateMessage = (message: any): message is GameStateMessage => {
     return (
       message.type === "GAME_STATE" &&
       typeof message.state === "object" &&
       typeof message.state.score === "number"
     );
   };
   ```

2. **Error Handling**: Implement proper error handling for message processing:

   ```typescript
   const handleMessage = useCallback((peerId: string, message: any) => {
     try {
       if (isGameStateMessage(message)) {
         // Handle game state
       } else {
         console.warn(`Unknown message type: ${message.type}`);
       }
     } catch (error) {
       console.error("Error processing message:", error);
     }
   }, []);
   ```

3. **State Management**: Consider using a state management solution for complex games:

   ```typescript
   const [gameState, dispatch] = useReducer(gameReducer, initialState);

   const handleMessage = useCallback((peerId: string, message: GameMessage) => {
     if (message.type === "PLAYER_ACTION") {
       dispatch({
         type: "APPLY_ACTION",
         payload: message.action,
         peerId,
       });
     }
   }, []);
   ```

4. **Message Queuing**: For time-sensitive applications, implement a message queue:

   ```typescript
   const messageQueue = useRef<GameMessage[]>([]);

   useEffect(() => {
     const processQueue = () => {
       while (messageQueue.current.length > 0) {
         const message = messageQueue.current.shift();
         if (message) processMessage(message);
       }
     };

     const interval = setInterval(processQueue, 16); // 60fps
     return () => clearInterval(interval);
   }, []);
   ```

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
