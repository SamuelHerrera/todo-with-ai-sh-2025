import fetch from 'node-fetch';
import { WhatsAppMessage, N8nWebhookResponse } from './types';
import { config } from './config';

export class WebhookService {
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  async sendMessage(message: WhatsAppMessage): Promise<N8nWebhookResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`📤 Attempt ${attempt}/${this.retryAttempts}: Sending message to n8n webhook`);
        
        const response = await fetch(config.n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'WhatsApp-Automation-Bot/1.0',
          },
          body: JSON.stringify({
            ...message,
            receivedAt: new Date().toISOString(),
            source: 'whatsapp-baileys',
          }),
        });

        if (response.ok) {
          const responseData = await response.json().catch(() => ({}));
          console.log('✅ Message sent to n8n webhook successfully');
          console.log('responseData', JSON.stringify(responseData, null, 2));
          
          // Extract output from response data
          let output: string | undefined;
          if (Array.isArray(responseData) && responseData.length > 0) {
            output = responseData[0]?.output;
          } else if (responseData && typeof responseData === 'object') {
            output = (responseData as any).output;
          }
          
          return {
            success: true,
            message: 'Message sent successfully',
            output,
            ...(responseData as Record<string, any>),
          };
        } else {
          const errorText = await response.text();
          console.error(`❌ HTTP ${response.status}: ${errorText}`);
          lastError = new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      // Wait before retry (except on last attempt)
      if (attempt < this.retryAttempts) {
        const delay = this.retryDelay * attempt; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.error('❌ All retry attempts failed');
    return {
      success: false,
      error: lastError?.message || 'Unknown error',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(config.n8nWebhookUrl, {
        method: 'GET',
      });
      
      console.log(`🔗 n8n webhook connection test: ${response.status}`);
      return response.status < 500; // Consider 4xx as "reachable" but invalid
    } catch (error) {
      console.error('❌ n8n webhook connection test failed:', error);
      return false;
    }
  }
}
