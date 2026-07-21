"use client";

import React, { useEffect, useState } from "react";
import { useUIStore } from "@/frontend/store";
import { 
  Settings, 
  Users, 
  Activity, 
  Plus, 
  Trash2, 
  Mail, 
  Slack,
  Loader2,
  Gift
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

export default function SettingsPage() {
  const showToast = useUIStore((state) => state.showToast);
  const triggerRefresh = useUIStore((state) => state.triggerRefresh);
  const refreshTrigger = useUIStore((state) => state.refreshTrigger);

  const [workspaceName, setWorkspaceName] = useState("");
  const [dailyQuota, setDailyQuota] = useState(500);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [spamProtection, setSpamProtection] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [emailDigest, setEmailDigest] = useState("daily");
  const [negativeKeywords, setNegativeKeywords] = useState("");



  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Editor");
  const [inviting, setInviting] = useState(false);

  // Blocked user adding state
  const [newBlockedUser, setNewBlockedUser] = useState("");


  // Fetch settings, team, logs
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          const { workspace, activityLogs } = data;
          
          setWorkspaceName(workspace.name);
          setDailyQuota(workspace.settings.dailyReplyQuota);
          setBlockedUsers(workspace.settings.blockedUsers);
          setSpamProtection(workspace.settings.spamProtection);
          setSlackWebhook(workspace.settings.slackWebhook);
          setEmailDigest(workspace.settings.emailDigest);
          setNegativeKeywords(workspace.settings.negativeKeywords || "");

          setMembers(workspace.members);
          setLogs(activityLogs);
        }
      } catch (err) {
        console.error("Error loading settings page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [refreshTrigger]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName,
          settings: {
            dailyReplyQuota: dailyQuota,
            blockedUsers,
            spamProtection,
            slackWebhook,
            emailDigest,
            negativeKeywords
          }
        })
      });

      if (res.ok) {
        showToast("Workspace settings saved!", "success");
        triggerRefresh();
      } else {
        showToast("Failed to save settings.", "error");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };



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
        showToast(`Invitation sent to ${inviteEmail}`, "success");
        setInviteEmail("");
        triggerRefresh();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to invite teammate.", "error");
      }
    } catch (err) {
      console.error("Error inviting:", err);
    } finally {
      setInviting(false);
    }
  };

  const handleAddBlockedUser = () => {
    if (!newBlockedUser || blockedUsers.includes(newBlockedUser)) return;
    const updated = [...blockedUsers, newBlockedUser];
    setBlockedUsers(updated);
    setNewBlockedUser("");
    showToast(`Blocked user '${newBlockedUser}' added. Click save to persist.`, "info");
  };

  const handleRemoveBlockedUser = (user: string) => {
    const updated = blockedUsers.filter((u) => u !== user);
    setBlockedUsers(updated);
    showToast(`Removed '${user}' from blocklist. Click save to persist.`, "info");
  };

  if (loading) {
    return <div className="h-60 flex items-center justify-center text-xs text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 text-left max-w-5xl font-sans">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-lg font-bold text-[#202124] md:text-xl">
          Workspace Settings & Team
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage moderation configurations, integrations, and team roles.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
          

          {/* Preferences Box */}
          <form onSubmit={handleSaveSettings} className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
              <Settings className="h-5 w-5 text-google-blue shrink-0" />
              <h3 className="font-display text-sm font-bold text-slate-800">Preferences</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-google-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Daily Account Quota Cap</label>
                <input
                  type="number"
                  required
                  value={dailyQuota}
                  onChange={(e) => setDailyQuota(parseInt(e.target.value) || 100)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-google-blue"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Slack Integrations Webhook</label>
              <div className="relative">
                <Slack className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2.5 text-xs outline-none focus:border-google-blue"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Email Digest frequency</label>
                <select
                  value={emailDigest}
                  onChange={(e) => setEmailDigest(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-google-blue"
                >
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly summary</option>
                  <option value="off">Mute emails</option>
                </select>
              </div>

              <div className="flex flex-col justify-end pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-slate-150 p-2.5 hover:bg-slate-50 transition h-[38px]">
                  <input
                    type="checkbox"
                    checked={spamProtection}
                    onChange={(e) => setSpamProtection(e.target.checked)}
                    className="rounded border-slate-300 text-google-blue focus:ring-google-blue h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-700">Enable Spam Auto-moderator</span>
                </label>
              </div>
            </div>

            {/* Blocklist block */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">Blocked Commenters (Blocklist)</label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBlockedUser}
                  onChange={(e) => setNewBlockedUser(e.target.value)}
                  placeholder="Username to block"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-google-blue"
                />
                <button
                  type="button"
                  onClick={handleAddBlockedUser}
                  className="rounded-lg bg-slate-900 text-white text-xs font-semibold px-4 py-1.5 hover:bg-slate-800"
                >
                  Block User
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {blockedUsers.map((user) => (
                  <span
                    key={user}
                    className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    {user}
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedUser(user)}
                      className="text-red-400 hover:text-red-700 rounded-full"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Safety & Moderation global negative keywords block */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-left">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">
                Never auto-reply if comment contains:
              </label>
              <input
                type="text"
                value={negativeKeywords}
                onChange={(e) => setNegativeKeywords(e.target.value)}
                placeholder="e.g. scam, refund, disappointed, hate, fake, bot, report"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-google-blue font-sans"
              />
              <p className="text-[10px] text-slate-400">
                💡 Comments containing these comma-separated keywords skip all rules and go directly to your Manual Review Queue.
              </p>
            </div>

            {/* Submit button */}
            <div className="border-t border-slate-100 pt-4 text-right">
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-full bg-google-blue hover:bg-google-blue-pressed px-6 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Team Management */}
        <div className="space-y-6 md:col-span-1">
          {/* Members List */}
          <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
              <Users className="h-5 w-5 text-google-blue shrink-0" />
              <h3 className="font-display text-sm font-bold text-slate-800">Workspace Team</h3>
            </div>

            <div className="space-y-3.5">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-8 w-8 rounded-full border border-slate-150 object-cover"
                    />
                    <div className="text-left truncate">
                      <span className="font-bold text-slate-800 block truncate">{member.name}</span>
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
              ))}
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInvite} className="border-t border-slate-100 pt-4 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-700">Invite Collaborator</h4>
                <p className="text-[10px] text-slate-400">Invite a new workspace member by email.</p>
              </div>

              <div className="space-y-2 text-left">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-google-blue"
                />

                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-google-blue"
                >
                  <option value="Editor">Editor (Read/Write)</option>
                  <option value="Viewer">Viewer (Read-Only)</option>
                </select>

                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-800 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>


        </div>
      </div>

      {/* Full Audit Logs Section */}
      <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <Activity className="h-5 w-5 text-google-blue shrink-0" />
          <h3 className="font-display text-sm font-bold text-slate-800">Workspace Activity Audit Trail</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 font-bold">Collaborator</th>
                <th className="py-2.5 font-bold">Action Taken</th>
                <th className="py-2.5 font-bold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-bold text-slate-800">{log.user}</td>
                  <td className="py-3 font-medium text-slate-650">{log.action}</td>
                  <td className="py-3 text-right font-medium text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
