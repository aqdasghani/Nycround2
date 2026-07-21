import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/database/db";

export async function GET(req: NextRequest) {
  const db = await getDB();
  
  // Calculate 100% real stats from actual db comments
  const liveReplied = db.comments.filter((c) => c.status === "replied").length;
  const liveSkipped = db.comments.filter((c) => c.status === "skipped").length;
  const liveReview = db.comments.filter((c) => c.status === "review").length;
  const liveFailed = db.comments.filter((c) => c.status === "failed").length;
  const liveMatched = db.comments.filter((c) => c.status === "matched").length;
  
  const totalReplied = liveReplied;
  const totalProcessed = db.comments.length;
  
  // Hours saved: 2.5 minutes per reply
  const hoursSaved = totalReplied > 0 ? parseFloat(((totalReplied * 2.5) / 60).toFixed(1)) : 0;
  
  // Calculate accuracy: (Replied + Skipped + Review) / Checked. 
  // If no comments checked, default to 100%.
  let matchAccuracy = 100;
  if (totalProcessed > 0) {
    const validMatches = totalProcessed - liveFailed;
    matchAccuracy = parseFloat(((validMatches / totalProcessed) * 100).toFixed(1));
  }

  // 1. Line chart: Auto-replies sent per day (last 30 days) from real timestamps
  const repliesPerDay = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    // Filter comments replied on this day
    const dayStartStr = d.toISOString().split("T")[0];
    const repliesOnDay = db.comments.filter((c) => {
      if (c.status !== "replied" || !c.replyFiredAt) return false;
      return c.replyFiredAt.split("T")[0] === dayStartStr;
    }).length;

    repliesPerDay.push({ date: dateLabel, replies: repliesOnDay });
  }

  // 2. Bar chart: Triggered keywords in comments
  const keywordsMap: { [key: string]: number } = {
    price: 0,
    cost: 0,
    "how much": 0,
    discount: 0,
    coupon: 0,
    support: 0,
    broken: 0,
    promo: 0,
    error: 0,
    help: 0
  };

  db.comments.forEach((c) => {
    const textLower = c.text.toLowerCase();
    Object.keys(keywordsMap).forEach((kw) => {
      if (textLower.includes(kw)) {
        keywordsMap[kw]++;
      }
    });
  });

  const topKeywords = Object.keys(keywordsMap).map((kw) => ({
    keyword: kw,
    count: keywordsMap[kw]
  })).sort((a, b) => b.count - a.count);

  // 3. Donut chart: Reply outcome breakdown
  const outcomeBreakdown = [
    { name: "Sent (Auto)", value: totalReplied, color: "#1A73E8" },
    { name: "Skipped", value: liveSkipped, color: "#5F6368" },
    { name: "Needs Review", value: liveReview, color: "#FBBC04" },
    { name: "Failed / Quota", value: liveFailed, color: "#EA4335" }
  ];

  // 4. Table: Rule performance
  const rulePerformance = db.rules.map((rule) => {
    const matchCount = db.comments.filter((c) => c.matchedRuleId === rule.id).length;
    const repliedMatches = db.comments.filter((c) => c.matchedRuleId === rule.id && c.status === "replied").length;
    
    let ruleAccuracy = 100;
    if (matchCount > 0) {
      ruleAccuracy = Math.round((repliedMatches / matchCount) * 100);
    }
    
    return {
      id: rule.id,
      name: rule.name,
      triggerCount: matchCount,
      confidence: rule.isActive ? `${ruleAccuracy}%` : "—",
      replyRate: rule.isActive ? `${ruleAccuracy}%` : "0%"
    };
  });

  return NextResponse.json({
    kpis: {
      commentsProcessed: totalProcessed.toLocaleString(),
      matchAccuracy: `${matchAccuracy}%`,
      hoursSaved: `${hoursSaved} hrs`,
      repliesSent: totalReplied.toLocaleString()
    },
    repliesPerDay,
    topKeywords,
    outcomeBreakdown,
    rulePerformance
  });
}
