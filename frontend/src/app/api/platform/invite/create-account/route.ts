import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, password } = await request.json();

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Create WorkOS user
    const user = await workos.userManagement.createUser({
      email,
      firstName,
      lastName,
      password,
      // Skip email verification for platform invites
      emailVerified: true,
    });

    return NextResponse.json({ workosUserId: user.id });
  } catch (error) {
    console.error("Error creating WorkOS account:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }
      if (error.message.includes("password")) {
        return NextResponse.json({ error: "Password does not meet requirements" }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
