# @jbatch/webrtc-client

A React hooks library for easy WebRTC peer-to-peer connections in multiplayer games. Works in conjunction with the [generic WebRTC signaling server](https://github.com/jbatch/p2p-server).

## Installation

```bash
yarn add @jbatch/webrtc-client
```

## Features

- 🎮 Game-agnostic WebRTC connections
- ⚛️ React hooks for easy integration
- 🤝 Peer discovery and signaling
- 🏠 Room management
- 📊 Connection state tracking
- 🔌 Reconnection handling
- 🚀 TypeScript support

## Quick Start

```typescript
import { useSignaling, useWebRTC } from "@jbatch/webrtc-client";

function Game() {
  const {
    // Connection state
    isConnected,
    currentRoom,
    peers,
    socketId,
    reconnectionState,

    // Actions
    createRoom,
    joinRoom,
    rejoinRoom,
    listRooms,
  } = useSignaling("http://your-signaling-server:3001", {
    // Optional: Configure storage for reconnection tokens
    storage: sessionStorage,
  });

  // Handle WebRTC connections
  const { state, startConnection, sendMessage, addMessageHandler } = useWebRTC(
    socket,
    currentRoom,
    peers
  );

  // Optional: Handle reconnection possibilities
  useEffect(() => {
    if (reconnectionState.canRejoin) {
      console.log(`Can rejoin room: ${reconnectionState.lastRoomId}`);
      // rejoinRoom();
    }
  }, [reconnectionState.canRejoin]);
}
```

## API Reference

### useSignaling

Manages connection to the signaling server and room state.

```typescript
const {
  // State
  isConnected: boolean,
  currentRoom: string | null,
  peers: Peer[],
  availableRooms: Room[],
  error: string | null,
  serverStatus: ServerStatus | null,
  socketId: string | undefined,
  socket: Socket | null,
  reconnectionState: ReconnectionState,

  // Actions
  createRoom: (gameType: string, maxClients?: number) => void,
  joinRoom: (roomId: string) => void,
  rejoinRoom: () => void,
  listRooms: (gameType: string) => void,
  fetchServerStatus: () => Promise<void>,
  clearReconnectionData: () => void,
} = useSignaling(serverUrl: string, options?: SignalingOptions);

interface SignalingOptions {
  storage?: StorageProvider;
}

interface StorageProvider {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}
```

### useWebRTC

Manages WebRTC peer connections and data channels.

```typescript
const {
  // State
  state: ConnectionState,

  // Actions
  startConnection: (peerId: string) => void,
  sendMessage: (peerId: string, message: Message) => void,
  addMessageHandler: (handler: MessageHandler) => () => void
} = useWebRTC(
  socket: Socket | null,
  roomId: string | null,
  peers: string[]
);
```

## Types

### Room

```typescript
interface Room {
  id: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: Date;
}
```

### Peer

```typescript
interface Peer {
  id: string;
  isHost: boolean;
  disconnected: boolean;
}
```

### ReconnectionState

```typescript
interface ReconnectionState {
  token: string | null;
  lastRoomId: string | null;
  canRejoin: boolean;
}
```

### Message

```typescript
interface Message {
  type: string;
  [key: string]: any;
}
```

### WebRTCState

```typescript
interface WebRTCState {
  status: "idle" | "connecting" | "connected" | "failed";
  error?: string;
  connectionInfo: {
    localCandidates: number;
    remoteCandidates: number;
    localDescription?: string;
    remoteDescription?: string;
  };
}
```

## Best Practices

1. Error Handling

```typescript
const { error } = useSignaling(serverUrl);

useEffect(() => {
  if (error) {
    // Handle connection errors
    console.error("Signaling error:", error);
  }
}, [error]);
```

2. Connection Management

```typescript
const { peers, currentRoom, socketId } = useSignaling(serverUrl);
const { startConnection } = useWebRTC(socket, currentRoom, peers);

useEffect(() => {
  // Auto-connect to new peers
  peers.forEach((peer) => {
    if (peer.id !== socketId && !peer.disconnected) {
      startConnection(peer.id);
    }
  });
}, [peers]);
```

3. Reconnection Handling

```typescript
const { reconnectionState, rejoinRoom } = useSignaling(serverUrl);

useEffect(() => {
  if (reconnectionState.canRejoin) {
    // Option 1: Auto-rejoin
    rejoinRoom();

    // Option 2: Show user prompt
    const shouldRejoin = window.confirm("Rejoin previous game?");
    if (shouldRejoin) {
      rejoinRoom();
    }
  }
}, [reconnectionState.canRejoin]);
```

4. Message Handling

```typescript
const { addMessageHandler } = useWebRTC(socket, currentRoom, peers);

useEffect(() => {
  return addMessageHandler((peerId, message) => {
    // Handle incoming messages
    console.log(`Message from ${peerId}:`, message);
  });
}, []);
```

## Storage Configuration

By default, reconnection tokens are stored in `localStorage`. You can customize this:

```typescript
// Use sessionStorage instead
const { reconnectionState } = useSignaling(serverUrl, {
  storage: sessionStorage,
});

// Or provide custom storage implementation
const customStorage = {
  getItem: (key) => myStorage.get(key),
  setItem: (key, value) => myStorage.set(key, value),
  removeItem: (key) => myStorage.delete(key),
};

const { reconnectionState } = useSignaling(serverUrl, {
  storage: customStorage,
});
```

## License

MIT License - See [LICENSE](LICENSE) file
