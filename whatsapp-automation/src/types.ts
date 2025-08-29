export interface WhatsAppMessage {
  id: string;
  from: string;
  message: string;
  timestamp: number;
  type: MessageType;
  senderName?: string;
  groupName?: string;
  isGroup: boolean;
}

export type MessageType = 
  | 'conversation'
  | 'extendedText'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contact'
  | 'unsupported';

export interface N8nWebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
  output?: string;
}

export interface ConnectionState {
  isConnected: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}
