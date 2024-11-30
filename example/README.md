# WebRTC Signaling Demo App

A React application demonstrating how to use the WebRTC signaling server and client library. This example shows basic room management, peer connections, and real-time communication between peers.

## Features

- ✨ Room creation and joining
- 👥 Active peer list
- 🔄 Real-time connection status
- 📊 Server health monitoring
- 🎯 Ping functionality between peers
- 🔌 Reconnection handling
- 💅 Styled with Tailwind CSS

## Getting Started

1. Make sure the signaling server is running (see main README)

2. Install dependencies:

```bash
yarn install
```

3. Start the development server:

```bash
yarn dev
```

4. Open multiple browser windows to `http://localhost:3000` to test peer connections

## Project Structure

```
src/
├── components/                 # React components
│   ├── ConnectionStatus.tsx    # WebRTC connection status display
│   ├── CurrentRoom.tsx        # Active room management
│   ├── RoomCreator.tsx        # Room creation form
│   ├── RoomList.tsx           # Available rooms display
│   └── ServerInfo.tsx         # Server health stats
├── hooks/                     # Custom React hooks
│   ├── useExampleWebRTC.ts    # WebRTC demo implementation
└── App.tsx                    # Main application component
```

## Key Components

### App

- Manages global connection state
- Handles reconnection logic
- Displays reconnection prompts
- Shows connection status and errors

### RoomCreator

- Creates new game rooms
- Configures max players and game type

### RoomList

- Displays available rooms
- Shows player count and join status

### CurrentRoom

- Manages active room state
- Displays connected peers
- Shows peer connection and disconnect status
- Handles WebRTC connections

### ConnectionStatus

- Shows WebRTC connection state
- Displays ICE candidate information
- Shows peer disconnect status
- Provides ping functionality

## Testing Reconnection

To test the reconnection functionality:

1. Create or join a room
2. Try these scenarios:
   - Refresh the browser page
   - Temporarily disable your network connection
   - Open Dev Tools → Network → toggle "Offline" mode
3. When reconnecting:
   - You'll see a yellow banner if rejoining is possible
   - Click "Rejoin Room" to return to your previous session
   - Other peers will see your status update from "Reconnecting..." to active

## Usage Example

To test peer-to-peer communication:

1. Open two browser windows
2. In Window 1: Create a room
3. In Window 2: Join the room from the room list
4. Click "Connect" to establish WebRTC connection
5. Use "PING" button to test connection
6. Try disconnecting and reconnecting in either window

## Handling Disconnects

The example demonstrates several disconnect scenarios:

1. Temporary Disconnects

   - Peers show "Reconnecting..." status
   - Connection controls are disabled
   - WebRTC state is preserved

2. Permanent Disconnects

   - Peer is removed after 60-second timeout
   - Host migration if needed
   - Room cleanup if empty

3. Manual Refresh/Navigation
   - Reconnection token stored in localStorage
   - Option to rejoin previous room
   - State recovery on rejoin

## Configuration

The example connects to `http://localhost:3001` by default. To change this:

1. Modify `SIGNALING_SERVER` in `src/App.tsx`
2. Update CORS settings in the server's `.env` if needed

You can also configure the storage mechanism:

```typescript
// In App.tsx
const storageProvider = {
  useSessionStorage: true, // Use sessionStorage instead of localStorage
};
```

## Troubleshooting

1. Connection Issues

   - Check that the signaling server is running
   - Verify CORS settings
   - Check browser console for errors

2. Peer Connection Failed

   - Ensure both peers are in the same room
   - Check ICE candidate generation
   - Verify network connectivity

3. Room Creation Failed

   - Check server logs for validation errors
   - Verify room limits haven't been reached

4. Reconnection Issues
   - Verify reconnection token is stored correctly
   - Check if within 60-second reconnection window
   - Confirm room still exists on server
   - Look for connection errors in console
