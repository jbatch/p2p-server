// example/src/hooks/useSignaling.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Room, Peer, ServerStatus } from "../types";

export const useSignaling = (serverUrl: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(serverUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setCurrentRoom(null);
      setPeers([]);
    });

    socket.on("error", ({ message }) => {
      setError(message);
    });

    socket.on("room-created", ({ roomId }) => {
      setCurrentRoom(roomId);
      setPeers([{ id: socket.id!, isHost: true }]);
    });

    socket.on("room-joined", ({ roomId, peers }) => {
      setCurrentRoom(roomId);
      console.log("room-joined", { roomId, peers });
      setPeers(peers);
    });

    // Add handler for the new room-peers-updated event
    socket.on("room-peers-updated", ({ peers }) => {
      setPeers(peers);
    });

    socket.on("peer-joined", ({ peerId }) => {
      console.log(`Peer ${peerId} joined`);
    });

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

  return {
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
    socketId: socketRef.current?.id,
    socket: socketRef.current,
  };
};
