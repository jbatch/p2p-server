// src/types/index.ts
export interface ClientSession {
  id: string;
  roomId: string | null;
  lastSeen: Date;
  reconnectionToken: string;
}

export interface Room {
  id: string;
  gameType: string;
  hostId: string;
  clients: Set<string>;
  maxClients: number;
  createdAt: Date;
  disconnectedClients: Map<
    string,
    {
      timeoutHandler: NodeJS.Timeout;
      reconnectionToken: string;
    }
  >;
}

export interface SignalingServer {
  rooms: Map<string, Room>;
  clientToRoom: Map<string, string>;
  clientSessions: Map<string, ClientSession>;
}
