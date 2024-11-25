// src/types/index.ts
export interface Room {
  id: string;
  gameType: string;
  hostId: string;
  clients: Set<string>;
  maxClients: number;
  createdAt: Date;
}

export interface SignalingServer {
  rooms: Map<string, Room>;
  clientToRoom: Map<string, string>;
}
