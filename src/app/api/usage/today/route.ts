import { NextResponse } from "next/server";
import { getDB } from "@/database/db";

const FREE_DAILY_LIMIT = 10;

export async function GET() {
  try {
    const db = await getDB();
    const session = db.userSession;

    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const used = session.repliesToday || 0;
    const DAILY_LIMIT = 200;

    return NextResponse.json({
      used,
      limit: DAILY_LIMIT,
      tier: "active",
      isUnlimited: false,
      remaining: Math.max(0, DAILY_LIMIT - used),
      lastResetDate: session.lastResetDate,
    });
  } catch (err) {
    console.error("Usage API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
