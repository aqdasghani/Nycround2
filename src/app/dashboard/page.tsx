"use client";

import React, { useEffect, useState } from "react";
import { useUIStore } from "@/frontend/store";
import { 
  Activity, 
  Target, 
  Clock, 
  CheckCircle, 
  Sliders,
  History,
  Save
} from "lucide-react";

interface UserSession {
  email: string;
  name: string;
  tier: "free" | "premium";
  repliesToday: number;
  lastResetDate: string;
}

export default function DashboardOverviewPage() {
  const activeChannelId = useUIStore((state) => state.activeChannelId);
  const refreshTrigger = useUIStore((state) => state.refreshTrigger);
  const triggerRefresh = useUIStore((state) => state.triggerRefresh);
  const showToast = useUIStore((state) => state.showToast);

  const [kpis, setKpis] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [globalConfig, setGlobalConfig] = useState({
    replyToAll: false,
    tags: "",
    template: "Thank you for commenting!"
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch KPI, logs, rules, and user tier session
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [analRes, setRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/settings")
        ]);

        if (analRes.ok && setRes.ok) {
          const analData = await analRes.json();
          const setData = await setRes.json();
          
          setKpis(analData.kpis);
          setLogs(setData.activityLogs.slice(0, 5)); // show latest 5
          setUserSession(setData.userSession || null);
          if (setData.workspace?.settings?.globalReplyConfig) {
            setGlobalConfig(setData.workspace.settings.globalReplyConfig);
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard overview data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [activeChannelId, refreshTrigger]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { globalReplyConfig: globalConfig } })
      });
      if (res.ok) {
        showToast("Configuration saved successfully", "success");
      } else {
        showToast("Failed to save configuration", "error");
      }
    } catch (err) {
      console.error("Save config error:", err);
      showToast("Network error saving config", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading || !kpis) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-1/4 bg-slate-200 rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white border border-[#dadce0] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-60 bg-white border border-[#dadce0] rounded-xl animate-pulse" />
          <div className="h-60 bg-white border border-[#dadce0] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const maxQuota = 200;
  const usagePercentage = Math.min(100, Math.round(((userSession?.repliesToday || 0) / maxQuota) * 100));

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-lg font-bold text-[#202124] md:text-xl">
          Workspace Overview
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics, active keyword configurations, and collaborator activity logs.
        </p>
      </div>

      {/* User Session & Subscription Limits Panel */}
      {userSession && (
        <div className="rounded-xl border border-[#dadce0] bg-white p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-google-blue-light border border-blue-150 rounded-lg flex items-center justify-center text-google-blue text-lg shrink-0">
              👤
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">{userSession.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  Daily Automation Usage: <span className="font-bold text-slate-700">{userSession.repliesToday}</span> / {maxQuota} replies today
                </span>
                
                {/* Visual Progress Bar */}
                <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden border">
                  <div 
                    className={`h-full rounded-full transition-all duration-300
                      ${usagePercentage >= 90 ? "bg-red-500" : usagePercentage >= 70 ? "bg-amber-500" : "bg-google-blue"}
                    `}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>


        </div>
      )}

      {/* 1. KPIs Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comments Checked</span>
            <span className="font-display text-lg font-bold text-[#202124]">{kpis.commentsProcessed}</span>
          </div>
          <div className="h-10 w-10 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-center text-slate-500">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Accuracy</span>
            <span className="font-display text-lg font-bold text-[#202124]">{kpis.matchAccuracy}</span>
          </div>
          <div className="h-10 w-10 bg-green-50 border border-green-150 rounded-lg flex items-center justify-center text-accent-success">
            <Target className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Creator Hours Saved</span>
            <span className="font-display text-lg font-bold text-[#202124]">{kpis.hoursSaved}</span>
          </div>
          <div className="h-10 w-10 bg-blue-50 border border-blue-150 rounded-lg flex items-center justify-center text-google-blue">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Replies Dispatched</span>
            <span className="font-display text-lg font-bold text-[#202124]">{kpis.repliesSent}</span>
          </div>
          <div className="h-10 w-10 bg-purple-50 border border-purple-150 rounded-lg flex items-center justify-center text-purple-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 2. Primary Sections: Global Config & Activity logs */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Global Config Card */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-google-blue shrink-0" />
                <h4 className="font-display text-sm font-bold text-slate-800">Global Reply Configuration</h4>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={globalConfig.replyToAll}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, replyToAll: e.target.checked })}
                  className="rounded border-slate-300 text-google-blue focus:ring-google-blue"
                />
                Reply to All Comments (Ignores Tags)
              </label>

              {!globalConfig.replyToAll && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Tags / Keywords (Comma separated)</label>
                  <input 
                    type="text"
                    value={globalConfig.tags}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, tags: e.target.value })}
                    placeholder="e.g. awesome, love it, thanks"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-google-blue focus:outline-none focus:ring-1 focus:ring-google-blue"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Auto-Reply Template</label>
                <textarea 
                  value={globalConfig.template}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, template: e.target.value })}
                  placeholder="Thank you for commenting!"
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-google-blue focus:outline-none focus:ring-1 focus:ring-google-blue resize-none"
                />
                <p className="text-[10px] text-slate-400">Available tokens: {"{{commenter_name}}, {{video_title}}, {{reply_date}}"}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3.5 mt-4">
            <button 
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-google-blue hover:bg-google-blue-pressed py-2 text-xs font-semibold text-white transition active:scale-98 shadow-sm disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {savingConfig ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>

        {/* Activity Logs Card */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-google-blue shrink-0" />
                <h4 className="font-display text-sm font-bold text-slate-800">Workspace Activity Audit</h4>
              </div>
            </div>

            <div className="space-y-3">
              {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="flex gap-2.5 text-xs text-slate-650 items-start">
                  <div className="h-2 w-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800">
                      <span className="font-bold text-slate-900">{log.user}</span>: {log.action}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
