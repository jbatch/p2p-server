// client/src/types.ts
export interface Room {
  id: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: Date;
}

export interface Peer {
  id: string;
  isHost: boolean;
  disconnected: boolean;
}

export interface ServerStatus {
  status: string;
  timestamp: string;
  uptime: number;
  roomCount: number;
  clientCount: number;
}

export interface WebRTCState {
  status: "idle" | "connecting" | "connected" | "failed";
  error?: string;
  connectionInfo: {
    localCandidates: number;
    remoteCandidates: number;
    localDescription?: string;
    remoteDescription?: string;
  };
}
export interface ConnectionState {
  [peerId: string]: WebRTCState;
}

export interface Message {
  type: string;
  [key: string]: any;
}

export type MessageHandler = (peerId: string, message: Message) => void;

export interface StorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
