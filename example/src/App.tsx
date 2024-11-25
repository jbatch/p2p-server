// example/src/App.tsx
import React, { useEffect } from "react";
import "./App.css";
import { RoomCreator } from "./components/RoomCreator";
import { RoomList } from "./components/RoomList";
import { CurrentRoom } from "./components/CurrentRoom";
import { ServerInfo } from "./components/ServerInfo";
import { useSignaling } from "@jbatch/webrtc-client";

const SIGNALING_SERVER = "http://localhost:3001";

const App: React.FC = () => {
  const {
    isConnected,
    currentRoom,
    peers,
    availableRooms,
    error,
    serverStatus,
    createRoom,
    joinRoom,
    listRooms,
    fetchServerStatus,
    socketId,
    socket,
  } = useSignaling(SIGNALING_SERVER);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        listRooms("demo-game");
        fetchServerStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected, listRooms, fetchServerStatus]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">WebRTC Signaling Demo</h1>
          <div className="text-sm text-gray-600">
            {isConnected ? (
              <span className="text-green-600">Connected (ID: {socketId})</span>
            ) : (
              <span className="text-red-600">Disconnected</span>
            )}
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <ServerInfo status={serverStatus} />

            {!currentRoom && (
              <>
                <RoomCreator onCreateRoom={createRoom} />
                <RoomList rooms={availableRooms} onJoinRoom={joinRoom} />
              </>
            )}
          </div>

          <div>
            {currentRoom && (
              <CurrentRoom
                roomId={currentRoom}
                peers={peers}
                currentUserId={socketId}
                socket={socket}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
