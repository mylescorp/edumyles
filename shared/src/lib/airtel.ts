// ============================================================
// EduMyles — Airtel Money API Integration Library
// ============================================================
import { resolveAirtelConfig } from "./env.js";

export interface AirtelConfig {
  clientId: string;
  clientSecret: string;
  partyId: string;
  environment: 'staging' | 'production';
  callbackUrl: string;
}

export interface AirtelPaymentRequest {
  phoneNumber: string;
  amount: number;
  transactionId: string;
  description: string;
}

export interface AirtelPaymentResponse {
  status: {
    response_code: string;
    response_message: string;
    transaction_id?: string;
  };
  transaction: {
    amount: string;
    country: string;
    currency: string;
    id: string;
    party_id: string;
    party_type: string;
    reference_id: string;
    service_code: string;
    timestamp: string;
    transaction_status: string;
  };
}

export interface AirtelCallback {
  transaction: {
    id: string;
    status: string;
    amount: string;
    currency: string;
    reference_id: string;
    party_id: string;
    service_code: string;
    timestamp: string;
  };
}

export class AirtelService {
  private config: AirtelConfig;
  private accessToken: string = '';
  private tokenExpiry: number = 0;

  constructor(config: AirtelConfig) {
    this.config = config;
  }

  /**
   * Get OAuth access token from Airtel
   */
  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    
    const response = await fetch(this.getOAuthUrl(), {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'X-Country': 'KE', // Kenya
        'X-Currency': 'KES',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials'
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Airtel access token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 minute early
    
    return this.accessToken;
  }

  private getOAuthUrl(): string {
    const baseUrl = this.config.environment === 'production' 
      ? 'https://openapi.airtel.africa' 
      : 'https://openapiuat.airtel.africa';
    return `${baseUrl}/auth/oauth2/token`;
  }

  private getPaymentUrl(): string {
    const baseUrl = this.config.environment === 'production' 
      ? 'https://openapi.airtel.africa' 
      : 'https://openapiuat.airtel.africa';
    return `${baseUrl}/merchant/v1/payments/`;
  }

  /**
   * Initiate Airtel Money payment request
   */
  async initiatePayment(request: AirtelPaymentRequest): Promise<AirtelPaymentResponse> {
    const token = await this.getAccessToken();
    
    const payload = {
      pay: {
        amount: request.amount.toString(),
        currency: 'KES',
        id: request.transactionId,
        reference_id: request.transactionId,
        msisdn: request.phoneNumber,
        party_id: this.config.partyId,
        party_type: 'SUBSCRIBER',
        create_validation: false,
        description: request.description,
        callback_url: this.config.callbackUrl,
      }
    };

    const response = await fetch(this.getPaymentUrl(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Country': 'KE',
        'X-Currency': 'KES',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtel Money payment failed: ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  /**
   * Parse Airtel callback and extract relevant data
   */
  static parseCallback(callback: AirtelCallback): {
    success: boolean;
    transactionId: string;
    amount?: number;
    referenceId?: string;
    status?: string;
    timestamp?: string;
  } {
    const { transaction } = callback;
    
    const result = {
      success: transaction.status === 'SUCCESSFUL',
      transactionId: transaction.id,
      amount: transaction.amount ? parseFloat(transaction.amount) : undefined,
      referenceId: transaction.reference_id,
      status: transaction.status,
      timestamp: transaction.timestamp,
    };

    return result;
  }

  /**
   * Validate Kenyan phone number for Airtel
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

  /**
   * Check if phone number is Airtel network
   */
  static isAirtelNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Airtel prefixes in Kenya
    const airtelPrefixes = [
      '254738', '254739', '254740', '254741',
      '254742', '254743', '254789', '254790',
      '254791', '254792', '254793', '254794',
      '254795', '254796', '254797', '254798',
      '254799'
    ];

    // Check if number starts with any Airtel prefix
    return airtelPrefixes.some(prefix => cleanPhone.startsWith(prefix));
  }
}

// Factory function to create Airtel service
export function createAirtelService(): AirtelService {
  const resolved = resolveAirtelConfig();
  const config: AirtelConfig = {
    clientId: resolved.clientId!,
    clientSecret: resolved.clientSecret!,
    partyId: resolved.partyId!,
    environment: resolved.environment as 'staging' | 'production',
    callbackUrl: resolved.callbackUrl!,
  };

  // Validate required environment variables
  const requiredVars = ['clientId', 'clientSecret', 'partyId', 'callbackUrl'];
  for (const varName of requiredVars) {
    if (!config[varName as keyof AirtelConfig]) {
      throw new Error(`Missing required Airtel config: ${varName}`);
    }
  }

  return new AirtelService(config);
}
