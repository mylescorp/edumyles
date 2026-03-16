import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    
    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const digest = "sha256=" + hmac.update(body).digest("hex");
    
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      const payload = JSON.parse(body);
      const event = request.headers.get("x-github-event");

      console.log(`GitHub webhook event: ${event}`);

      // In a real implementation, you would call Convex mutations here
      // For example:
      // await convex.mutation("pm/github:handleGitHubWebhook")({
      //   payload,
      //   signature,
      //   event,
      // });

      // Handle different event types
      switch (event) {
        case "pull_request":
          console.log(`PR #${payload.pull_request.number}: ${payload.action}`);
          break;
        case "issues":
          console.log(`Issue #${payload.issue.number}: ${payload.action}`);
          break;
        case "push":
          console.log(`Push to ${payload.ref}: ${payload.commits.length} commits`);
          break;
        default:
          console.log(`Unhandled event: ${event}`);
      }

      return NextResponse.json({ received: true });
    } else {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("GitHub webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
