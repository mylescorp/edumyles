import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const chatSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  message: z.string().min(1, "Message is required").max(2000, "Message is too long"),
});

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

export async function POST(req: NextRequest) {
  try {
    const parsed = chatSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request payload" },
        { status: 400 }
      );
    }

    const { name, message } = parsed.data;
    const resend = getResendClient();

    if (!resend) {
      console.warn("Chat message received but RESEND_API_KEY is not configured");
      return NextResponse.json({ success: true, queued: false });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "EduMyles <noreply@edumyles.com>";
    const supportEmail = process.env.RESEND_SUPPORT_EMAIL || "support@edumyles.com";

    const result = await resend.emails.send({
      from: fromEmail,
      to: [supportEmail],
      subject: `Live Chat from ${name}`,
      html: `
        <h2>New landing page chat message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    });

    if (result.error) {
      console.error("Resend chat email error:", result.error);
      return NextResponse.json({ error: "Failed to send message." }, { status: 502 });
    }

    return NextResponse.json({ success: true, queued: true, id: result.data?.id ?? null });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
