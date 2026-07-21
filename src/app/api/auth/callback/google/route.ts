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

  if (error) {
    console.error("OAuth error from Google:", error);
    const dest = state === "onboarding" ? "onboarding" : "dashboard/channels";
    return NextResponse.redirect(`${new URL(req.url).origin}/${dest}?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    const dest = state === "onboarding" ? "onboarding" : "dashboard/channels";
    return NextResponse.redirect(`${new URL(req.url).origin}/${dest}?error=missing_code`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const redirectUri = `${origin}/api/auth/callback/google`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${new URL(req.url).origin}/dashboard/channels?error=credentials_not_configured`);
    }

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
      console.error("Token exchange failed:", errBody);
      return NextResponse.redirect(`${new URL(req.url).origin}/dashboard/channels?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token } = tokenData;

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
    }

    if (!email) {
      console.error("Failed to fetch email from userinfo");
      return NextResponse.redirect(`${new URL(req.url).origin}/login?error=email_fetch_failed`);
    }

    // Set the cookie session_email for tenant identification
    const cookieStore = await cookies();
    cookieStore.set("session_email", email.toLowerCase().trim(), { path: "/", httpOnly: true });

    // Load/create the isolated DB for this email
    const db = await getDB(email);

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
      await saveDB(db, email);
      await logActivity(db.userSession.name, "Signed in with Google");
      
      const hasChannels = db.channels && db.channels.length > 0;
      const redirectDest = hasChannels ? "dashboard" : "onboarding";
      return NextResponse.redirect(`${new URL(req.url).origin}/${redirectDest}`);
    }

    // 3. Fetch Channel Metadata from YouTube API (channel connection flow)
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );

    if (!channelRes.ok) {
      const errBody = await channelRes.text();
      console.error("YouTube Channel metadata fetch failed:", errBody);
      // Save session details anyway
      await saveDB(db, email);
      return NextResponse.redirect(`${new URL(req.url).origin}/dashboard/channels?error=youtube_metadata_failed`);
    }

    const channelData = await channelRes.json();
    if (!channelData.items || channelData.items.length === 0) {
      await saveDB(db, email);
      return NextResponse.redirect(`${new URL(req.url).origin}/dashboard/channels?error=no_youtube_channel_found`);
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

    await saveDB(db, email);
    await logActivity(db.userSession.name, `Linked YouTube channel: ${name} (${handle})`);

    const dest = state === "onboarding" ? "onboarding" : "dashboard/channels";
    return NextResponse.redirect(`${new URL(req.url).origin}/${dest}?success=connected&channel=${encodeURIComponent(name)}`);
  } catch (err) {
    console.error("OAuth callback exception:", err);
    const dest = state === "onboarding" ? "onboarding" : "dashboard/channels";
    return NextResponse.redirect(`${new URL(req.url).origin}/${dest}?error=callback_exception`);
  }
}
