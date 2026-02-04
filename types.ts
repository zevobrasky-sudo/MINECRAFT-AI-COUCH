
export interface TranscriptionEntry {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface AppState {
  isStreaming: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  status: ConnectionStatus;
  transcriptions: TranscriptionEntry[];
}
