/**
 * Login API endpoint
 */

import { NextResponse } from "next/server";
import { verifyPassword, createAuthCookie } from "~/lib/auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { message: "Password is required" },
        { status: 400 }
      );
    }

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 }
      );
    }

    // Create response with auth cookie
    const response = NextResponse.json({ success: true });
    response.headers.set("Set-Cookie", createAuthCookie());

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500 }
    );
  }
}
