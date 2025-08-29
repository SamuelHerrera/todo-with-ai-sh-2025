import { makeWASocket, useMultiFileAuthState, DisconnectReason } from 'baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import qrcode from 'qrcode-terminal';

import { config, validateConfig } from './config';
import { WebhookService } from './webhook-service';
import { MessageHandler } from './message-handler';
import { ConnectionState } from './types';

class WhatsAppBot {
  private webhookService: WebhookService;
  private connectionState: ConnectionState;
  private reconnectAttempts = 0;
  private sock: any; // Store the socket reference

  constructor() {
    this.webhookService = new WebhookService();
    this.connectionState = {
      isConnected: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: config.maxReconnectAttempts,
    };
  }

  async start(): Promise<void> {
    console.log('🚀 Starting WhatsApp Bot...');
    
    try {
      validateConfig();
      await this.testWebhookConnection();
      await this.initializeWhatsApp();
    } catch (error) {
      console.error('❌ Failed to start WhatsApp Bot:', error);
      process.exit(1);
    }
  }

  private async testWebhookConnection(): Promise<void> {
    console.log('🔗 Testing n8n webhook connection...');
    const isConnected = await this.webhookService.testConnection();
    
    if (!isConnected) {
      console.warn('⚠️  Warning: n8n webhook connection test failed. The bot will continue but message forwarding may fail.');
    } else {
      console.log('✅ n8n webhook connection test successful');
    }
  }

  private async initializeWhatsApp(): Promise<void> {
    // Ensure auth folder exists
    if (!fs.existsSync(config.authFolder)) {
      fs.mkdirSync(config.authFolder, { recursive: true });
    }

    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(config.authFolder);

    // Create WhatsApp socket
    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    // Handle connection updates
    this.sock.ev.on('connection.update', async (update: any) => {
      await this.handleConnectionUpdate(update, saveCreds);
    });

    // Handle credentials update
    this.sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    this.sock.ev.on('messages.upsert', async (m: any) => {
      await this.handleIncomingMessages(m);
    });

    // Handle message updates (read receipts, etc.)
    this.sock.ev.on('messages.update', (updates: any[]) => {
      this.handleMessageUpdates(updates);
    });

    // Handle presence updates
    this.sock.ev.on('presence.update', (presence: any) => {
      this.handlePresenceUpdate(presence);
    });

    console.log('🤖 WhatsApp Bot is running. Waiting for messages...');
  }

  private async handleConnectionUpdate(update: any, saveCreds: any): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Scan this QR code to login:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      this.connectionState.isConnected = false;
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      
      console.log(`🔌 Connection closed due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);

      if (shouldReconnect && this.reconnectAttempts < config.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${config.maxReconnectAttempts}`);
        
        setTimeout(async () => {
          await this.initializeWhatsApp();
        }, config.reconnectInterval);
      } else if (this.reconnectAttempts >= config.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached. Exiting...');
        process.exit(1);
      }
    } else if (connection === 'open') {
      this.connectionState.isConnected = true;
      this.connectionState.lastConnected = new Date();
      this.reconnectAttempts = 0;
      console.log('✅ WhatsApp connection established successfully!');
    }
  }

  private async handleIncomingMessages(m: any): Promise<void> {
    const msg = m.messages[0];
    
    if (!msg.key.fromMe && msg.message) {
      console.log('📨 New message received!');

      const whatsappMessage = MessageHandler.processMessage(msg);
      
      if (whatsappMessage) {
        console.log(`📝 ${MessageHandler.formatMessageForLog(whatsappMessage)}`);

        // Send to n8n webhook
        const result = await this.webhookService.sendMessage(whatsappMessage);
        
        if (result.success) {
          // Send the response back to the user
          if (result.output) {
            console.log('result.output', result.output);
            await this.sendMessage(whatsappMessage.from, result.output);
          } else {
            console.log('ℹ️  No output received from n8n webhook');
          }
        } else {
          console.error('❌ Failed to send message to n8n webhook:', result.error);
          // Send error message to user
          await this.sendMessage(whatsappMessage.from, 'Sorry, I encountered an error processing your request. Please try again later.');
        }
      }
    }
  }

  private async sendMessage(to: string, message: string): Promise<void> {
    try {
      if (!this.sock || !this.connectionState.isConnected) {
        console.error('❌ Cannot send message: WhatsApp not connected');
        return;
      }

      await this.sock.sendMessage(to, { text: message });
      console.log(`✅ Message sent to ${to}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  }

  private handleMessageUpdates(updates: any[]): void {
    for (const update of updates) {
      if (update.update.status) {
        console.log(`📊 Message status update: ${update.update.status}`);
      }
    }
  }

  private handlePresenceUpdate(presence: any): void {
    console.log(`👤 Presence update: ${presence.id} is ${presence.presences?.[0]?.lastSeen ? 'online' : 'offline'}`);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WhatsApp Bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down WhatsApp Bot...');
  process.exit(0);
});

// Start the bot
const bot = new WhatsAppBot();
bot.start().catch((error) => {
  console.error('❌ Error starting WhatsApp Bot:', error);
  process.exit(1);
});
