import { getDB, saveDB } from "@/database/db";


// Refresh Google OAuth Access Token
export async function getFreshAccessToken(channelId: string): Promise<string | null> {
  const db = await getDB();
  const channelIndex = db.channels.findIndex((c) => c.id === channelId);
  if (channelIndex === -1) return null;

  const channel = db.channels[channelIndex];
  const { refreshToken, accessToken } = channel;

  if (!refreshToken) {
    console.error(`No refresh token available for channel ${channelId}`);
    return accessToken || null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("Missing Google OAuth credentials for token refresh");
    return accessToken || null;
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token"
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Failed to refresh access token:", err);
      // Mark channel status as quota_error to alert the user
      db.channels[channelIndex].status = "quota_error";
      await saveDB(db);
      return null;
    }

    const data = await res.json();
    const newAccessToken = data.access_token;
    
    // Update local database with the fresh access token
    db.channels[channelIndex].accessToken = newAccessToken;
    db.channels[channelIndex].status = "active";
    await saveDB(db);

    return newAccessToken;
  } catch (err) {
    console.error("Error in getFreshAccessToken:", err);
    return null;
  }
}

// Fetch Channel's uploaded videos via Uploads Playlist
export async function fetchChannelVideos(channelId: string) {
  const token = await getFreshAccessToken(channelId);
  if (!token) return [];

  try {
    // 1. Fetch channel's uploads playlist ID
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!channelRes.ok) {
      console.error("Error fetching channel details:", await channelRes.text());
      return [];
    }

    const channelData = await channelRes.json();
    if (!channelData.items || channelData.items.length === 0) return [];

    const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return [];

    // 2. Fetch recent videos in the uploads playlist
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=15`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!playlistRes.ok) {
      console.error("Error fetching uploads playlist items:", await playlistRes.text());
      return [];
    }

    const playlistData = await playlistRes.json();
    if (!playlistData.items) return [];

    return playlistData.items.map((item: any) => ({
      id: item.snippet?.resourceId?.videoId,
      title: item.snippet?.title || "Untitled Video",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      publishedAt: item.snippet?.publishedAt
    }));
  } catch (err) {
    console.error("fetchChannelVideos exception:", err);
    return [];
  }
}

// Fetch comments threads for a specific video ID
export async function fetchVideoComments(channelId: string, videoId: string) {
  const token = await getFreshAccessToken(channelId);
  if (!token) return [];

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=time`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      console.error(`Error fetching comment threads for video ${videoId}:`, await res.text());
      return [];
    }

    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error("fetchVideoComments exception:", err);
    return [];
  }
}

// Post a reply to a YouTube comment thread
export async function postCommentReply(channelId: string, parentCommentId: string, replyText: string) {
  const token = await getFreshAccessToken(channelId);
  if (!token) return null;

  try {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/comments?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          snippet: {
            parentId: parentCommentId,
            textOriginal: replyText
          }
        })
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`Error posting reply to comment ${parentCommentId}:`, err);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("postCommentReply exception:", err);
    return null;
  }
}
