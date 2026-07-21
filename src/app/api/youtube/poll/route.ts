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

    // 1. Delayed comments processing removed for simplicity
    const now = Date.now();

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

          // Evaluate against Rules (priority ordered)
          const activeRules = [...(db.rules || [])].filter(r => r.isActive).sort((a, b) => a.priority - b.priority);
          
          let matchedRule = null;
          
          for (const rule of activeRules) {
            const checkCond = (c: any) => {
              if (c.type === "reply_all") return true;
              const v = c.value?.toLowerCase().trim();
              if (!v) return false;
              if (c.type === "contains") return commentTextLower.includes(v);
              if (c.type === "equals") return commentTextLower === v;
              if (c.type === "starts_with") return commentTextLower.startsWith(v);
              return false;
            };

            const isRuleMatch = rule.operator === "OR"
              ? rule.conditions.some(checkCond)
              : rule.conditions.every(checkCond);

            if (isRuleMatch) {
              matchedRule = rule;
              break;
            }
          }
          
          let isMatch = !!matchedRule;
          let replyTextTemplate = "Thank you for commenting!";
          let matchedRuleId = matchedRule ? matchedRule.id : null;
          let customVar1 = "";
          let customVar2 = "";
          let customVar3 = "";

          if (isMatch && matchedRule) {
            const matchedTemplate = db.templates?.find((t: any) => t.id === matchedRule.templateId);
            if (matchedTemplate) replyTextTemplate = matchedTemplate.body;
            customVar1 = matchedRule.customVariable1 || "";
            customVar2 = matchedRule.customVariable2 || "";
            customVar3 = matchedRule.customVariable3 || "";
          } else {
             // Fallback to global config if no rules matched
             const globalConfig = db.workspace?.settings?.globalReplyConfig || {
               replyToAll: false,
               tags: "",
               template: "Thank you for commenting!"
             };
             if (globalConfig.replyToAll) {
               isMatch = true;
               replyTextTemplate = globalConfig.template;
               matchedRuleId = "global";
             } else if (globalConfig.tags.trim().length > 0) {
               const tags = globalConfig.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
               if (tags.some(tag => commentTextLower.includes(tag))) {
                 isMatch = true;
                 replyTextTemplate = globalConfig.template;
                 matchedRuleId = "global";
               }
             }
          }

          if (isMatch) {
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
                matchedRuleId: "global",
                delayRemainingSeconds: 0,
                autoReplyText: "Daily reply quota limit reached for this account.",
                replyFiredAt: null
              };
              db.comments.unshift(skippedComment);
              continue;
            }

            let replyText = replyTextTemplate
              .replace(/\{\{commenter_name\}\}/g, author)
              .replace(/\{\{video_title\}\}/g, videoTitle)
              .replace(/\{\{channel_name\}\}/g, channel.name)
              .replace(/\{\{reply_date\}\}/g, new Date().toLocaleDateString())
              .replace(/\{\{custom_variable_1\}\}/g, customVar1)
              .replace(/\{\{custom_variable_2\}\}/g, customVar2)
              .replace(/\{\{custom_variable_3\}\}/g, customVar3);

            // Post Reply immediately
            const ytResponse = await postCommentReply(channel.id, commentId, replyText);

            if (ytResponse) {
              // Successfully replied! Increment today counter
              activeUser.repliesToday++;
              repliedCount++;
              
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
                matchedRuleId: matchedRuleId || "global",
                delayRemainingSeconds: 0,
                autoReplyText: replyText,
                replyFiredAt: new Date().toISOString()
              };
              db.comments.unshift(successComment);
              await logActivity("System", `Auto-replied immediately to ${author} using Global Settings`);
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
                matchedRuleId: matchedRuleId || "global",
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
