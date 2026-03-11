import { NextRequest, NextResponse } from "next/server";
import { listFolders } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
  const refreshToken = request.headers.get("X-Refresh-Token") || undefined;

  if (!accessToken) {
    return NextResponse.json(
      { error: "No access token provided" },
      { status: 401 }
    );
  }

  try {
    const folders = await listFolders(accessToken, refreshToken);
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Failed to list folders:", error);
    return NextResponse.json(
      { error: "Failed to list Drive folders" },
      { status: 500 }
    );
  }
}
