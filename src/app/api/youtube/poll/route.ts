import { NextRequest, NextResponse } from "next/server";
import { getDB, saveDB, logActivity, Comment as DBComment } from "@/database/db";
import { fetchVideoComments, postCommentReply } from "@/backend/youtube";

function matchesCondition(text: string, type: string, value: string): boolean {
  const t = text.toLowerCase();
  const v = value.toLowerCase();
  if (type === "contains") return t.includes(v);
  if (type === "equals") return t === v;
  if (type === "starts_with") return t.startsWith(v);
  if (type === "regex") {
    try {
      const rx = new RegExp(value, "i");
      return rx.test(text);
    } catch {
      return false;
    }
  }
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDB();
    const channels = db.channels;
    
    if (!channels || channels.length === 0) {
      return NextResponse.json({ message: "No connected channels found. Link a channel first." });
    }

    const activeUser = db.userSession || {
      email: "",
      name: "Creator",
      tier: "free" as const,
      repliesToday: 0,
      lastResetDate: new Date().toISOString().split("T")[0]
    };

    // Calculate limit: 200 replies/day
    const maxDailyLimit = 200;
    
    // Ensure date resets if necessary
    const todayStr = new Date().toISOString().split("T")[0];
    if (activeUser.lastResetDate !== todayStr) {
      activeUser.repliesToday = 0;
      activeUser.lastResetDate = todayStr;
    }

    let checkedCount = 0;
    let matchedCount = 0;
    let repliedCount = 0;
    let skippedCount = 0;
    let limitReached = false;

    // 1. Process any existing delayed comments
    const now = Date.now();
    for (let i = 0; i < db.comments.length; i++) {
      const comment = db.comments[i];
      if (comment.status === "matched") {
        const rule = db.rules.find((r) => r.id === comment.matchedRuleId);
        const delaySeconds = rule ? rule.delaySeconds : 180;
        const matchedTime = comment.matchedAt ? new Date(comment.matchedAt).getTime() : now;
        const elapsed = Math.floor((now - matchedTime) / 1000);
        const remaining = Math.max(0, delaySeconds - elapsed);

        if (remaining <= 0) {
          // Check limits before firing delayed reply
          if (activeUser.repliesToday >= maxDailyLimit) {
            limitReached = true;
            db.comments[i] = {
              ...comment,
              status: "failed",
              delayRemainingSeconds: 0,
              autoReplyText: "Daily reply quota limit reached for this account."
            };
            continue;
          }

          // Time is up! Post reply
          const success = await postCommentReply(comment.channelId, comment.id, comment.autoReplyText || "");
          if (success) {
            db.comments[i] = {
              ...comment,
              status: "replied",
              delayRemainingSeconds: 0,
              replyFiredAt: new Date().toISOString()
            };
            activeUser.repliesToday++;
            repliedCount++;
            await logActivity("System", `Auto-replied (delayed match) to ${comment.author}. Rule: '${rule?.name || "Unknown"}'`);
          } else {
            db.comments[i] = {
              ...comment,
              status: "failed",
              delayRemainingSeconds: 0,
              autoReplyText: "Failed to post comment reply after delay."
            };
          }
        } else {
          db.comments[i].delayRemainingSeconds = remaining;
        }
      }
    }

    // 2. Iterate through all connected channels and fetch fresh comments
    for (const channel of channels) {
      const automatedVideos = channel.automatedVideos || [];
      if (automatedVideos.length === 0) continue;

      for (const videoId of automatedVideos) {
        // Fetch latest comment threads from YouTube API
        const ytComments = await fetchVideoComments(channel.id, videoId);
        
        for (const item of ytComments) {
          const topComment = item.snippet?.topLevelComment;
          if (!topComment) continue;

          const commentId = topComment.id;
          const author = topComment.snippet?.authorDisplayName || "Viewer";
          const authorAvatar = topComment.snippet?.authorChannelImageUrl || "";
          const text = topComment.snippet?.textDisplay || topComment.snippet?.textOriginal || "";
          const publishedAt = topComment.snippet?.publishedAt || new Date().toISOString();
          const videoTitle = "Automated Video Stream"; // default placeholder
          const videoThumbnail = "";

          checkedCount++;

          // Check if comment is already processed in local DB
          const alreadyProcessed = db.comments.some((c) => c.id === commentId);
          if (alreadyProcessed) {
            skippedCount++;
            continue;
          }

          // Check for Global Negative/Safety Keywords blocklist
          const negKeywordsStr = db.workspace?.settings?.negativeKeywords || "scam, refund, disappointed, hate, fake, bot, report";
          const negKeywords = negKeywordsStr.split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
          const commentTextLower = text.toLowerCase();
          const containsNegativeKeyword = negKeywords.some(keyword => commentTextLower.includes(keyword));

          if (containsNegativeKeyword) {
            matchedCount++;
            const reviewComment: DBComment = {
              id: commentId,
              channelId: channel.id,
              author,
              authorAvatar,
              authorSubscribers: "0",
              authorHistoryCount: 0,
              text,
              videoTitle,
              videoThumbnail,
              publishedAt,
              status: "review",
              matchedRuleId: null,
              delayRemainingSeconds: 0,
              autoReplyText: "Held for review: Comment contains negative/safety keywords.",
              replyFiredAt: null
            };
            db.comments.unshift(reviewComment);
            await logActivity("System", `Comment by ${author} held in review queue (negative keywords detected)`);
            continue;
          }

          // Evaluate against active rules sorted by priority
          const sortedRules = [...db.rules].sort((a, b) => a.priority - b.priority);
          let matchedRule = null;

          for (const rule of sortedRules) {
            if (!rule.isActive) continue;

            const isMatch = rule.operator === "OR" 
              ? rule.conditions.some((c) => matchesCondition(text, c.type, c.value))
              : rule.conditions.every((c) => matchesCondition(text, c.type, c.value));

            if (isMatch) {
              matchedRule = rule;
              break;
            }
          }

          if (matchedRule) {
            matchedCount++;

            // Check if user limit is reached
            if (activeUser.repliesToday >= maxDailyLimit) {
              limitReached = true;
              const skippedComment: DBComment = {
                id: commentId,
                channelId: channel.id,
                author,
                authorAvatar,
                authorSubscribers: "0",
                authorHistoryCount: 0,
                text,
                videoTitle,
                videoThumbnail,
                publishedAt,
                status: "failed",
                matchedRuleId: matchedRule.id,
                delayRemainingSeconds: 0,
                autoReplyText: "Daily reply quota limit reached for this account.",
                replyFiredAt: null
              };
              db.comments.unshift(skippedComment);
              continue;
            }

            // Find Template and interpolate variables
            const template = db.templates.find((t) => t.id === matchedRule?.templateId);
            if (!template) {
              console.error(`Template ${matchedRule.templateId} not found for rule ${matchedRule.name}`);
              continue;
            }

            // Generate reply body with all personalization tokens supported
            let replyText = template.body
              .replace(/\{\{commenter_name\}\}/g, author)
              .replace(/\{\{video_title\}\}/g, videoTitle)
              .replace(/\{\{channel_name\}\}/g, channel.name)
              .replace(/\{\{reply_date\}\}/g, new Date().toLocaleDateString())
              .replace(/\{\{custom_variable_1\}\}/g, matchedRule.customVariable1 || "")
              .replace(/\{\{custom_variable_2\}\}/g, matchedRule.customVariable2 || "")
              .replace(/\{\{custom_variable_3\}\}/g, matchedRule.customVariable3 || "");

            // Hold in Review if rule is configured for review first
            if ((matchedRule.approvalMode || "review") === "review") {
              const reviewComment: DBComment = {
                id: commentId,
                channelId: channel.id,
                author,
                authorAvatar,
                authorSubscribers: "0",
                authorHistoryCount: 0,
                text,
                videoTitle,
                videoThumbnail,
                publishedAt,
                status: "review",
                matchedRuleId: matchedRule.id,
                delayRemainingSeconds: 0,
                autoReplyText: replyText,
                replyFiredAt: null
              };
              db.comments.unshift(reviewComment);
              await logActivity("System", `Comment by ${author} held in review queue. Rule: '${matchedRule.name}'`);
              continue;
            }

            // Handle Humanization Delay if > 0
            if (matchedRule.delaySeconds > 0) {
              const delayedComment: DBComment = {
                id: commentId,
                channelId: channel.id,
                author,
                authorAvatar,
                authorSubscribers: "0",
                authorHistoryCount: 0,
                text,
                videoTitle,
                videoThumbnail,
                publishedAt,
                status: "matched",
                matchedRuleId: matchedRule.id,
                delayRemainingSeconds: matchedRule.delaySeconds,
                autoReplyText: replyText,
                replyFiredAt: null,
                matchedAt: new Date().toISOString()
              };
              db.comments.unshift(delayedComment);
              await logActivity("System", `Comment by ${author} matched rule '${matchedRule.name}'. Queued for humanization delay (${Math.round(matchedRule.delaySeconds / 60)}m)`);
              continue;
            }

            // Post Reply immediately (delaySeconds === 0 and autonomous mode)
            const ytResponse = await postCommentReply(channel.id, commentId, replyText);

            if (ytResponse) {
              // Successfully replied! Increment today counter
              activeUser.repliesToday++;
              repliedCount++;
              
              // Increment usage counter on template
              const tplIdx = db.templates.findIndex((t) => t.id === template.id);
              if (tplIdx >= 0) db.templates[tplIdx].usageCount++;

              // Save success entry in local DB
              const successComment: DBComment = {
                id: commentId,
                channelId: channel.id,
                author,
                authorAvatar,
                authorSubscribers: "0",
                authorHistoryCount: 1,
                text,
                videoTitle,
                videoThumbnail,
                publishedAt,
                status: "replied",
                matchedRuleId: matchedRule.id,
                delayRemainingSeconds: 0,
                autoReplyText: replyText,
                replyFiredAt: new Date().toISOString()
              };
              db.comments.unshift(successComment);
              await logActivity("System", `Auto-replied immediately to ${author}. Rule: '${matchedRule.name}'`);
            } else {
              // Mark comment check as failed
              const failedComment: DBComment = {
                id: commentId,
                channelId: channel.id,
                author,
                authorAvatar,
                authorSubscribers: "0",
                authorHistoryCount: 0,
                text,
                videoTitle,
                videoThumbnail,
                publishedAt,
                status: "failed",
                matchedRuleId: matchedRule.id,
                delayRemainingSeconds: 0,
                autoReplyText: "Failed to post comment to YouTube API. Check credentials or network connectivity.",
                replyFiredAt: null
              };
              db.comments.unshift(failedComment);
            }
          } else {
            // Log comment as skipped (no rule matches)
            const skippedComment: DBComment = {
              id: commentId,
              channelId: channel.id,
              author,
              authorAvatar,
              authorSubscribers: "0",
              authorHistoryCount: 0,
              text,
              videoTitle,
              videoThumbnail,
              publishedAt,
              status: "skipped",
              matchedRuleId: null,
              delayRemainingSeconds: 0,
              autoReplyText: null,
              replyFiredAt: null
            };
            db.comments.unshift(skippedComment);
          }
        }
      }
    }

    // Keep processed comments in database list at a max of 200 to keep it lightweight
    if (db.comments.length > 200) {
      db.comments = db.comments.slice(0, 200);
    }

    db.userSession = activeUser;
    await saveDB(db);

    return NextResponse.json({
      success: true,
      summary: {
        checkedCount,
        matchedCount,
        repliedCount,
        skippedCount,
        limitReached,
        repliesToday: activeUser.repliesToday,
        maxDailyLimit
      }
    });
  } catch (err: any) {
    console.error("Poller endpoint exception:", err);
    return NextResponse.json({ error: "Failed to poll comments: " + err.message }, { status: 500 });
  }
}
