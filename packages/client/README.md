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
- 🚀 TypeScript support

## Quick Start

```typescript
import { useSignaling, useWebRTC } from "@jbatch/webrtc-client";

function Game() {
  const { isConnected, currentRoom, peers, createRoom, joinRoom, listRooms } =
    useSignaling("http://your-signaling-server:3001");

  // Handle WebRTC connections
  const { state, startConnection, sendMessage, addMessageHandler } = useWebRTC(
    socket,
    currentRoom,
    peers
  );

  // Your game logic here
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

  // Actions
  createRoom: (gameType: string, maxClients?: number) => void,
  joinRoom: (roomId: string) => void,
  listRooms: (gameType: string) => void,
  fetchServerStatus: () => Promise<void>
} = useSignaling(serverUrl: string);
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
const { peers, currentRoom } = useSignaling(serverUrl);
const { startConnection } = useWebRTC(socket, currentRoom, peers);

useEffect(() => {
  // Auto-connect to new peers
  peers.forEach((peer) => {
    if (peer.id !== socketId) {
      startConnection(peer.id);
    }
  });
}, [peers]);
```

3. Message Handling

```typescript
const { addMessageHandler } = useWebRTC(socket, currentRoom, peers);

useEffect(() => {
  return addMessageHandler((peerId, message) => {
    // Handle incoming messages
    console.log(`Message from ${peerId}:`, message);
  });
}, []);
```

## License

MIT License - See [LICENSE](LICENSE) file
