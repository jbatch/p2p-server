// example/src/types.ts
export interface Room {
  id: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: Date;
}

export interface Peer {
  id: string;
  isHost: boolean;
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
