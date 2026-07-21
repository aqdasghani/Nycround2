"use client";

import React, { useEffect, useState } from "react";
import { useUIStore } from "@/frontend/store";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { 
  TrendingUp, 
  BarChart2, 
  PieChart as PieIcon, 
  Activity,
  ListOrdered,
  DollarSign,
  Clock,
  Target,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function AnalyticsCharts() {
  const activeChannelId = useUIStore((state) => state.activeChannelId);
  const refreshTrigger = useUIStore((state) => state.refreshTrigger);

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    if (mounted) {
      fetchAnalytics();
    }
  }, [mounted, activeChannelId, refreshTrigger]);

  if (!mounted || loading || !data) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-60 rounded-xl bg-white border border-[#dadce0] p-5 animate-pulse flex flex-col justify-between">
            <div className="h-4 w-1/3 bg-slate-200 rounded" />
            <div className="h-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const { kpis, repliesPerDay, topKeywords, outcomeBreakdown, rulePerformance } = data;

  return (
    <div className="space-y-6">
      {/* 1. KPI Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comments Processed</span>
            <span className="font-display text-lg font-bold text-[#202124]">{kpis.commentsProcessed}</span>
          </div>
          <div className="h-10 w-10 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-center text-slate-500">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Match Accuracy %</span>
            <span className="font-display text-lg font-bold text-[#202124]">{kpis.matchAccuracy}</span>
          </div>
          <div className="h-10 w-10 bg-green-50 border border-green-150 rounded-lg flex items-center justify-center text-accent-success">
            <Target className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time Hours Saved</span>
            <span className="font-display text-lg font-bold text-[#202124]">{kpis.hoursSaved}</span>
          </div>
          <div className="h-10 w-10 bg-blue-50 border border-blue-150 rounded-lg flex items-center justify-center text-google-blue">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auto-Replies Sent</span>
            <span className="font-display text-lg font-bold text-[#202124]">{kpis.repliesSent}</span>
          </div>
          <div className="h-10 w-10 bg-purple-50 border border-purple-150 rounded-lg flex items-center justify-center text-purple-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 2. Primary Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Line Chart Card (Replies over time) */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <TrendingUp className="h-5 w-5 text-google-blue shrink-0" />
            <h4 className="font-display text-sm font-bold text-slate-800">Replies Sent (Last 30 Days)</h4>
          </div>
          
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={repliesPerDay} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                <XAxis dataKey="date" stroke="#80868b" />
                <YAxis stroke="#80868b" />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px", borderColor: "#dadce0" }} />
                <Line 
                  type="monotone" 
                  dataKey="replies" 
                  stroke="#1A73E8" 
                  strokeWidth={2.5} 
                  dot={false}
                  activeDot={{ r: 5 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart Card (Outcome Breakdown) */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <PieIcon className="h-5 w-5 text-google-blue shrink-0" />
            <h4 className="font-display text-sm font-bold text-slate-800">Reply Outcomes Breakdown</h4>
          </div>

          <div className="h-48 w-full flex items-center justify-center text-xs relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {outcomeBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} items`, "Outcome"]} contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center metric */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Success Rate</span>
              <span className="font-display text-base font-bold text-slate-800">{kpis.matchAccuracy}</span>
            </div>
          </div>

          {/* Custom Legends list */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 mt-2">
            {outcomeBreakdown.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 justify-start">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name}: <span className="text-slate-800">{item.value}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Keyword Frequency + Rule Performance Table Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Keywords Bar Chart */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <BarChart2 className="h-5 w-5 text-google-blue shrink-0" />
            <h4 className="font-display text-sm font-bold text-slate-800">Top 10 Triggered Keywords</h4>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topKeywords} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f3f4" />
                <XAxis type="number" stroke="#80868b" />
                <YAxis dataKey="keyword" type="category" stroke="#80868b" width={75} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                <Bar dataKey="count" fill="#1A73E8" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rule Performance Table */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <ListOrdered className="h-5 w-5 text-google-blue shrink-0" />
              <h4 className="font-display text-sm font-bold text-slate-800">Rule Trigger Metrics</h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 font-bold">Rule Name</th>
                    <th className="py-2.5 font-bold text-right">Triggers</th>
                    <th className="py-2.5 font-bold text-right">AI Confidence</th>
                    <th className="py-2.5 font-bold text-right">Reply Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700">
                  {rulePerformance.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-3 text-right font-medium">{item.triggerCount}</td>
                      <td className="py-3 text-right font-medium">{item.confidence}</td>
                      <td className="py-3 text-right">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[10px]
                          ${item.replyRate !== "0%" ? "bg-green-50 text-accent-success border border-green-150" : "bg-slate-100 text-slate-400"}
                        `}>
                          {item.replyRate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4 text-right">
            <span className="text-[10px] text-slate-400 font-semibold italic">
              All stats recalculate dynamically based on active rules.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
