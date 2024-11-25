// example/src/components/ServerInfo.tsx
import { type ServerStatus } from "@jbatch/webrtc-client";
import React from "react";

interface Props {
  status: ServerStatus | null;
}

export const ServerInfo: React.FC<Props> = ({ status }) => {
  if (!status) return null;

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0)
      parts.push(`${remainingSeconds}s`);

    return parts.join(" ");
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-bold mb-4">Server Status</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">Status</div>
          <div className="font-medium">
            <span
              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                status.status === "ok" ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            {status.status.toUpperCase()}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Uptime</div>
          <div className="font-medium">{formatUptime(status.uptime)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Active Rooms</div>
          <div className="font-medium">{status.roomCount}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Connected Clients</div>
          <div className="font-medium">{status.clientCount}</div>
        </div>
        <div className="col-span-2">
          <div className="text-sm text-gray-500">Last Update</div>
          <div className="font-medium">{formatTimestamp(status.timestamp)}</div>
        </div>
      </div>
    </div>
  );
};
