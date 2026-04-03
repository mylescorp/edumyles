// ============================================================
// EduMyles — Resend Email Integration
// ============================================================

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailMessage {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface EmailResponse {
  id: string;
  from: string;
  to: string[];
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  from_email: string;
  from_name: string;
  reply_to: string;
  created_at: string;
  updated_at: string;
}

export class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  private getAPIUrl(): string {
    return 'https://api.resend.com';
  }

  /**
   * Send email to single or multiple recipients
   */
  async sendEmail(message: EmailMessage): Promise<{
    success: boolean;
    messageId?: string;
    recipients?: string[];
    error?: string;
  }> {
    try {
      const payload = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.attachments,
        reply_to: message.replyTo,
        headers: message.headers,
      };

      const response = await fetch(`${this.getAPIUrl()}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API error: ${response.statusText} - ${errorText}`);
      }

      const data: EmailResponse = await response.json();
      
      return {
        success: true,
        messageId: data.id,
        recipients: data.to,
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Send email using template
   */
  async sendTemplateEmail(templateId: string, to: string[], variables: Record<string, any> = {}): Promise<{
    success: boolean;
    messageId?: string;
    recipients?: string[];
    error?: string;
  }> {
    try {
      const payload = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to,
        template_id: templateId,
        variables,
      };

      const response = await fetch(`${this.getAPIUrl()}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend template API error: ${response.statusText} - ${errorText}`);
      }

      const data: EmailResponse = await response.json();
      
      return {
        success: true,
        messageId: data.id,
        recipients: data.to,
      };
    } catch (error) {
      console.error('Template email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get email templates
   */
  async getTemplates(): Promise<{
    success: boolean;
    templates?: EmailTemplate[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.getAPIUrl()}/templates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        templates: data.data || [],
      };
    } catch (error) {
      console.error('Get templates failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create email template
   */
  async createTemplate(template: {
    name: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{
    success: boolean;
    templateId?: string;
    error?: string;
  }> {
    try {
      const payload = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        name: template.name,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const response = await fetch(`${this.getAPIUrl()}/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Template creation failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        templateId: data.id,
      };
    } catch (error) {
      console.error('Template creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get email delivery status
   */
  async getDeliveryStatus(emailId: string): Promise<{
    success: boolean;
    status?: string;
    last_event?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.getAPIUrl()}/emails/${emailId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get email status: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        status: data.last_event?.status,
        last_event: data.last_event?.name,
      };
    } catch (error) {
      console.error('Email status check failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Validate email addresses
   */
  static validateEmails(emails: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    emails.forEach(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        valid.push(email.toLowerCase());
      } else {
        invalid.push(email);
      }
    });

    return { valid, invalid };
  }

  /**
   * Generate HTML email from template
   */
  static generateHTMLEmail(template: string, variables: Record<string, any> = {}): string {
    let html = template;
    
    // Replace variables in {{variable}} format
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, String(value));
    });

    return html;
  }

  /**
   * Generate plain text email from HTML
   */
  static generateTextEmail(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}

// Factory function to create email service
export function createEmailService(): EmailService {
  const resolved = resolveResendConfig();
  const config: EmailConfig = {
    apiKey: resolved.apiKey!,
    fromEmail: resolved.fromEmail!,
    fromName: resolved.fromName,
  };

  // Validate required environment variables
  const requiredVars = ['apiKey', 'fromEmail'];
  for (const varName of requiredVars) {
    if (!config[varName as keyof EmailConfig]) {
      throw new Error(`Missing required Resend config: ${varName}`);
    }
  }

  return new EmailService(config);
}
import { resolveResendConfig } from "./env.js";
