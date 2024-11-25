// example/src/components/ConnectionStatus.tsx
import React from "react";
import { WebRTCState } from "../types";

interface Props {
  peerId: string;
  state?: WebRTCState;
  onStartConnection: (peerId: string) => void;
}

export const ConnectionStatus: React.FC<Props> = ({
  peerId,
  state,
  onStartConnection,
}) => {
  const getStatusColor = (status?: string) => {
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

  return (
    <div className="border rounded p-4 mb-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div
            className={`w-2 h-2 rounded-full ${getStatusColor(state?.status)} mr-2`}
          />
          <span className="font-medium">Peer {peerId.slice(0, 8)}</span>
        </div>
        {(!state || state.status === "idle") && (
          <button
            onClick={() => onStartConnection(peerId)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Connect
          </button>
        )}
      </div>

      {state && (
        <div className="text-sm text-gray-600">
          <div>Status: {state.status}</div>
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
