import React from "react";
import { Socket } from "socket.io-client";
import { ConnectionStatus } from "./ConnectionStatus";
import { useExampleWebRTC } from "../hooks/useExampleWebRTC";
import { type Peer } from "@jbatch/webrtc-client";

interface Props {
  roomId: string;
  peers: Peer[];
  currentUserId?: string;
  socket: Socket | null;
}

export const CurrentRoom: React.FC<Props> = ({
  roomId,
  peers,
  currentUserId,
  socket,
}) => {
  const { state, startConnection, sendPing } = useExampleWebRTC(
    socket,
    roomId,
    peers.map((p) => p.id)
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Current Room</h2>
      <div className="mb-4">
        <div className="font-medium">Room ID:</div>
        <div className="text-gray-600 break-all">{roomId}</div>
      </div>

      <div>
        <div className="font-medium mb-2">Connected Peers:</div>
        <div className="space-y-2">
          {peers.map((peer) => (
            <div
              key={peer.id}
              className={`p-3 rounded ${
                peer.id === currentUserId
                  ? "bg-blue-100 border-blue-200"
                  : "bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="truncate">
                  {peer.id === currentUserId ? "You" : peer.id}
                </div>
                <div className="flex items-center gap-2">
                  {peer.isHost && (
                    <span className="text-sm bg-yellow-200 px-2 py-1 rounded">
                      Host
                    </span>
                  )}
                  {peer.disconnected && (
                    <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Reconnecting...
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <h3 className="font-medium mb-2">Peer Connections:</h3>
          {peers
            .filter((peer) => peer.id !== currentUserId)
            .map((peer) => (
              <ConnectionStatus
                key={peer.id}
                peerId={peer.id}
                state={state[peer.id]}
                onStartConnection={startConnection}
                onSendPing={sendPing}
                isDisconnected={peer.disconnected}
              />
            ))}
        </div>
      </div>
    </div>
  );
};
