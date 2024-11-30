import { type WebRTCState } from "@jbatch/webrtc-client";
import React from "react";

interface Props {
  peerId: string;
  state?: WebRTCState;
  onStartConnection: (peerId: string) => void;
  onSendPing?: (peerId: string) => void;
  isDisconnected?: boolean;
}

export const ConnectionStatus: React.FC<Props> = ({
  peerId,
  state,
  onStartConnection,
  onSendPing,
  isDisconnected,
}) => {
  const getStatusColor = (status?: string) => {
    if (isDisconnected) return "bg-yellow-500";
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handlePingClick = () => {
    console.log("Sending ping to peer:", peerId);
    onSendPing?.(peerId);
  };

  return (
    <div className="border rounded p-4 mb-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div
            className={`w-2 h-2 rounded-full ${getStatusColor(state?.status)} mr-2`}
          />
          <span className="font-medium">
            Peer {peerId.slice(0, 8)}
            {isDisconnected && " (Temporarily Disconnected)"}
          </span>
        </div>
        <div className="flex gap-2">
          {(!state || state.status === "idle") && !isDisconnected && (
            <button
              onClick={() => onStartConnection(peerId)}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Connect
            </button>
          )}
          {state?.status === "connected" && !isDisconnected && (
            <button
              onClick={handlePingClick}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              PING
            </button>
          )}
        </div>
      </div>

      {state && (
        <div className="text-sm text-gray-600">
          <div>
            Status: {isDisconnected ? "Temporarily Disconnected" : state.status}
          </div>
          {state.connectionInfo && (
            <>
              <div>
                Local Candidates: {state.connectionInfo.localCandidates}
              </div>
              <div>
                Remote Candidates: {state.connectionInfo.remoteCandidates}
              </div>
              {state.connectionInfo.localDescription && (
                <div>
                  Local Description: {state.connectionInfo.localDescription}
                </div>
              )}
              {state.connectionInfo.remoteDescription && (
                <div>
                  Remote Description: {state.connectionInfo.remoteDescription}
                </div>
              )}
            </>
          )}
          {state.error && (
            <div className="text-red-500">Error: {state.error}</div>
          )}
        </div>
      )}
    </div>
  );
};
