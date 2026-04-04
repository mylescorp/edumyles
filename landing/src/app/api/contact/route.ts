import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  school: z.string().max(160, "School name is too long").optional().or(z.literal("")),
  subject: z.string().max(160, "Subject is too long").optional().or(z.literal("")),
  message: z.string().min(1, "Message is required").max(4000, "Message is too long"),
});

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

export async function POST(req: NextRequest) {
  try {
    const parsed = contactSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid request payload",
        },
        { status: 400 }
      );
    }

    const { name, email, school, message, subject } = parsed.data;
    const resend = getResendClient();

    if (!resend) {
      console.warn("Contact form received but RESEND_API_KEY is not configured");
      return NextResponse.json({
        success: true,
        message: "Thank you! We'll be in touch within 24 hours.",
        queued: false,
      });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "EduMyles <noreply@edumyles.com>";
    const supportEmail = process.env.RESEND_SUPPORT_EMAIL || "info@edumyles.com";

    const result = await resend.emails.send({
      from: fromEmail,
      to: [supportEmail],
      replyTo: email,
      subject: `Contact Form: ${subject || "General Enquiry"} from ${name}`,
      html: `
        <h2>New EduMyles contact form submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>School:</strong> ${school || "Not provided"}</p>
        <p><strong>Subject:</strong> ${subject || "General Enquiry"}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    });

    if (result.error) {
      console.error("Resend contact email error:", result.error);
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! We'll be in touch within 24 hours.",
      queued: true,
      id: result.data?.id ?? null,
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
