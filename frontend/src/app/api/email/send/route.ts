import { NextRequest, NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { z } from 'zod';

// Request schema for sending emails
const sendEmailSchema = z.object({
  to: z.union([z.string(), z.array(z.string())]),
  subject: z.string(),
  html: z.string().optional(),
  text: z.string().optional(),
  from: z.string().optional(),
  replyTo: z.string().optional(),
});

// Request schema for templated emails
const sendTemplatedEmailSchema = z.object({
  to: z.string(),
  template: z.enum([
    'fee_reminder',
    'exam_results', 
    'attendance_alert',
    'payslip',
    'welcome_email',
    'password_reset',
    'general_notification'
  ]),
  data: z.record(z.any()),
});

export async function POST(request: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const serverSecret = process.env.CONVEX_WEBHOOK_SECRET;
    if (!convexUrl || !serverSecret) {
      return NextResponse.json({ error: 'Email delivery is not configured' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("edumyles_session")?.value ?? cookieStore.get("edumyles-session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const session = await convex.query(api.sessions.getSession, { sessionToken, serverSecret });
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if this is a templated email or custom email
    if (body.template) {
      // Validate templated email request
      const { to, template, data } = sendTemplatedEmailSchema.parse(body);
      
      // Send templated email
      const result = await convex.action((api as any)["modules/communications/email"].sendEmail, {
        webhookSecret: serverSecret,
        tenantId: session.activeTenantId ?? session.tenantId,
        to: [to],
        subject: template.replaceAll('_', ' '),
        templateId: template,
        templateVariables: data,
      });
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to send email', details: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        data: result,
        messageId: result.messageId ?? result.id,
        recipients: result.recipients ?? [to],
      });
      
    } else {
      // Validate custom email request
      const emailData = sendEmailSchema.parse(body);
      
      // Send custom email
      const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
      const result = await convex.action((api as any)["modules/communications/email"].sendEmail, {
        webhookSecret: serverSecret,
        tenantId: session.activeTenantId ?? session.tenantId,
        to: recipients,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to send email', details: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        data: result,
        messageId: result.messageId ?? result.id,
        recipients,
      });
    }
    
  } catch (error) {
    console.error('Email API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
