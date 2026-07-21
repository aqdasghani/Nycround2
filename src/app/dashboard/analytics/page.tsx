"use client";

import React, { useState } from "react";
import { useUIStore } from "@/frontend/store";
import AnalyticsCharts from "@/frontend/components/AnalyticsCharts";
import { Calendar, ChevronDown, Download, RefreshCw } from "lucide-react";

export default function AnalyticsPage() {
  const showToast = useUIStore((state) => state.showToast);
  const triggerRefresh = useUIStore((state) => state.triggerRefresh);
  const [dateRange, setDateRange] = useState("30d");

  const handleRangeChange = (val: string) => {
    setDateRange(val);
    showToast(`Analytics updated for past ${val === "7d" ? "7 days" : val === "90d" ? "90 days" : "30 days"}`, "success");
    triggerRefresh();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-3.5">
        <div>
          <h1 className="font-display text-lg font-bold text-[#202124] md:text-xl">
            Analytics & Channel Insights
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit automatic reply counts, match accuracy ratios, saved time, and keyword frequencies.
          </p>
        </div>

        {/* Date Selector and Download controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Quick Picker dropdown */}
          <div className="relative inline-flex items-center rounded-lg bg-white border border-[#dadce0] px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer">
            <Calendar className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => handleRangeChange(e.target.value)}
              className="bg-transparent outline-none pr-6 cursor-pointer appearance-none w-full"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <ChevronDown className="h-4 w-4 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Export Report CSV */}
          <button
            onClick={() => showToast("Exporting report as CSV...", "success")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white text-slate-700 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 shadow-sm transition active:scale-95 shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Analytics charts and metrics component */}
      <AnalyticsCharts />
    </div>
  );
}
