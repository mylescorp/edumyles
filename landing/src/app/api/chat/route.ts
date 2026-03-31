import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, message } = body;

    if (!name || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In production: forward to Resend / CRM / Slack webhook
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: "chat@edumyles.com",
    //   to: "support@edumyles.com",
    //   subject: `Live Chat from ${name}`,
    //   html: `<p><strong>Name:</strong> ${name}</p><p><strong>Message:</strong> ${message}</p>`,
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
