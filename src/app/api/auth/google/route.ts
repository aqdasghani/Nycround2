import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isLogin = searchParams.get("login") === "true";
  const stateVal = searchParams.get("state") || "dashboard";
  
  const finalState = isLogin ? `login:${stateVal}` : stateVal;
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json({ 
      error: "YouTube integration is temporarily unavailable. Please contact support." 
    }, { status: 503 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/callback/google`;
  
  const scopes = isLogin
    ? ["openid", "email", "profile"]
    : ["openid", "email", "profile", "https://www.googleapis.com/auth/youtube.force-ssl", "https://www.googleapis.com/auth/youtube.readonly"];

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes.join(" "))}&` +
    `access_type=offline&` +
    `state=${encodeURIComponent(finalState)}&` +
    `prompt=consent`;

  return NextResponse.redirect(authUrl);
}
