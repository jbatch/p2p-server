// src/server/socket-handlers.ts
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { Room, SignalingServer } from "../types";
import { logger } from "../utils/logger";
import { config } from "../config";

interface CreateRoomPayload {
  gameType: string;
  maxClients?: number;
}

interface JoinRoomPayload {
  roomId: string;
}

interface SignalPayload {
  peerId: string;
  signal: any;
}

interface ListRoomsPayload {
  gameType: string;
}

export const createSocketHandlers = (io: Server, server: SignalingServer) => {
  const RECONNECTION_WINDOW_MS = 60000; // 1 minute to reconnect
  const cleanupRoom = (roomId: string) => {
    const room = server.rooms.get(roomId);
    if (!room) return;

    // Remove all clients from the room
    room.clients.forEach((clientId) => {
      server.clientToRoom.delete(clientId);
    });

    // Delete the room
    server.rooms.delete(roomId);
    logger.info({ roomId }, "Room cleaned up");
  };

  const handleConnection = (socket: Socket) => {
    const reconnectionToken = socket.handshake.auth.reconnectionToken;

    if (reconnectionToken) {
      // Find existing session by reconnection token
      const existingSession = Array.from(server.clientSessions.values()).find(
        (session) => session.reconnectionToken === reconnectionToken
      );

      if (existingSession) {
        // Update the session with the new socket ID
        const oldSocketId = existingSession.id;
        existingSession.id = socket.id;
        existingSession.lastSeen = new Date();
        server.clientSessions.delete(oldSocketId);
        server.clientSessions.set(socket.id, existingSession);

        // If they were in a room, notify them
        if (existingSession.roomId) {
          const room = server.rooms.get(existingSession.roomId);
          if (room) {
            socket.emit("reconnection-possible", {
              roomId: existingSession.roomId,
              gameType: room.gameType,
              timestamp: Date.now(),
            });
          }
        }
      }
    }

    // Create new session
    if (!server.clientSessions.has(socket.id)) {
      server.clientSessions.set(socket.id, {
        id: socket.id,
        roomId: null,
        lastSeen: new Date(),
        reconnectionToken: uuidv4(),
      });

      // Send the reconnection token to the client
      socket.emit("session-created", {
        reconnectionToken: server.clientSessions.get(socket.id)
          ?.reconnectionToken,
      });
    }
  };

  const handleCreateRoom = (
    socket: Socket,
    { gameType, maxClients = 2 }: CreateRoomPayload
  ) => {
    try {
      // Validate input
      if (!gameType || typeof gameType !== "string") {
        throw new Error("Invalid gameType");
      }

      if (server.rooms.size >= Number(config.MAX_ROOMS)) {
        throw new Error("Maximum number of rooms reached");
      }

      const roomId = uuidv4();
      const room: Room = {
        id: roomId,
        gameType,
        hostId: socket.id,
        clients: new Set([socket.id]),
        maxClients,
        createdAt: new Date(),
        disconnectedClients: new Map(),
      };

      server.rooms.set(roomId, room);
      server.clientToRoom.set(socket.id, roomId);
      const existingSession = server.clientSessions.get(socket.id);
      if (existingSession) {
        existingSession.roomId = roomId;
      }
      socket.join(roomId);

      // Schedule room cleanup after timeout
      setTimeout(() => {
        if (server.rooms.has(roomId)) {
          cleanupRoom(roomId);
          io.to(roomId).emit("room-expired");
        }
      }, Number(config.ROOM_TIMEOUT_MS));

      socket.emit("room-created", { roomId, gameType });
      logger.info({ roomId, gameType, clientId: socket.id }, "Room created");
    } catch (error) {
      logger.error({ error, clientId: socket.id }, "Failed to create room");
      socket.emit("error", {
        message:
          error instanceof Error ? error.message : "Failed to create room",
      });
    }
  };

  const handleJoinRoom = (socket: Socket, { roomId }: JoinRoomPayload) => {
    try {
      const room = server.rooms.get(roomId);

      if (!room) {
        throw new Error("Room not found");
      }

      if (room.clients.size >= room.maxClients) {
        throw new Error("Room is full");
      }

      if (room.clients.has(socket.id)) {
        throw new Error("Already in room");
      }

      // Add the new client to the room BEFORE sending any notifications
      room.clients.add(socket.id);
      server.clientToRoom.set(socket.id, roomId);
      const existingSession = server.clientSessions.get(socket.id);
      if (existingSession) {
        existingSession.roomId = roomId;
      }
      socket.join(roomId);

      // Get the list of peers (including the new joiner)
      const allPeers = Array.from(room.clients).map((id) => ({
        id,
        isHost: id === room.hostId,
        disconnected: room.disconnectedClients.get(id) !== undefined,
      }));

      // Send the complete peer list to everyone in the room
      io.to(roomId).emit("room-peers-updated", {
        peers: allPeers,
        timestamp: Date.now(),
      });

      // Additionally send specific events
      socket.to(roomId).emit("peer-joined", {
        peerId: socket.id,
        timestamp: Date.now(),
      });

      socket.emit("room-joined", {
        roomId,
        peers: allPeers,
        isHost: false,
        timestamp: Date.now(),
      });

      logger.info({ roomId, clientId: socket.id }, "Client joined room");
    } catch (error) {
      logger.error(
        { error, clientId: socket.id, roomId },
        "Failed to join room"
      );
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to join room",
      });
    }
  };

  const handleSignal = (socket: Socket, { peerId, signal }: SignalPayload) => {
    try {
      const roomId = server.clientToRoom.get(socket.id);
      if (!roomId) {
        throw new Error("Client not in a room");
      }

      const room = server.rooms.get(roomId);
      if (!room || !room.clients.has(peerId)) {
        throw new Error("Invalid peer");
      }

      // Forward the signal to the specific peer
      io.to(peerId).emit("signal", {
        peerId: socket.id,
        signal,
        timestamp: Date.now(),
      });

      logger.debug({ from: socket.id, to: peerId, roomId }, "Signal forwarded");
    } catch (error) {
      logger.error({ error, clientId: socket.id }, "Failed to forward signal");
      socket.emit("error", {
        message:
          error instanceof Error ? error.message : "Failed to forward signal",
      });
    }
  };

  const handleListRooms = (socket: Socket, { gameType }: ListRoomsPayload) => {
    try {
      const availableRooms = Array.from(server.rooms.values())
        .filter(
          (room) =>
            room.gameType === gameType && room.clients.size < room.maxClients
        )
        .map((room) => ({
          id: room.id,
          playerCount: room.clients.size,
          maxPlayers: room.maxClients,
          createdAt: room.createdAt,
        }));

      socket.emit("room-list", { rooms: availableRooms });
      logger.debug(
        { gameType, roomCount: availableRooms.length },
        "Room list sent"
      );
    } catch (error) {
      logger.error({ error, clientId: socket.id }, "Failed to list rooms");
      socket.emit("error", { message: "Failed to list rooms" });
    }
  };

  const handleDisconnect = (socket: Socket) => {
    try {
      const roomId = server.clientToRoom.get(socket.id);
      if (!roomId) return;

      const room = server.rooms.get(roomId);
      if (!room) return;

      // Instead of immediately removing the client, mark them as disconnected
      room.clients.delete(socket.id);

      // Set up reconnection window
      const timeoutHandler = setTimeout(() => {
        // If client hasn't reconnected within window, clean up fully
        room.disconnectedClients.delete(socket.id);
        server.clientToRoom.delete(socket.id);
        server.clientSessions.delete(socket.id);

        logger.info("Client reconnect timeout expired");

        // Update other players
        const allPeers = Array.from(room.clients).map((id) => ({
          id,
          isHost: id === room.hostId,
          disconnected: room.disconnectedClients.get(id) !== undefined,
        }));
        io.to(roomId).emit("room-peers-updated", {
          peers: allPeers,
          timestamp: Date.now(),
        });

        // If room is empty after grace period, clean it up
        if (room.clients.size === 0 && room.disconnectedClients.size === 0) {
          cleanupRoom(roomId);
        } else {
          // If the host left, assign new host
          if (socket.id === room.hostId) {
            const newHost = Array.from(room.clients)[0];
            room.hostId = newHost;
            io.to(roomId).emit("host-changed", {
              newHostId: newHost,
              timestamp: Date.now(),
            });
          }
        }
      }, RECONNECTION_WINDOW_MS);

      // Notify remaining peers of disconnect
      socket.to(roomId).emit("peer-disconnected", {
        peerId: socket.id,
        timestamp: Date.now(),
      });

      // Store disconnected client info
      room.disconnectedClients.set(socket.id, {
        timeoutHandler,
        reconnectionToken:
          server.clientSessions.get(socket.id)?.reconnectionToken || "",
      });

      logger.info(
        { clientId: socket.id, roomId },
        "Client temporarily disconnected"
      );
    } catch (error) {
      logger.error({ error, clientId: socket.id }, "Error handling disconnect");
    }
  };

  const handleRejoinRoom = (socket: Socket, { roomId }: JoinRoomPayload) => {
    try {
      const room = server.rooms.get(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      const session = server.clientSessions.get(socket.id);
      if (!session || session.roomId !== roomId) {
        throw new Error("Invalid rejoin attempt");
      }

      // Clear reconnection timeout
      const disconnectedClient = room.disconnectedClients.get(socket.id);
      if (disconnectedClient) {
        clearTimeout(disconnectedClient.timeoutHandler);
        room.disconnectedClients.delete(socket.id);
      }

      // Rejoin room
      room.clients.add(socket.id);
      server.clientToRoom.set(socket.id, roomId);
      socket.join(roomId);

      // Get updated peer list
      const allPeers = Array.from(room.clients).map((id) => ({
        id,
        isHost: id === room.hostId,
        disconnected: room.disconnectedClients.get(id) !== undefined,
      }));

      // Notify everyone
      io.to(roomId).emit("peer-rejoined", {
        peerId: socket.id,
        peers: allPeers,
        timestamp: Date.now(),
      });

      socket.emit("room-joined", {
        roomId,
        peers: allPeers,
        isHost: false,
        timestamp: Date.now(),
      });

      logger.info({ roomId, clientId: socket.id }, "Client rejoined room");
    } catch (error) {
      logger.error(
        { error, clientId: socket.id, roomId },
        "Failed to rejoin room"
      );
      socket.emit("error", {
        message:
          error instanceof Error ? error.message : "Failed to rejoin room",
      });
    }
  };

  return {
    handleConnection,
    handleCreateRoom,
    handleJoinRoom,
    handleRejoinRoom,
    handleSignal,
    handleListRooms,
    handleDisconnect,
  };
};
