// example/src/hooks/useExampleWebRTC.ts
import { useCallback, useEffect } from "react";
import { Socket } from "socket.io-client";
import {
  type ConnectionState,
  type Message,
  useWebRTC,
} from "@jbatch/webrtc-client";

interface PingMessage extends Message {
  type: "PING";
  timestamp: number;
}

interface UseExampleWebRTCReturn {
  state: ConnectionState;
  startConnection: (peerId: string) => void;
  sendPing: (peerId: string) => void;
}

interface UseExampleWebRTCReturn {
  state: ConnectionState;
  startConnection: (peerId: string) => void;
  sendPing: (peerId: string) => void;
}

export const useExampleWebRTC = (
  socket: Socket | null,
  roomId: string | null,
  peers: string[]
): UseExampleWebRTCReturn => {
  const { state, startConnection, sendMessage, addMessageHandler } = useWebRTC(
    socket,
    roomId,
    peers
  );

  const handleMessage = useCallback((peerId: string, message: Message) => {
    if (message.type === "PING") {
      const pingMessage = message as PingMessage;
      console.log(
        `[useExampleWebRTC] Received PING from ${peerId} sent at ${new Date(pingMessage.timestamp).toISOString()}`
      );

      // Here we could add specific PING handling like:
      // - Updating UI to show last ping time
      // - Sending a PONG response
      // - Calculating latency
    } else {
      console.error("Unhandled message type: ", { message });
    }
  }, []);

  useEffect(() => {
    return addMessageHandler(handleMessage);
  }, [addMessageHandler, handleMessage]);

  const sendPing = useCallback(
    (peerId: string) => {
      console.log(`[useExampleWebRTC] Sending PING to peer ${peerId}`);
      sendMessage(peerId, {
        type: "PING",
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  return {
    state,
    startConnection,
    sendPing,
  };
};
