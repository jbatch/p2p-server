// example/src/App.tsx
import React, { useEffect } from "react";
import "./App.css";
import { RoomCreator } from "./components/RoomCreator";
import { RoomList } from "./components/RoomList";
import { CurrentRoom } from "./components/CurrentRoom";
import { ServerInfo } from "./components/ServerInfo";
import { type StorageProvider, useSignaling } from "@jbatch/webrtc-client";

const SIGNALING_SERVER = "http://localhost:3001";

const createStorageProvider = (): StorageProvider => {
  const useSessionStorage = import.meta.env.VITE_USE_SESSION_STORAGE === "true";
  const storage = useSessionStorage ? sessionStorage : localStorage;

  return {
    getItem: (key: string) => storage.getItem(key),
    setItem: (key: string, value: string) => storage.setItem(key, value),
    removeItem: (key: string) => storage.removeItem(key),
  };
};

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
    rejoinRoom,
    socketId,
    socket,
    reconnectionState,
  } = useSignaling(SIGNALING_SERVER, {
    storage: createStorageProvider(),
  });

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
          {reconnectionState.canRejoin && !currentRoom && (
            <div className="mt-4 p-4 bg-yellow-100 rounded">
              <p className="text-yellow-800 mb-2">
                You were previously in room: {reconnectionState.lastRoomId}
              </p>
              <button
                onClick={rejoinRoom}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
              >
                Rejoin Room
              </button>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <ServerInfo status={serverStatus} />

            {!currentRoom && !reconnectionState.canRejoin && (
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
