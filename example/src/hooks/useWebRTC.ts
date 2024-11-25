// example/src/hooks/useWebRTC.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

interface WebRTCState {
  status: "idle" | "connecting" | "connected" | "failed";
  error?: string;
  connectionInfo: {
    localCandidates: number;
    remoteCandidates: number;
    localDescription?: string;
    remoteDescription?: string;
  };
}

export const useWebRTC = (
  socket: Socket | null,
  roomId: string | null,
  peers: string[]
) => {
  const [state, setState] = useState<Record<string, WebRTCState>>({});
  const connections = useRef<Record<string, RTCPeerConnection>>({});
  const dataChannels = useRef<Record<string, RTCDataChannel>>({});

  // Initialize peer connection
  const initConnection = useCallback(
    (peerId: string) => {
      if (connections.current[peerId]) return;

      console.log(`Initializing connection with peer ${peerId}`);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      // Create data channel
      const channel = pc.createDataChannel(`data-${peerId}`, {
        ordered: true,
      });

      channel.onopen = () => {
        console.log(`Data channel with ${peerId} opened`);
        setState((prev) => ({
          ...prev,
          [peerId]: {
            ...prev[peerId],
            status: "connected" as const,
          },
        }));
      };

      channel.onclose = () => {
        console.log(`Data channel with ${peerId} closed`);
      };

      channel.onmessage = (event) => {
        console.log(`Message from ${peerId}:`, event.data);
      };

      dataChannels.current[peerId] = channel;

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate to", peerId);
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
        console.log(
          `ICE connection state with ${peerId}:`,
          pc.iceConnectionState
        );
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
    [socket]
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
  };
};
