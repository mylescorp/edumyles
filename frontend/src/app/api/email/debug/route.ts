import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test the email service without actually sending
    console.log('Email debug test:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Email service configuration test',
      configuration: {
        hasApiKey: !!process.env.RESEND_API_KEY,
        apiKeyFormat: process.env.RESEND_API_KEY?.startsWith('re_') ? 'Valid format' : 'Invalid format',
        apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
        fromEmail: process.env.RESEND_FROM_EMAIL,
        fromName: process.env.RESEND_FROM_NAME,
      },
      request: {
        to: body.to,
        subject: body.subject,
        template: body.template,
        hasHtml: !!body.html,
        hasData: !!body.data,
      },
      nextSteps: [
        '1. Verify your Resend API key is valid',
        '2. Ensure your domain is verified in Resend dashboard',
        '3. Check that FROM email is from your verified domain',
        '4. Test with a simple email first',
      ]
    });

  } catch (error) {
    console.error('Email debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      configuration: {
        hasApiKey: !!process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL,
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email debug endpoint. Use POST to debug email configuration.',
    help: {
      apiKey: 'Get a valid API key from https://resend.com/api-keys',
      domain: 'Verify your domain in Resend dashboard',
      fromEmail: 'Must be from your verified domain',
      testing: 'Start with simple test emails',
    }
  });
}
