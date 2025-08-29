import { WAMessage } from 'baileys';
import { WhatsAppMessage, MessageType } from './types';

export class MessageHandler {
  static processMessage(msg: WAMessage): WhatsAppMessage | null {
    if (msg.key.fromMe || !msg.message) {
      return null; // Skip messages from self or empty messages
    }

    // Extract message content and type
    const { messageText, messageType } = this.extractMessageContent(msg);
    
    // Get sender information
    const senderName = msg.pushName || 'Unknown';
    const isGroup = msg.key.remoteJid?.endsWith('@g.us') || false;
    const groupName = isGroup ? this.extractGroupName(msg) : undefined;

    // Convert timestamp to number if it's a Long object
    const timestamp = typeof msg.messageTimestamp === 'number' 
      ? msg.messageTimestamp 
      : msg.messageTimestamp?.toNumber() || Date.now();

    return {
      id: msg.key.id || '',
      from: msg.key.remoteJid || '',
      message: messageText,
      timestamp,
      type: messageType,
      senderName,
      groupName,
      isGroup,
    };
  }

  private static extractMessageContent(msg: WAMessage): { messageText: string; messageType: MessageType } {
    const message = msg.message;
    
    // Early return if message is null or undefined
    if (!message) {
      return {
        messageText: '[Empty message]',
        messageType: 'unsupported',
      };
    }

    if (message.conversation) {
      return {
        messageText: message.conversation,
        messageType: 'conversation',
      };
    }

    if (message.extendedTextMessage) {
      return {
        messageText: message.extendedTextMessage.text || '[No text content]',
        messageType: 'extendedText',
      };
    }

    if (message.imageMessage) {
      return {
        messageText: `[Image Message] ${message.imageMessage.caption || 'No caption'}`,
        messageType: 'image',
      };
    }

    if (message.videoMessage) {
      return {
        messageText: `[Video Message] ${message.videoMessage.caption || 'No caption'}`,
        messageType: 'video',
      };
    }

    if (message.audioMessage) {
      return {
        messageText: '[Audio Message]',
        messageType: 'audio',
      };
    }

    if (message.documentMessage) {
      return {
        messageText: `[Document] ${message.documentMessage.fileName || 'Unknown file'}`,
        messageType: 'document',
      };
    }

    if (message.stickerMessage) {
      return {
        messageText: '[Sticker Message]',
        messageType: 'sticker',
      };
    }

    if (message.locationMessage) {
      const location = message.locationMessage;
      return {
        messageText: `[Location] ${location.name || 'Unknown location'} - Lat: ${location.degreesLatitude}, Lng: ${location.degreesLongitude}`,
        messageType: 'location',
      };
    }

    if (message.contactMessage) {
      return {
        messageText: `[Contact] ${message.contactMessage.displayName || 'Unknown contact'}`,
        messageType: 'contact',
      };
    }

    // Handle other message types
    const messageTypes = Object.keys(message).filter(key => key.endsWith('Message'));
    if (messageTypes.length > 0) {
      return {
        messageText: `[${messageTypes[0].replace('Message', '')} Message]`,
        messageType: 'unsupported',
      };
    }

    return {
      messageText: '[Unknown message type]',
      messageType: 'unsupported',
    };
  }

  private static extractGroupName(msg: WAMessage): string | undefined {
    // This would need to be implemented based on how you want to get group names
    // For now, we'll return undefined and let the main handler deal with it
    return undefined;
  }

  static formatMessageForLog(message: WhatsAppMessage): string {
    const prefix = message.isGroup ? `[GROUP: ${message.groupName || 'Unknown'}] ` : '';
    return `${prefix}${message.senderName}: ${message.message}`;
  }
}
