import { NextRequest, NextResponse } from "next/server";
import { getDB, saveDB, logActivity, Template } from "@/database/db";

export async function GET() {
  const db = await getDB();
  return NextResponse.json(db.templates);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, emoji, body: templateBody, variants } = body;

    if (!name || !templateBody) {
      return NextResponse.json({ error: "Missing template name or body content" }, { status: 400 });
    }

    const db = await getDB();
    const newTemplate: Template = {
      id: `tpl-${Date.now()}`,
      name,
      emoji: emoji || "💬",
      body: templateBody,
      variants: variants || [templateBody],
      usageCount: 0,
      lastEdited: new Date().toISOString()
    };

    db.templates.push(newTemplate);
    await saveDB(db);

    await logActivity(db.userSession?.name || "Creator", `Created template '${name}'`);

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
