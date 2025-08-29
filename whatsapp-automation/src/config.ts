export interface Config {
  n8nWebhookUrl: string;
  authFolder: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export const config: Config = {
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || 'https://n8n.hypeer.space/webhook/wa-message',
  authFolder: process.env.AUTH_FOLDER || './auth_info_baileys',
  logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info',
  reconnectInterval: parseInt(process.env.RECONNECT_INTERVAL || '5000'),
  maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '10'),
};

export function validateConfig(): void {
  if (!config.n8nWebhookUrl) {
    throw new Error('N8N_WEBHOOK_URL environment variable is required');
  }

  try {
    new URL(config.n8nWebhookUrl);
  } catch (error) {
    throw new Error(`Invalid N8N_WEBHOOK_URL: ${config.n8nWebhookUrl}`);
  }
}
