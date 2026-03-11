import { NextRequest, NextResponse } from "next/server";
import { listCSVFiles, getFileContent } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
  const refreshToken = request.headers.get("X-Refresh-Token") || undefined;
  const folderId = request.nextUrl.searchParams.get("folderId") || undefined;

  if (!accessToken) {
    return NextResponse.json(
      { error: "No access token provided" },
      { status: 401 }
    );
  }

  try {
    const files = await listCSVFiles(accessToken, folderId, refreshToken);
    return NextResponse.json({ files });
  } catch (error) {
    console.error("Failed to list files:", error);
    return NextResponse.json(
      { error: "Failed to list Drive files" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
  const refreshToken = request.headers.get("X-Refresh-Token") || undefined;

  if (!accessToken) {
    return NextResponse.json(
      { error: "No access token provided" },
      { status: 401 }
    );
  }

  try {
    const { fileIds } = await request.json();

    if (!fileIds || !Array.isArray(fileIds)) {
      return NextResponse.json(
        { error: "Invalid file IDs" },
        { status: 400 }
      );
    }

    const files = await Promise.all(
      fileIds.map(async (fileId: string) => {
        const content = await getFileContent(accessToken, fileId, refreshToken);
        return { fileId, content };
      })
    );

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Failed to fetch file contents:", error);
    return NextResponse.json(
      { error: "Failed to fetch file contents" },
      { status: 500 }
    );
  }
}
