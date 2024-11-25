// example/src/components/RoomList.tsx
import React from "react";
import { Room } from "../types";

interface Props {
  rooms: Room[];
  onJoinRoom: (roomId: string) => void;
}

export const RoomList: React.FC<Props> = ({ rooms, onJoinRoom }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Available Rooms</h2>
      {rooms.length === 0 ? (
        <p className="text-gray-500">No rooms available</p>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="border p-4 rounded flex justify-between items-center"
            >
              <div>
                <div className="font-medium">Room {room.id.slice(0, 8)}</div>
                <div className="text-sm text-gray-500">
                  Players: {room.playerCount}/{room.maxPlayers}
                </div>
              </div>
              <button
                onClick={() => onJoinRoom(room.id)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={room.playerCount >= room.maxPlayers}
              >
                Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
