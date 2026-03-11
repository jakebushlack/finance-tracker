import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-drive";

export async function GET() {
  try {
    const authUrl = getAuthUrl();
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Failed to generate auth URL:", error);
    return NextResponse.json(
      { error: "Failed to initialize Google authentication" },
      { status: 500 }
    );
  }
}
