import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, school, message, subject } = body;

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // In production: send via Resend
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: "noreply@edumyles.com",
    //   to: "info@edumyles.com",
    //   subject: `Contact Form: ${subject || "General Enquiry"} from ${name}`,
    //   html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>School:</strong> ${school}</p><p><strong>Message:</strong> ${message}</p>`,
    // });

    void school; // referenced in commented-out production code above
    void subject;

    return NextResponse.json({
      success: true,
      message: "Thank you! We'll be in touch within 24 hours.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
