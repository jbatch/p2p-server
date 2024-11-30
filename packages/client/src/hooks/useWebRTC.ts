// client/src/hooks/useWebRTC.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import {
  type ConnectionState,
  type Message,
  type MessageHandler,
} from "../types";

interface UseWebRTCOptions {
  onMessage?: MessageHandler;
}

export const useWebRTC = (
  socket: Socket | null,
  roomId: string | null,
  peers: string[],
  options: UseWebRTCOptions = {}
) => {
  const [state, setState] = useState<ConnectionState>({});
  const connections = useRef<Record<string, RTCPeerConnection>>({});
  const dataChannels = useRef<Record<string, RTCDataChannel>>({});
  const messageHandlers = useRef<Set<MessageHandler>>(new Set());

  const addMessageHandler = useCallback((handler: MessageHandler) => {
    messageHandlers.current.add(handler);
    return () => {
      messageHandlers.current.delete(handler);
    };
  }, []);

  const handleMessage = useCallback((peerId: string, message: Message) => {
    // Call all registered handlers
    messageHandlers.current.forEach((handler) => {
      try {
        handler(peerId, message);
      } catch (error) {
        console.error(`[useWebRTC] Error in message handler:`, error);
      }
    });
  }, []);

  useEffect(() => {
    if (options.onMessage) {
      return addMessageHandler(options.onMessage);
    }
  }, [options.onMessage, addMessageHandler]);

  const sendMessage = useCallback((peerId: string, message: Message) => {
    const channel = dataChannels.current[peerId];
    if (!channel) {
      console.error(`[useWebRTC] No data channel found for peer ${peerId}`);
      return;
    }

    if (channel.readyState !== "open") {
      console.error(
        `[useWebRTC] Data channel for peer ${peerId} is not open`,
        channel.readyState
      );
      return;
    }

    try {
      channel.send(JSON.stringify(message));
    } catch (error) {
      console.error(
        `[useWebRTC] Failed to send message to peer ${peerId}:`,
        error
      );
    }
  }, []);

  // Initialize peer connection
  const initConnection = useCallback(
    (peerId: string) => {
      if (connections.current[peerId]) return;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      const handleDataChannel = (channel: RTCDataChannel) => {
        channel.onopen = () => {
          setState((prev) => ({
            ...prev,
            [peerId]: {
              ...prev[peerId],
              status: "connected" as const,
            },
          }));
        };

        channel.onclose = () => {};

        channel.onerror = (error) => {
          console.error(
            `[useWebRTC] Data channel ${channel.label} error:`,
            error
          );
        };

        channel.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleMessage(peerId, message);
          } catch (error) {
            console.error(
              `[useWebRTC] Failed to parse message from ${peerId}:`,
              error
            );
          }
        };

        dataChannels.current[peerId] = channel;
      };

      // Create data channel
      const channel = pc.createDataChannel(`data-${peerId}`, {
        ordered: true,
      });
      handleDataChannel(channel);

      pc.ondatachannel = (event) => {
        handleDataChannel(event.channel);
      };

      dataChannels.current[peerId] = channel;

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("signal", {
            peerId,
            signal: {
              type: "ice-candidate",
              candidate: event.candidate,
            },
          });

          // Update local candidates count
          setState((prev) => ({
            ...prev,
            [peerId]: {
              ...prev[peerId],
              connectionInfo: {
                ...prev[peerId].connectionInfo,
                localCandidates:
                  (prev[peerId].connectionInfo.localCandidates || 0) + 1,
              },
            },
          }));
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          setState((prev) => ({
            ...prev,
            [peerId]: {
              ...prev[peerId],
              status: "failed",
              error: "ICE connection failed",
            },
          }));
        }
      };

      connections.current[peerId] = pc;
      setState((prev) => ({
        ...prev,
        [peerId]: {
          status: "connecting",
          connectionInfo: {
            localCandidates: 0,
            remoteCandidates: 0,
          },
        },
      }));

      return pc;
    },
    [socket, handleMessage]
  );

  // Start connection process
  const startConnection = useCallback(
    async (peerId: string) => {
      try {
        const pc = initConnection(peerId);
        if (!pc) return;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        setState((prev) => ({
          ...prev,
          [peerId]: {
            ...prev[peerId],
            connectionInfo: {
              ...prev[peerId].connectionInfo,
              localDescription: pc.localDescription?.type,
            },
          },
        }));

        socket?.emit("signal", {
          peerId,
          signal: {
            type: "offer",
            offer,
          },
        });
      } catch (error) {
        console.error("Error starting connection:", error);
        setState((prev) => ({
          ...prev,
          [peerId]: {
            ...prev[peerId],
            status: "failed",
            error: "Failed to create offer",
          },
        }));
      }
    },
    [socket, initConnection]
  );

  // Handle incoming signals
  useEffect(() => {
    if (!socket) return;

    const handleSignal = async ({
      peerId,
      signal,
    }: {
      peerId: string;
      signal: any;
    }) => {
      try {
        let pc = connections.current[peerId];

        if (!pc) {
          const conn = initConnection(peerId);
          if (!conn) {
            return;
          }
          pc = conn;
        }

        if (signal.type === "offer") {
          await pc.setRemoteDescription(signal.offer);
          setState((prev) => ({
            ...prev,
            [peerId]: {
              ...prev[peerId],
              connectionInfo: {
                ...prev[peerId].connectionInfo,
                remoteDescription: "offer",
              },
            },
          }));

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          setState((prev) => ({
            ...prev,
            [peerId]: {
              ...prev[peerId],
              connectionInfo: {
                ...prev[peerId].connectionInfo,
                localDescription: "answer",
              },
            },
          }));

          socket.emit("signal", {
            peerId,
            signal: {
              type: "answer",
              answer,
            },
          });
        } else if (signal.type === "answer") {
          await pc.setRemoteDescription(signal.answer);
          setState((prev) => ({
            ...prev,
            [peerId]: {
              ...prev[peerId],
              connectionInfo: {
                ...prev[peerId].connectionInfo,
                remoteDescription: "answer",
              },
            },
          }));
        } else if (signal.type === "ice-candidate") {
          await pc.addIceCandidate(signal.candidate);
          setState((prev) => ({
            ...prev,
            [peerId]: {
              ...prev[peerId],
              connectionInfo: {
                ...prev[peerId].connectionInfo,
                remoteCandidates:
                  (prev[peerId].connectionInfo.remoteCandidates || 0) + 1,
              },
            },
          }));
        }
      } catch (error) {
        console.error("Error handling signal:", error);
        setState((prev) => ({
          ...prev,
          [peerId]: {
            ...prev[peerId],
            status: "failed",
            error: "Signal handling failed",
          },
        }));
      }
    };

    socket.on("signal", handleSignal);
    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket, initConnection]);

  // Cleanup connections when component unmounts
  useEffect(() => {
    return () => {
      Object.values(connections.current).forEach((pc) => pc.close());
      connections.current = {};
      dataChannels.current = {};
    };
  }, []);

  return {
    state,
    startConnection,
    sendMessage,
    addMessageHandler,
  };
};
