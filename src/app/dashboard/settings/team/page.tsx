"use client";

import React, { useEffect, useState } from "react";
import { useUIStore } from "@/frontend/store";
import { 
  Users, 
  Plus, 
  Trash2, 
  Mail, 
  ShieldAlert,
  Loader2
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function TeamManagementPage() {
  const showToast = useUIStore((state) => state.showToast);
  const triggerRefresh = useUIStore((state) => state.triggerRefresh);
  const refreshTrigger = useUIStore((state) => state.refreshTrigger);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Editor");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setMembers(data.workspace.members);
        }
      } catch (err) {
        console.error("Error loading team data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, [refreshTrigger]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      if (res.ok) {
        showToast(`Teammate invite sent to ${inviteEmail}`, "success");
        setInviteEmail("");
        triggerRefresh();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to invite member", "error");
      }
    } catch (err) {
      console.error("Error inviting team member:", err);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-lg font-bold text-[#202124] md:text-xl">
          Team Member Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Invite operators and set roles to collaborate per workspace.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Invite Form */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm space-y-4 md:col-span-1">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-800">Add Team Member</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Assign access privileges to email addresses.</p>
          </div>

          <form onSubmit={handleInvite} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Email Address</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@acme.com"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-google-blue"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Workspace Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-google-blue"
              >
                <option value="Editor">Editor (Read/Write)</option>
                <option value="Viewer">Viewer (Read-Only)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={inviting || !inviteEmail}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-google-blue hover:bg-google-blue-pressed py-2 text-xs font-semibold text-white transition disabled:opacity-50"
            >
              {inviting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending Invite...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Send Invitation
                </>
              )}
            </button>
          </form>
        </div>

        {/* Members List */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm space-y-4 md:col-span-2">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-800">Workspace Collaborators</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Active profiles inside Acme Creator Network.</p>
          </div>

          <div className="space-y-3.5 divide-y divide-slate-100">
            {loading ? (
              <div className="text-center text-xs text-slate-400 py-6">Loading team list...</div>
            ) : (
              members.map((member, idx) => (
                <div key={member.id} className={`flex items-center justify-between gap-3 text-xs pt-3 ${idx === 0 ? "pt-0 border-t-0" : ""}`}>
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-8.5 w-8.5 rounded-full border border-slate-150 object-cover"
                    />
                    <div className="text-left truncate">
                      <span className="font-bold text-slate-850 block truncate">{member.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate font-medium">{member.email}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px]
                    ${member.role === "Owner" ? "bg-red-50 text-accent-live border border-red-150" : ""}
                    ${member.role === "Editor" ? "bg-blue-50 text-google-blue border border-blue-150" : ""}
                    ${member.role === "Viewer" ? "bg-slate-100 text-slate-500" : ""}
                  `}>
                    {member.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
