import { NextRequest, NextResponse } from "next/server";
import { getDB, saveDB, logActivity, WorkspaceMember } from "@/database/db";

export async function GET() {
  const db = await getDB();
  return NextResponse.json({
    workspace: db.workspace,
    activityLogs: db.activityLogs,
    userSession: db.userSession
  });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDB();

    if (body.settings) {
      db.workspace.settings = {
        ...db.workspace.settings,
        ...body.settings
      };
    }

    if (body.name) {
      db.workspace.name = body.name;
    }

    if (body.userSession) {
      db.userSession = {
        ...db.userSession,
        ...body.userSession
      };
    }


    await saveDB(db);
    await logActivity(db.userSession?.name || "Creator", "Updated workspace configuration parameters");

    return NextResponse.json({ 
      success: true, 
      workspace: db.workspace,
      userSession: db.userSession
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

// Invite team members
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Missing email or role" }, { status: 400 });
    }

    const db = await getDB();
    
    // Check if user already exists
    if (db.workspace.members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: "User is already a member of this workspace" }, { status: 400 });
    }

    // Generate a default name from the email
    const namePart = email.split("@")[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._]/g, " ");

    const newMember: WorkspaceMember = {
      id: `m-${Date.now()}`,
      email,
      name: formattedName,
      role,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?w=150`
    };

    db.workspace.members.push(newMember);
    await saveDB(db);

    await logActivity(db.userSession?.name || "Creator", `Invited team member ${formattedName} (${email}) as ${role}`);

    return NextResponse.json(newMember, { status: 201 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
  }
}
