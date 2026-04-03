// ============================================================
// EduMyles — Africa's Talking SMS Integration
// ============================================================

export interface SMSConfig {
  username: string;
  apiKey: string;
  senderId?: string;
  environment: 'sandbox' | 'production';
}

export interface SMSMessage {
  to: string[];
  message: string;
  from?: string;
  priority?: 'High' | 'Medium' | 'Low';
  bulkSMSMode?: number; // 1 for promotional, 2 for transactional
}

export interface SMSResponse {
  SMSMessageData: {
    Message: {
      Recipients: Array<{
        statusCode: string;
                      number: string;
                      messageId: string;
                      status: string;
                      cost: string;
                    }>;
      Message: string;
      RecipientsCount: number;
    };
  };
}

export interface DeliveryReport {
  status: string;
  number: string;
  messageId: string;
  timestamp: string;
  networkCode: string;
}

export class SMSService {
  private config: SMSConfig;

  constructor(config: SMSConfig) {
    this.config = config;
  }

  private getAPIUrl(): string {
    const baseUrl = this.config.environment === 'production' 
      ? 'https://api.africastalking.com' 
      : 'https://api.sandbox.africastalking.com';
    return `${baseUrl}/version1/messaging`;
  }

  /**
   * Send SMS message(s)
   */
  async sendSMS(message: SMSMessage): Promise<{
    success: boolean;
    messageId?: string;
    recipients?: Array<{
      number: string;
      status: string;
      messageId: string;
    }>;
    error?: string;
  }> {
    try {
      const payload = {
        username: this.config.username,
        to: message.to.join(','),
        message: message.message,
        from: message.from || this.config.senderId,
        bulkSMSMode: message.bulkSMSMode || 1, // Default to promotional
      };

      // Add priority if specified
      if (message.priority) {
        (payload as any).priority = message.priority;
      }

      const response = await fetch(this.getAPIUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams(payload as any).toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Africa's Talking API error: ${response.statusText} - ${errorText}`);
      }

      const data: SMSResponse = await response.json();
      
      if (data.SMSMessageData.Message.RecipientsCount === 0) {
        return {
          success: false,
          error: 'No recipients processed',
        };
      }

      const failedRecipients = data.SMSMessageData.Message.Recipients.filter(
        r => r.statusCode !== '101' // 101 = Success
      );

      return {
        success: failedRecipients.length === 0,
        messageId: data.SMSMessageData.Message.Recipients[0]?.messageId,
        recipients: data.SMSMessageData.Message.Recipients.map(r => ({
          number: r.number,
          status: r.status,
          messageId: r.messageId,
        })),
        error: failedRecipients.length > 0 
          ? `${failedRecipients.length} recipients failed` 
          : undefined,
      };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Send bulk SMS to multiple recipients
   */
  async sendBulkSMS(messages: SMSMessage[]): Promise<{
    success: boolean;
    totalSent: number;
    totalFailed: number;
    errors: string[];
  }> {
    const results = await Promise.allSettled(
      messages.map(msg => this.sendSMS(msg))
    );

    let totalSent = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        totalSent += result.value.recipients?.length || 0;
      } else {
        totalFailed++;
        const errorMsg = result.status === 'rejected' 
          ? result.reason 
          : `Message ${index + 1} failed`;
        errors.push(errorMsg);
      }
    });

    return {
      success: totalFailed === 0,
      totalSent,
      totalFailed,
      errors,
    };
  }

  /**
   * Get SMS delivery report
   */
  async getDeliveryReport(messageId: string): Promise<{
    success: boolean;
    reports?: DeliveryReport[];
    error?: string;
  }> {
    try {
      const payload = {
        username: this.config.username,
        messageId: messageId,
      };

      const response = await fetch(`${this.getAPIUrl()}/delivery-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams(payload as any).toString(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get delivery report: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        reports: data.results || [],
      };
    } catch (error) {
      console.error('Delivery report failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Validate phone numbers for SMS
   */
  static validatePhoneNumbers(numbers: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    numbers.forEach(number => {
      // Remove any non-digit characters
      const cleanNumber = number.replace(/\D/g, '');
      
      // Check if it's a valid international format
      if (cleanNumber.startsWith('+') && cleanNumber.length >= 10 && cleanNumber.length <= 15) {
        valid.push(number);
      } else if (cleanNumber.startsWith('254') && cleanNumber.length === 12) {
        valid.push('+' + cleanNumber);
      } else if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
        valid.push('+254' + cleanNumber.substring(1));
      } else {
        invalid.push(number);
      }
    });

    return { valid, invalid };
  }

  /**
   * Calculate SMS cost estimate
   */
  static calculateCost(messageCount: number, recipientCount: number): {
    totalCost: number;
    costPerSMS: number;
    currency: string;
  } {
    // Africa's Talking pricing (approximate)
    const costPerSMS = 0.8; // KES per SMS
    const totalCost = messageCount * recipientCount * costPerSMS;

    return {
      totalCost,
      costPerSMS,
      currency: 'KES',
    };
  }

  /**
   * Check if message length requires multiple SMS
   */
  static getSMSCount(message: string): number {
    // Standard SMS is 160 characters
    const maxLength = 160;
    
    if (message.length <= maxLength) {
      return 1;
    }
    
    // For longer messages, calculate based on character encoding
    // This is simplified - actual implementation depends on encoding
    return Math.ceil(message.length / maxLength);
  }
}

// Factory function to create SMS service
export function createSMSService(): SMSService {
  const resolved = resolveAfricasTalkingConfig();
  const config: SMSConfig = {
    username: resolved.username!,
    apiKey: resolved.apiKey!,
    senderId: resolved.senderId,
    environment: resolved.environment as 'sandbox' | 'production',
  };

  // Validate required environment variables
  const requiredVars = ['username', 'apiKey'];
  for (const varName of requiredVars) {
    if (!config[varName as keyof SMSConfig]) {
      throw new Error(`Missing required Africa's Talking config: ${varName}`);
    }
  }

  return new SMSService(config);
}
import { resolveAfricasTalkingConfig } from "./env.js";
