import { NextRequest, NextResponse } from "next/server";
import { getDB, saveDB, logActivity } from "@/database/db";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateParam = searchParams.get("state") || "dashboard";

  const isLogin = stateParam.startsWith("login:");
  const state = isLogin ? stateParam.substring(6) : stateParam;
  
  const reqOrigin = new URL(req.url).origin;

  console.log("[OAuth Callback] Received callback. error:", error, "code present:", !!code, "state:", stateParam);

  if (error) {
    console.error("[OAuth Callback] OAuth error from Google:", error);
    const dest = state === "onboarding" ? "onboarding" : "dashboard/channels";
    return NextResponse.redirect(`${reqOrigin}/${dest}?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    console.error("[OAuth Callback] Missing authorization code");
    const dest = state === "onboarding" ? "onboarding" : "dashboard/channels";
    return NextResponse.redirect(`${reqOrigin}/${dest}?error=missing_code`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("[OAuth Callback] Missing credentials! clientId:", !!clientId, "clientSecret:", !!clientSecret);
      return NextResponse.redirect(`${reqOrigin}/dashboard/channels?error=credentials_not_configured`);
    }

    // Compute origin: prefer NEXT_PUBLIC_APP_URL if it's a real production URL
    let origin = req.nextUrl.origin;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && !appUrl.includes("localhost") && !appUrl.includes("127.0.0.1")) {
      origin = appUrl.replace(/\/$/, ""); // remove trailing slash
    }
    const redirectUri = `${origin}/api/auth/callback/google`;

    console.log("[OAuth Callback] Token exchange with redirectUri:", redirectUri);

    // 1. Exchange Auth Code for Access & Refresh Tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("[OAuth Callback] Token exchange failed! Status:", tokenRes.status, "Body:", errBody);
      
      // Parse common Google error messages for better user feedback
      let errorParam = "token_exchange_failed";
      try {
        const errJson = JSON.parse(errBody);
        if (errJson.error === "redirect_uri_mismatch") {
          errorParam = "redirect_uri_mismatch";
          console.error("[OAuth Callback] REDIRECT URI MISMATCH! The redirect_uri sent to Google does not match any authorized URI in Google Cloud Console.");
          console.error("[OAuth Callback] You must add this EXACT URI to Google Cloud Console:", redirectUri);
        } else if (errJson.error === "invalid_grant") {
          errorParam = "invalid_grant";
          console.error("[OAuth Callback] Invalid grant - code may have expired or been reused");
        } else if (errJson.error_description) {
          errorParam = errJson.error_description.replace(/\s+/g, "_").substring(0, 50);
        }
      } catch {}
      
      return NextResponse.redirect(`${reqOrigin}/dashboard/channels?error=${encodeURIComponent(errorParam)}`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token } = tokenData;
    console.log("[OAuth Callback] Token exchange successful. Has access_token:", !!access_token, "Has refresh_token:", !!refresh_token);

    // 2. Fetch User Profile Info from Google
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    let email = "";
    let profileName = "";
    if (profileRes.ok) {
      const profile = await profileRes.json();
      email = profile.email;
      profileName = profile.name;
      console.log("[OAuth Callback] Got user profile. email:", email, "name:", profileName);
    } else {
      console.error("[OAuth Callback] Failed to fetch user profile! Status:", profileRes.status);
    }

    if (!email) {
      console.error("[OAuth Callback] No email obtained from userinfo");
      return NextResponse.redirect(`${reqOrigin}/login?error=email_fetch_failed`);
    }
    
    // Normalize email
    const safeEmail = email.toLowerCase().trim();

    // Helper to return a redirect with the session cookie attached
    const redirectWithSession = async (url: string) => {
      const cookieStore = await cookies();
      cookieStore.set("session_email", safeEmail, { 
        path: "/", 
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
      return NextResponse.redirect(url);
    };

    // Load/create the isolated DB for this email
    const db = await getDB(safeEmail);

    // Sync session details
    db.userSession = {
      email: email,
      name: profileName || email.split("@")[0],
      tier: db.userSession?.tier || "free",
      repliesToday: db.userSession?.repliesToday || 0,
      lastResetDate: db.userSession?.lastResetDate || new Date().toISOString().split("T")[0]
    };

    if (isLogin) {
      // Login flow: just log in and redirect
      await saveDB(db, safeEmail);
      await logActivity(db.userSession.name, "Signed in with Google");
      
      const hasChannels = db.channels && db.channels.length > 0;
      const redirectDest = hasChannels ? "dashboard" : "onboarding";
      console.log("[OAuth Callback] Login flow complete. Redirecting to:", redirectDest);
      return redirectWithSession(`${reqOrigin}/${redirectDest}`);
    }

    // 3. Fetch Channel Metadata from YouTube API (channel connection flow)
    console.log("[OAuth Callback] Fetching YouTube channel metadata...");
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );

    if (!channelRes.ok) {
      const errBody = await channelRes.text();
      console.error("[OAuth Callback] YouTube Channel metadata fetch failed! Status:", channelRes.status, "Body:", errBody);
      
      let errorParam = "youtube_metadata_failed";
      try {
        const errJson = JSON.parse(errBody);
        if (errJson.error?.errors?.[0]?.reason === "youtubeSignupRequired") {
          errorParam = "youtube_signup_required";
        } else if (errJson.error?.errors?.[0]?.reason === "forbidden") {
          errorParam = "youtube_api_not_enabled";
          console.error("[OAuth Callback] YouTube Data API v3 is likely NOT enabled in Google Cloud Console!");
        } else if (errJson.error?.status === "PERMISSION_DENIED") {
          errorParam = "youtube_api_not_enabled";
          console.error("[OAuth Callback] PERMISSION_DENIED - Enable YouTube Data API v3 at https://console.cloud.google.com/apis/library/youtube.googleapis.com");
        }
      } catch {}
      
      // Save session details anyway
      await saveDB(db, safeEmail);
      return redirectWithSession(`${reqOrigin}/dashboard/channels?error=${encodeURIComponent(errorParam)}`);
    }

    const channelData = await channelRes.json();
    console.log("[OAuth Callback] YouTube API response items count:", channelData.items?.length || 0);
    
    if (!channelData.items || channelData.items.length === 0) {
      console.error("[OAuth Callback] No YouTube channel found for this Google account");
      await saveDB(db, safeEmail);
      return redirectWithSession(`${reqOrigin}/dashboard/channels?error=no_youtube_channel_found`);
    }

    const ytChannel = channelData.items[0];
    const channelId = ytChannel.id;
    const name = ytChannel.snippet.title;
    const handle = ytChannel.snippet.customUrl || `@channel_${channelId}`;
    const avatar = ytChannel.snippet.thumbnails?.default?.url || "";
    const subsCount = ytChannel.statistics?.subscriberCount;
    
    // Format subscriber count
    let subscribers = "0";
    if (subsCount) {
      const num = parseInt(subsCount, 10);
      if (num >= 1000000) {
        subscribers = (num / 1000000).toFixed(1) + "M";
      } else if (num >= 1000) {
        subscribers = Math.round(num / 1000) + "K";
      } else {
        subscribers = num.toString();
      }
    }

    console.log("[OAuth Callback] Connected channel:", name, handle, "subs:", subscribers);

    const existingIndex = db.channels.findIndex((c) => c.id === channelId);
    const updatedChannel = {
      id: channelId,
      name,
      handle,
      avatar,
      status: "active" as const,
      subscribers,
      accessToken: access_token,
      refreshToken: refresh_token || (existingIndex >= 0 ? db.channels[existingIndex].refreshToken : undefined),
      automatedVideos: existingIndex >= 0 ? (db.channels[existingIndex].automatedVideos || []) : []
    };

    if (existingIndex >= 0) {
      db.channels[existingIndex] = updatedChannel;
    } else {
      db.channels.push(updatedChannel);
    }

    await saveDB(db, safeEmail);
    await logActivity(db.userSession.name, `Linked YouTube channel: ${name} (${handle})`);

    const dest = state === "onboarding" ? "onboarding" : "dashboard/channels";
    console.log("[OAuth Callback] SUCCESS! Channel linked. Redirecting to:", dest);
    return await redirectWithSession(`${reqOrigin}/${dest}?success=connected&channel=${encodeURIComponent(name)}`);
  } catch (err) {
    console.error("[OAuth Callback] UNHANDLED EXCEPTION:", err);
    const dest = state === "onboarding" ? "onboarding" : "dashboard/channels";
    // For exceptions, we might not have a safeEmail, but we are inside the try block where it exists.
    // wait, if we are in catch, safeEmail might not be in scope if it failed before? No, safeEmail is defined inside try block.
    // wait, I put safeEmail outside the try block? Let me check where safeEmail is.
    return NextResponse.redirect(`${reqOrigin}/${dest}?error=callback_exception`);
  }
}
