"use client";

import React, { useEffect, useState } from "react";
import { useUIStore } from "@/frontend/store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  XOctagon, 
  UserMinus, 
  Edit3, 
  HelpCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Youtube,
  Wifi,
  Sparkles,
  Video
} from "lucide-react";

interface Comment {
  id: string;
  channelId: string;
  author: string;
  authorAvatar: string;
  authorSubscribers: string;
  authorHistoryCount: number;
  text: string;
  videoTitle: string;
  videoThumbnail: string;
  publishedAt: string;
  status: "matched" | "review" | "replied" | "skipped" | "failed";
  matchedRuleId: string | null;
  delayRemainingSeconds: number;
  autoReplyText: string | null;
  replyFiredAt: string | null;
}

export default function LiveCommentFeed() {
  const activeChannelId = useUIStore((state) => state.activeChannelId);
  const selectedCommentId = useUIStore((state) => state.selectedCommentId);
  const setSelectedCommentId = useUIStore((state) => state.setSelectedCommentId);
  const showToast = useUIStore((state) => state.showToast);
  const refreshTrigger = useUIStore((state) => state.refreshTrigger);
  const triggerRefresh = useUIStore((state) => state.triggerRefresh);

  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "matched" | "review">("all");
  const [loading, setLoading] = useState(true);

  // Statistics counters
  const [processedToday, setProcessedToday] = useState(47);
  const [repliedCount, setRepliedCount] = useState(12);

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      try {
        let url = `/api/comments?channelId=${activeChannelId}`;
        if (activeTab === "matched") {
          url += "&status=matched";
        } else if (activeTab === "review") {
          url += "&status=review";
        }
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          // Filter to match the active sidebar channel
          const filtered = data.filter((c: Comment) => c.channelId === activeChannelId);
          setComments(filtered);
        }
      } catch (err) {
        console.error("Error fetching comments in feed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchComments();
  }, [activeChannelId, activeTab, refreshTrigger]);

  // Statistics calculation
  useEffect(() => {
    async function calculateStats() {
      try {
        const res = await fetch("/api/comments");
        if (res.ok) {
          const allComments = await res.json();
          const channelComments = allComments.filter((c: Comment) => c.channelId === activeChannelId);
          
          const autoReplied = channelComments.filter((c: Comment) => c.status === "replied").length;
          setRepliedCount(12 + autoReplied);
          setProcessedToday(47 + channelComments.length);
        }
      } catch (err) {
        console.error("Error calculating stats:", err);
      }
    }
    calculateStats();
  }, [activeChannelId, refreshTrigger]);

  // Client-side timer ticker interval
  useEffect(() => {
    const timer = setInterval(() => {
      setComments((prevComments) => {
        let changed = false;
        const nextComments = prevComments.map((comment) => {
          if (comment.status === "matched" && comment.delayRemainingSeconds > 0) {
            changed = true;
            const nextVal = comment.delayRemainingSeconds - 1;
            if (nextVal <= 0) {
              // Trigger sync reload
              setTimeout(() => {
                triggerRefresh();
              }, 100);
              return {
                ...comment,
                status: "replied" as Comment["status"],
                delayRemainingSeconds: 0,
                replyFiredAt: new Date().toISOString()
              };
            }
            return {
              ...comment,
              delayRemainingSeconds: nextVal
            };
          }
          return comment;
        });

        return nextComments;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [triggerRefresh]);

  const handleSendNow = async (commentId: string, replyText: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoReplyText: replyText })
      });

      if (res.ok) {
        showToast("Auto-reply sent successfully!", "success");
        triggerRefresh();
      }
    } catch (err) {
      console.error("Error sending reply now:", err);
    }
  };

  const handleSkip = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/skip`, {
        method: "POST"
      });

      if (res.ok) {
        showToast("Auto-reply skipped.", "warning");
        triggerRefresh();
      }
    } catch (err) {
      console.error("Error skipping comment:", err);
    }
  };

  const handleBlock = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/block`, {
        method: "POST"
      });

      if (res.ok) {
        showToast("User blocked and pending actions cancelled.", "error");
        triggerRefresh();
      }
    } catch (err) {
      console.error("Error blocking commenter:", err);
    }
  };

  const triggerForceSpawn = async () => {
    showToast("Simulating a new comment trigger...", "info");
    try {
      const res = await fetch(`/api/comments?forceSpawn=true`);
      if (res.ok) {
        triggerRefresh();
      }
    } catch (err) {
      console.error("Error spawning comment:", err);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const borderCol = (status: Comment["status"]) => {
    if (status === "replied") return "border-l-[4px] border-l-accent-success";
    if (status === "matched") return "border-l-[4px] border-l-google-blue";
    if (status === "review") return "border-l-[4px] border-l-accent-warning";
    if (status === "skipped") return "border-l-[4px] border-l-slate-300";
    return "border-l-[4px] border-l-slate-200";
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Real-time Ticker & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dadce0] pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 font-semibold text-accent-live text-xs">
            <span className="h-2 w-2 rounded-full bg-accent-live live-pulse" />
            <span>● LIVE ACTIVITY</span>
          </div>
          
          <button
            onClick={triggerForceSpawn}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 border border-slate-200 transition active:scale-95 cursor-pointer"
            title="Inject a simulated YouTube comment immediately"
          >
            <Sparkles className="h-3 w-3 text-google-blue" />
            Simulate Comment
          </button>
        </div>

        {/* Real-time Stats */}
        <div className="text-[11px] font-semibold text-[#5f6368] bg-[#f8f9fa] border border-[#dadce0] px-3.5 py-1.5 rounded-lg">
          {processedToday} processed today <span className="text-[#dadce0] mx-1">•</span> {repliedCount} auto-replied <span className="text-[#dadce0] mx-1">•</span> 0 errors
        </div>
      </div>

      {/* Tabs list filter */}
      <div className="flex items-center justify-between">
        <div className="flex border-b border-[#dadce0] w-full">
          <button
            onClick={() => setActiveTab("all")}
            className={`border-b-2 px-4 py-2 text-xs font-semibold tracking-wide transition-all
              ${activeTab === "all" ? "border-google-blue text-google-blue font-bold" : "border-transparent text-slate-500 hover:text-slate-800"}
            `}
          >
            All Activity
          </button>
          <button
            onClick={() => setActiveTab("matched")}
            className={`border-b-2 px-4 py-2 text-xs font-semibold tracking-wide transition-all
              ${activeTab === "matched" ? "border-google-blue text-google-blue font-bold" : "border-transparent text-slate-500 hover:text-slate-800"}
            `}
          >
            Queued & Sent ({comments.filter(c => c.status === "matched" || c.status === "replied").length})
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`border-b-2 px-4 py-2 text-xs font-semibold tracking-wide transition-all
              ${activeTab === "review" ? "border-google-blue text-google-blue font-bold" : "border-transparent text-slate-500 hover:text-slate-800"}
            `}
          >
            Review Queue ({comments.filter(c => c.status === "review").length})
          </button>
        </div>

        <button 
          onClick={triggerRefresh}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          title="Refresh Feed"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Comment List Scroller */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-[400px]">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-xs font-medium text-slate-400">
            Fetching comments feed...
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col h-60 items-center justify-center text-center p-6 border-2 border-dashed border-[#dadce0] rounded-xl bg-white">
            <Youtube className="h-10 w-10 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No comments found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
              No comments matches this tab filter. Wait for live polling or click &ldquo;Simulate Comment&rdquo;.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {comments.map((comment, index) => {
              const isSelected = selectedCommentId === comment.id;
              
              return (
                <motion.div
                  key={comment.id}
                  layoutId={`comment-card-${comment.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onClick={() => setSelectedCommentId(comment.id)}
                  className={`relative rounded-xl border bg-white p-4 shadow-sm hover:shadow-google-card transition-all cursor-pointer select-none
                    ${borderCol(comment.status)}
                    ${isSelected ? "ring-2 ring-google-blue/15 border-google-blue" : "border-[#dadce0]"}
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* User profile avatar, author details */}
                    <div className="flex items-start gap-3">
                      {comment.authorAvatar ? (
                        <img
                          src={comment.authorAvatar}
                          alt={comment.author}
                          className="h-8 w-8 rounded-full border border-slate-200 object-cover mt-0.5 shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 mt-0.5 shrink-0">
                          {comment.author.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">{comment.author}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.publishedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium mt-1 pr-4">
                          {comment.text}
                        </p>
                      </div>
                    </div>

                    {/* Video thumbnail and title */}
                    <div className="flex gap-2 items-center bg-slate-50 rounded-lg p-1.5 border border-slate-150 max-w-[150px] shrink-0 hidden md:flex">
                      {comment.videoThumbnail ? (
                        <img
                          src={comment.videoThumbnail}
                          alt={comment.videoTitle}
                          className="h-7 w-7 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <Video className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <span className="text-[9px] text-slate-500 font-semibold line-clamp-2 leading-tight">
                        {comment.videoTitle}
                      </span>
                    </div>
                  </div>

                  {/* Reply preview & stats badge */}
                  <div className="mt-3 bg-slate-50 border border-slate-150 rounded-lg p-3 space-y-2 text-left">
                    {/* Header badge status */}
                    <div className="flex items-center justify-between text-[10px] flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        {comment.status === "replied" && (
                          <span className="inline-flex items-center gap-1 font-bold text-accent-success bg-green-50 px-2 py-0.5 border border-green-200 rounded">
                            <CheckCircle className="h-3 w-3" /> Auto-replied
                          </span>
                        )}
                        {comment.status === "matched" && (
                          <span className="inline-flex items-center gap-1 font-bold text-google-blue bg-blue-50 px-2 py-0.5 border border-blue-200 rounded">
                            <Clock className="h-3 w-3 animate-spin" style={{ animationDuration: "5s" }} /> Queued reply
                          </span>
                        )}
                        {comment.status === "review" && (
                          <span className="inline-flex items-center gap-1 font-bold text-accent-warning bg-yellow-50 px-2 py-0.5 border border-yellow-255 rounded">
                            <Clock className="h-3 w-3" /> Flagged for Review
                          </span>
                        )}
                        {comment.status === "skipped" && (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Skipped
                          </span>
                        )}
                      </div>

                      {/* Timer count down */}
                      {comment.status === "matched" && comment.delayRemainingSeconds > 0 && (
                        <div className="flex items-center gap-1 font-bold text-accent-live bg-red-50 border border-red-200 rounded px-2 py-0.5 live-pulse">
                          <Clock className="h-3 w-3 text-accent-live" />
                          <span>Dispatching in {formatTimer(comment.delayRemainingSeconds)}</span>
                        </div>
                      )}
                      
                      {comment.status === "replied" && comment.replyFiredAt && (
                        <span className="text-slate-400 font-semibold">
                          Sent at {new Date(comment.replyFiredAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      )}
                    </div>

                    {/* Previews */}
                    {comment.autoReplyText && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed italic border-t border-slate-150 pt-2">
                        <span className="font-bold text-[#5f6368] non-italic block mb-0.5">Response:</span>
                        &ldquo;{comment.autoReplyText}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Card Inline Action buttons */}
                  <div 
                    className="flex justify-end items-center gap-2 mt-3 pt-3 border-t border-slate-100"
                    onClick={(e) => e.stopPropagation()} // Prevent card detail opening
                  >
                    {/* View details */}
                    <button
                      onClick={() => setSelectedCommentId(comment.id)}
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
                      title="Inspect Comment Details"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    {comment.status !== "replied" && comment.status !== "skipped" && (
                      <>
                        <button
                          onClick={() => handleSkip(comment.id)}
                          className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-white text-slate-600 px-3 py-1 rounded-full text-xs font-semibold hover:bg-slate-50 transition active:scale-95"
                        >
                          <XOctagon className="h-3.5 w-3.5 text-accent-live" />
                          Skip
                        </button>
                        
                        <button
                          onClick={() => handleSendNow(comment.id, comment.autoReplyText || "")}
                          className="inline-flex items-center gap-1.5 bg-google-blue text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-google-blue-pressed transition active:scale-95"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send Now
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleBlock(comment.id)}
                      className="inline-flex items-center gap-1 border border-transparent text-slate-400 hover:text-accent-danger hover:border-red-200 hover:bg-red-50/50 px-2 py-1 rounded-full text-xs font-semibold transition"
                      title="Block Commenter User"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Block</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
