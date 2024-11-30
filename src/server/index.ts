// src/server/index.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import { config } from "../config";
import { logger } from "../utils/logger";
import { SignalingServer } from "../types";
import { createSocketHandlers } from "./socket-handlers";
import { rateLimit } from "express-rate-limit";

export const createSignalingServer = () => {
  const app = express();
  const httpServer = createServer(app);

  // Express middleware
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    })
  );

  app.use(helmet());
  app.use(express.json());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });
  //   app.use(limiter);

  // Basic health check endpoint
  app.get("/health", (_, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      roomCount: server.rooms.size,
      clientCount: server.clientToRoom.size,
    });
  });

  const io = new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  io.engine.on("connection_error", (err) => {
    logger.error(
      {
        error: err.message,
        code: err.code,
        context: err.context,
        req: err.req?.url,
        headers: err.req?.headers,
      },
      "Socket.IO connection error"
    );
  });

  io.engine.on("initial_headers", (headers, req) => {
    logger.debug(
      {
        url: req.url,
        method: req.method,
        headers: req.headers,
      },
      "Socket.IO initial headers"
    );
  });

  const server: SignalingServer = {
    rooms: new Map(),
    clientToRoom: new Map(),
    clientSessions: new Map(),
  };

  // Set up periodic cleanup of stale rooms
  setInterval(() => {
    const now = Date.now();
    server.rooms.forEach((room, roomId) => {
      if (now - room.createdAt.getTime() > Number(config.ROOM_TIMEOUT_MS)) {
        io.to(roomId).emit("room-expired");
        server.rooms.delete(roomId);
        room.clients.forEach((clientId) => {
          server.clientToRoom.delete(clientId);
        });
        logger.info({ roomId }, "Stale room cleaned up");
      }
    });
  }, 60000); // Check every minute

  // Set up socket handlers
  io.on("connection", (socket) => {
    logger.info({ clientId: socket.id }, "Client connected");
    const handlers = createSocketHandlers(io, server);

    socket.on("create-room", (payload) =>
      handlers.handleCreateRoom(socket, payload)
    );
    socket.on("join-room", (payload) =>
      handlers.handleJoinRoom(socket, payload)
    );
    socket.on("rejoin-room", (payload) =>
      handlers.handleRejoinRoom(socket, payload)
    );
    socket.on("signal", (payload) => handlers.handleSignal(socket, payload));
    socket.on("list-rooms", (payload) =>
      handlers.handleListRooms(socket, payload)
    );
    socket.on("disconnect", () => handlers.handleDisconnect(socket));

    // Handle errors
    socket.on("error", (error) => {
      logger.error({ error, clientId: socket.id }, "Socket error");
    });

    handlers.handleConnection(socket);
  });

  return httpServer;
};
