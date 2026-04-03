// ============================================================
// EduMyles — M-Pesa Daraja Integration Library
// ============================================================

export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  environment: 'sandbox' | 'production';
  callbackUrl: string;
}

export interface StkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl?: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value?: string | number;
        }>;
      };
    };
  };
}

export class MpesaService {
  private config: MpesaConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: MpesaConfig) {
    this.config = config;
  }

  /**
   * Get OAuth access token from M-Pesa
   */
  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
    
    const response = await fetch(this.getOAuthUrl(), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get M-Pesa access token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token as string;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 minute early
    
    return this.accessToken;
  }

  private getOAuthUrl(): string {
    const baseUrl = this.config.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    return `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
  }

  private getStkPushUrl(): string {
    const baseUrl = this.config.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    return `${baseUrl}/mpesa/stkpush/v1/processrequest`;
  }

  /**
   * Initiate STK Push payment request
   */
  async initiateStkPush(request: StkPushRequest): Promise<StkPushResponse> {
    const token = await this.getAccessToken();
    
    const timestamp = new Date().getFullYear().toString() +
      (new Date().getMonth() + 1).toString().padStart(2, '0') +
      new Date().getDate().toString().padStart(2, '0') +
      new Date().getHours().toString().padStart(2, '0') +
      new Date().getMinutes().toString().padStart(2, '0') +
      new Date().getSeconds().toString().padStart(2, '0');

    const password = Buffer.from(
      this.config.shortcode + 
      this.config.passkey + 
      timestamp
    ).toString('base64');

    const payload = {
      BusinessShortCode: this.config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: request.amount,
      PartyA: request.phoneNumber,
      PartyB: this.config.shortcode,
      PhoneNumber: request.phoneNumber,
      CallBackURL: request.callbackUrl || this.config.callbackUrl,
      AccountReference: request.accountReference,
      TransactionDesc: request.transactionDesc,
    };

    const response = await fetch(this.getStkPushUrl(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`M-Pesa STK Push failed: ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  /**
   * Parse M-Pesa callback and extract relevant data
   */
  static parseCallback(callback: MpesaCallback): {
    success: boolean;
    checkoutRequestID: string;
    merchantRequestID: string;
    amount?: number;
    mpesaReceiptNumber?: string;
    transactionDate?: string;
    phoneNumber?: string;
  } {
    const { stkCallback } = callback.Body;
    
    const result: {
      success: boolean;
      checkoutRequestID: string;
      merchantRequestID: string;
      amount?: number;
      mpesaReceiptNumber?: string;
      transactionDate?: string;
      phoneNumber?: string;
    } = {
      success: stkCallback.ResultCode === 0,
      checkoutRequestID: stkCallback.CheckoutRequestID,
      merchantRequestID: stkCallback.MerchantRequestID,
    };

    if (stkCallback.CallbackMetadata?.Item) {
      const metadata = stkCallback.CallbackMetadata.Item;
      
      const amountItem = metadata.find(item => item.Name === 'Amount');
      const receiptItem = metadata.find(item => item.Name === 'MpesaReceiptNumber');
      const dateItem = metadata.find(item => item.Name === 'TransactionDate');
      const phoneItem = metadata.find(item => item.Name === 'PhoneNumber');

      if (amountItem?.Value) result.amount = Number(amountItem.Value);
      if (receiptItem?.Value) result.mpesaReceiptNumber = String(receiptItem.Value);
      if (dateItem?.Value) result.transactionDate = String(dateItem.Value);
      if (phoneItem?.Value) result.phoneNumber = String(phoneItem.Value);
    }

    return result;
  }

  /**
   * Validate Kenyan phone number
   */
  static validatePhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleanPhone.startsWith('254')) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('0')) {
      return '254' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('7')) {
      return '254' + cleanPhone;
    }
    
    throw new Error('Invalid Kenyan phone number format');
  }
}

// Factory function to create M-Pesa service
export function createMpesaService(): MpesaService {
  const resolved = resolveMpesaConfig();
  const config: MpesaConfig = {
    consumerKey: resolved.consumerKey!,
    consumerSecret: resolved.consumerSecret!,
    shortcode: resolved.shortcode!,
    passkey: resolved.passkey!,
    environment: resolved.environment as 'sandbox' | 'production',
    callbackUrl: resolved.callbackUrl!,
  };

  // Validate required environment variables
  const requiredVars = ['consumerKey', 'consumerSecret', 'shortcode', 'passkey', 'callbackUrl'];
  for (const varName of requiredVars) {
    if (!config[varName as keyof MpesaConfig]) {
      throw new Error(`Missing required M-Pesa config: ${varName}`);
    }
  }

  return new MpesaService(config);
}
import { resolveMpesaConfig } from "./env.js";
