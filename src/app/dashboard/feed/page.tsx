"use client";

import React from "react";
import LiveCommentFeed from "@/frontend/components/LiveCommentFeed";
import CommentDetailsPanel from "@/frontend/components/CommentDetailsPanel";

export default function FeedPage() {
  return (
    <div className="space-y-6 text-left h-full relative">
      {/* Header section */}
      <div>
        <h1 className="font-display text-lg font-bold text-[#202124] md:text-xl">
          Real-Time Comment Feed
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Monitor incoming comments on active channels. Tap comment cards to inspect histories or edit draft replies.
        </p>
      </div>

      {/* Main Comment List component */}
      <LiveCommentFeed />

      {/* Slide-out Comment Details drawer panel */}
      <CommentDetailsPanel />
    </div>
  );
}
