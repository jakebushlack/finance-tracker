import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?auth_error=no_code", request.url)
    );
  }

  try {
    const tokens = await getTokensFromCode(code);

    // Redirect back to app with tokens in URL fragment (client-side only)
    // In production, you'd want to use secure HTTP-only cookies or a session
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("access_token", tokens.access_token || "");
    if (tokens.refresh_token) {
      redirectUrl.searchParams.set("refresh_token", tokens.refresh_token);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Failed to exchange code for tokens:", error);
    return NextResponse.redirect(
      new URL("/?auth_error=token_exchange_failed", request.url)
    );
  }
}
