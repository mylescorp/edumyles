import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing email service...');
    
    // Test basic email service functionality
    const testResult = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<h1>Test Email</h1><p>This is a test email from EduMyles.</p>',
    });

    console.log('Email test result:', testResult);

    return NextResponse.json({
      success: testResult.success,
      message: testResult.success ? 'Email service working' : 'Email service failed',
      data: testResult,
      environment: {
        hasApiKey: !!process.env.RESEND_API_KEY,
        apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
        fromEmail: process.env.RESEND_FROM_EMAIL,
      }
    });

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        hasApiKey: !!process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL,
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint. Use POST to test email sending.',
    environment: {
      hasApiKey: !!process.env.RESEND_API_KEY,
      apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
      fromEmail: process.env.RESEND_FROM_EMAIL,
    }
  });
}
