"use client";

import React from "react";
import LiveCommentFeed from "@/frontend/components/LiveCommentFeed";
import CommentDetailsPanel from "@/frontend/components/CommentDetailsPanel";
import { AlertCircle } from "lucide-react";

export default function ReviewQueuePage() {
  return (
    <div className="space-y-6 text-left h-full relative">
      {/* Header section */}
      <div>
        <h1 className="font-display text-lg font-bold text-[#202124] md:text-xl flex items-center gap-2">
          Human Review Queue
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          These comments triggered matching rules but were flagged as ambiguous. Approve or edit replies before they dispatch.
        </p>
      </div>

      {/* Review Queue alert */}
      <div className="rounded-xl border border-amber-250 bg-amber-50/50 p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
        <AlertCircle className="h-4.5 w-4.5 text-accent-warning shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Manual Review Required</span>
          Auto-replies in the review queue will not fire automatically. You must inspect them, edit drafts if necessary, and click &ldquo;Send Now&rdquo; to approve.
        </div>
      </div>

      {/* Feed List (shows queue actions) */}
      <LiveCommentFeed />

      {/* Drawer inspector details */}
      <CommentDetailsPanel />
    </div>
  );
}
