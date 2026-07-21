"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUIStore } from "@/frontend/store";
import { 
  Activity, 
  Target, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Sliders,
  MessageSquare,
  History,
  TrendingUp
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
  const [rules, setRules] = useState<any[]>([]);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  // Fetch KPI, logs, rules, and user tier session
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [analRes, setRes, rulesRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/settings"),
          fetch("/api/rules")
        ]);

        if (analRes.ok && setRes.ok && rulesRes.ok) {
          const analData = await analRes.json();
          const setData = await setRes.json();
          const rulesData = await rulesRes.json();
          
          setKpis(analData.kpis);
          setLogs(setData.activityLogs.slice(0, 5)); // show latest 5
          setRules(rulesData);
          setUserSession(setData.userSession || null);
        }
      } catch (err) {
        console.error("Error fetching dashboard overview data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [activeChannelId, refreshTrigger]);

  const toggleRuleActive = async (ruleId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        showToast("Rule status toggled", "success");
        // Reload dashboard state
        const rulesRes = await fetch("/api/rules");
        if (rulesRes.ok) {
          setRules(await rulesRes.json());
        }
      }
    } catch (err) {
      console.error("Rule toggle error:", err);
    }
  };

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setRedeeming(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Subscription upgraded to Premium!", "success");
        setCouponCode("");
        setUserSession(data.userSession);
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to redeem coupon", "error");
      }
    } catch (err) {
      console.error("Redeem error:", err);
      showToast("Network error redeeming coupon", "error");
    } finally {
      setRedeeming(false);
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

      {/* 2. Primary Sections: Rules list & Activity logs */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Rules Card */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-google-blue shrink-0" />
                <h4 className="font-display text-sm font-bold text-slate-800">Active Keyword Rules</h4>
              </div>
              <Link href="/dashboard/rules" className="text-[11px] font-semibold text-google-blue hover:underline inline-flex items-center gap-0.5">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-150 bg-slate-50/50 text-xs">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0
                      ${rule.colorLabel === "red" ? "bg-accent-live" : ""}
                      ${rule.colorLabel === "blue" ? "bg-google-blue" : ""}
                      ${rule.colorLabel === "yellow" ? "bg-accent-warning" : ""}
                      ${rule.colorLabel === "green" ? "bg-accent-success" : ""}
                    `} />
                    <div className="truncate">
                      <span className="font-bold text-slate-850 block truncate">{rule.name}</span>
                      <span className="text-[10px] text-slate-400 truncate block font-medium">
                        Delay: {Math.round(rule.delaySeconds / 60)} min · Matches: {rule.conditions.map((c: any) => c.value).join(", ")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleRuleActive(rule.id, rule.isActive)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
                      ${rule.isActive ? "bg-google-blue" : "bg-slate-200"}
                    `}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                        ${rule.isActive ? "translate-x-4" : "translate-x-0"}
                      `}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3.5 mt-4">
            <Link 
              href="/dashboard/rules/new"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-google-blue hover:bg-google-blue-pressed py-2 text-xs font-semibold text-white transition active:scale-98 shadow-sm"
            >
              <Sliders className="h-4 w-4" />
              Configure New Rule
            </Link>
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
              
              <Link href="/dashboard/settings" className="text-[11px] font-semibold text-google-blue hover:underline inline-flex items-center gap-0.5">
                Full logs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {logs.map((log) => (
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
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3.5 mt-4">
            <Link 
              href="/dashboard/feed"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-google-blue text-google-blue hover:bg-blue-50 py-2 text-xs font-semibold transition active:scale-98 shadow-sm"
            >
              <MessageSquare className="h-4 w-4" />
              Open Live Feed
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
