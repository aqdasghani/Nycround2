import { NextRequest, NextResponse } from "next/server";
import { getDB, saveDB, logActivity, Rule } from "@/database/db";

export async function GET() {
  const db = await getDB();
  const sortedRules = [...db.rules].sort((a, b) => a.priority - b.priority);
  return NextResponse.json(sortedRules);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      conditions,
      operator,
      filters,
      templateId,
      delaySeconds,
      dailyLimit,
      colorLabel,
      customVariable1,
      customVariable2,
      customVariable3,
      approvalMode
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Missing rule name" }, { status: 400 });
    }

    const db = await getDB();
    
    // Determine priority (max priority + 1)
    const maxPriority = db.rules.reduce((max, r) => r.priority > max ? r.priority : max, 0);
    
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      name,
      isActive: true,
      priority: maxPriority + 1,
      colorLabel: colorLabel || "blue",
      conditions: conditions || [],
      operator: operator || "OR",
      filters: filters || { topLevelOnly: true, maxRepliesPerUser: 5, language: "auto" },
      templateId: templateId || "",
      delaySeconds: delaySeconds || 180,
      dailyLimit: dailyLimit || 50,
      customVariable1: customVariable1 || "",
      customVariable2: customVariable2 || "",
      customVariable3: customVariable3 || "",
      approvalMode: approvalMode || "review"
    };

    db.rules.push(newRule);
    await saveDB(db);

    await logActivity(db.userSession?.name || "Creator", `Created rule '${name}'`);

    return NextResponse.json(newRule, { status: 201 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}
