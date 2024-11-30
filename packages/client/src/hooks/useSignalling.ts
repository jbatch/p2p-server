// client/src/hooks/useSignaling.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Room, Peer, ServerStatus, StorageProvider } from "../types";

interface SignalingOptions {
  storage?: StorageProvider;
}

interface ReconnectionState {
  token: string | null;
  lastRoomId: string | null;
  canRejoin: boolean;
}

export const useSignaling = (
  serverUrl: string,
  options: SignalingOptions = {}
) => {
  const storage = options.storage || localStorage;
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [reconnectionState, setReconnectionState] = useState<ReconnectionState>(
    {
      token: storage.getItem("signalingReconnectionToken"),
      lastRoomId: null,
      canRejoin: false,
    }
  );
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(serverUrl, {
      auth: reconnectionState.token
        ? {
            reconnectionToken: reconnectionState.token,
          }
        : undefined,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setReconnectionState((prev) => ({
        ...prev,
        lastRoomId: currentRoom,
      }));
    });

    socket.on("error", ({ message }) => {
      setError(message);
    });

    socket.on("room-created", ({ roomId }) => {
      setCurrentRoom(roomId);
      setPeers([{ id: socket.id!, isHost: true, disconnected: false }]);
    });

    socket.on("room-joined", ({ roomId, peers }) => {
      setCurrentRoom(roomId);
      setPeers(peers);
    });

    socket.on("room-peers-updated", ({ peers }) => {
      setPeers(peers);
    });

    socket.on("peer-joined", ({ peerId }) => {});

    socket.on("peer-left", ({ peerId }) => {
      setPeers((prev) => prev.filter((peer) => peer.id !== peerId));
    });

    socket.on("host-changed", ({ newHostId }) => {
      setPeers((prev) =>
        prev.map((peer) => ({
          ...peer,
          isHost: peer.id === newHostId,
        }))
      );
    });

    socket.on("room-list", ({ rooms }) => {
      setAvailableRooms(rooms);
    });

    socket.on("room-expired", () => {
      setCurrentRoom(null);
      setPeers([]);
      setError("Room expired");
    });

    socket.on("session-created", ({ reconnectionToken }) => {
      storage.setItem("signalingReconnectionToken", reconnectionToken);
      setReconnectionState((prev) => ({
        ...prev,
        token: reconnectionToken,
      }));
    });

    socket.on("reconnection-possible", ({ roomId, gameType }) => {
      setReconnectionState((prev) => ({
        ...prev,
        lastRoomId: roomId,
        canRejoin: true,
      }));
    });

    socket.on("peer-disconnected", ({ peerId, timestamp }) => {
      setPeers((prev) =>
        prev.map((peer) =>
          peer.id === peerId ? { ...peer, disconnected: true } : peer
        )
      );
    });

    socket.on("peer-rejoined", ({ peerId, peers, timestamp }) => {
      setPeers(peers);
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  const createRoom = useCallback((gameType: string, maxClients: number = 2) => {
    socketRef.current?.emit("create-room", { gameType, maxClients });
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit("join-room", { roomId });
  }, []);

  const rejoinRoom = useCallback(() => {
    if (reconnectionState.canRejoin && reconnectionState.lastRoomId) {
      socketRef.current?.emit("rejoin-room", {
        roomId: reconnectionState.lastRoomId,
      });
    }
  }, [reconnectionState.canRejoin, reconnectionState.lastRoomId]);

  const listRooms = useCallback((gameType: string) => {
    socketRef.current?.emit("list-rooms", { gameType });
  }, []);

  const fetchServerStatus = useCallback(async () => {
    try {
      const response = await fetch(`${serverUrl}/health`);
      const status = await response.json();
      setServerStatus(status);
    } catch (err) {
      setError("Failed to fetch server status");
    }
  }, [serverUrl]);

  const clearReconnectionData = useCallback(() => {
    storage.removeItem("signalingReconnectionToken");
    setReconnectionState({
      token: null,
      lastRoomId: null,
      canRejoin: false,
    });
  }, []);

  return {
    isConnected,
    currentRoom,
    peers,
    availableRooms,
    error,
    serverStatus,
    socketId: socketRef.current?.id,
    socket: socketRef.current,
    reconnectionState,
    createRoom,
    joinRoom,
    rejoinRoom,
    listRooms,
    fetchServerStatus,
    clearReconnectionData,
  };
};
