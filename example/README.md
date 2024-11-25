# WebRTC Signaling Demo App

A React application demonstrating how to use the WebRTC signaling server and client library. This example shows basic room management, peer connections, and real-time communication between peers.

## Features

- ✨ Room creation and joining
- 👥 Active peer list
- 🔄 Real-time connection status
- 📊 Server health monitoring
- 🎯 Ping functionality between peers
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
│   ├── CurrentRoom.tsx         # Active room management
│   ├── RoomCreator.tsx         # Room creation form
│   ├── RoomList.tsx            # Available rooms display
│   └── ServerInfo.tsx          # Server health stats
├── hooks/                      # Custom React hooks
│   ├── useExampleWebRTC.ts     # WebRTC demo implementation
└── App.tsx                     # Main application component
```

## Key Components

### RoomCreator

- Creates new game rooms
- Configures max players and game type

### RoomList

- Displays available rooms
- Shows player count and join status

### CurrentRoom

- Manages active room state
- Displays connected peers
- Handles WebRTC connections

### ConnectionStatus

- Shows WebRTC connection state
- Displays ICE candidate information
- Provides ping functionality

## Usage Example

To test peer-to-peer communication:

1. Open two browser windows
2. In Window 1: Create a room
3. In Window 2: Join the room from the room list
4. Click "Connect" to establish WebRTC connection
5. Use "PING" button to test connection

## Configuration

The example connects to `http://localhost:3001` by default. To change this:

1. Modify `SIGNALING_SERVER` in `src/App.tsx`
2. Update CORS settings in the server's `.env` if needed

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
