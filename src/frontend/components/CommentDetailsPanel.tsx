"use client";

import React, { useEffect, useState } from "react";
import { useUIStore } from "@/frontend/store";
import { AnimatePresence, motion } from "framer-motion";
import { 
  X, 
  Send, 
  Trash2, 
  Sparkles, 
  Clock, 
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  History,
  Users,
  MessageSquareCode,
  Loader2,
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

export default function CommentDetailsPanel() {
  const selectedCommentId = useUIStore((state) => state.selectedCommentId);
  const setSelectedCommentId = useUIStore((state) => state.setSelectedCommentId);
  const showToast = useUIStore((state) => state.showToast);
  const triggerRefresh = useUIStore((state) => state.triggerRefresh);
  const refreshTrigger = useUIStore((state) => state.refreshTrigger);

  const [comment, setComment] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState("");

  // Load comment details when selectedCommentId changes
  useEffect(() => {
    async function loadComment() {
      if (!selectedCommentId) {
        setComment(null);
        return;
      }
      try {
        const res = await fetch("/api/comments");
        if (res.ok) {
          const data = await res.json();
          const found = data.find((c: Comment) => c.id === selectedCommentId);
          if (found) {
            setComment(found);
            setReplyText(found.autoReplyText || "");
          }
        }
      } catch (err) {
        console.error("Error loading single comment details:", err);
      }
    }
    loadComment();
  }, [selectedCommentId, refreshTrigger]);

  const handleSendNow = async () => {
    if (!comment) return;
    try {
      const res = await fetch(`/api/comments/${comment.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoReplyText: replyText })
      });

      if (res.ok) {
        showToast("Reply sent successfully!", "success");
        triggerRefresh();
        setSelectedCommentId(null);
      }
    } catch (err) {
      console.error("Error replying from detail drawer:", err);
    }
  };

  const handleSkip = async () => {
    if (!comment) return;
    try {
      const res = await fetch(`/api/comments/${comment.id}/skip`, {
        method: "POST"
      });

      if (res.ok) {
        showToast("Auto-reply skipped.", "warning");
        triggerRefresh();
        setSelectedCommentId(null);
      }
    } catch (err) {
      console.error("Error skipping from detail drawer:", err);
    }
  };



  return (
    <AnimatePresence>
      {selectedCommentId && comment && (
        <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
          {/* Backdrop (interactive) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCommentId(null)}
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-[0.5px] pointer-events-auto"
          />

          {/* Slider content card (interactive) */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative flex h-full w-full max-w-[420px] flex-col border-l border-[#dadce0] bg-white shadow-google-modal pointer-events-auto"
          >
            {/* Header info */}
            <div className="flex h-14 items-center justify-between border-b border-[#dadce0] px-4 shrink-0">
              <span className="font-display text-sm font-bold text-[#202124]">
                Comment Inspector
              </span>
              <button
                onClick={() => setSelectedCommentId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
              {/* Profile Card & Channel Statistics */}
              <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-150">
                {comment.authorAvatar ? (
                  <img
                    src={comment.authorAvatar}
                    alt={comment.author}
                    className="h-12 w-12 rounded-full border border-slate-200 object-cover shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-800">{comment.author}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {comment.authorSubscribers} subscribers
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <History className="h-3.5 w-3.5 text-slate-400" />
                      {comment.authorHistoryCount} prior comments
                    </span>
                  </div>
                </div>
              </div>

              {/* Original Comment Card */}
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
                  Original Comment
                </span>
                <div className="rounded-xl border border-slate-150 p-4 bg-white shadow-sm leading-relaxed">
                  <p className="text-xs text-slate-700 font-medium italic">
                    &ldquo;{comment.text}&rdquo;
                  </p>
                  <span className="text-[9px] font-semibold text-slate-400 block mt-2">
                    Published: {new Date(comment.publishedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Video Context */}
              <div className="rounded-xl border border-slate-150 p-3 flex items-center justify-between gap-3 bg-white shadow-sm">
                <div className="text-left">
                  <span className="text-[8px] font-semibold uppercase text-slate-400 block tracking-wider">Video Context</span>
                  <h5 className="text-[11px] font-bold text-slate-700 line-clamp-1 mt-0.5">{comment.videoTitle}</h5>
                </div>
                {comment.videoThumbnail ? (
                  <img
                    src={comment.videoThumbnail}
                    alt={comment.videoTitle}
                    className="h-8 w-12 rounded object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="h-8 w-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <Video className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Reply Compose Area */}
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
                    Draft Response
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    rows={6}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Enter reply response..."
                    disabled={comment.status === "replied"}
                    className="w-full rounded-xl border border-slate-200 p-3.5 text-xs outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/15 font-sans leading-relaxed resize-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions footer */}
            <div className="border-t border-[#dadce0] p-4 bg-white shrink-0 flex items-center justify-between gap-3">
              {comment.status !== "replied" && comment.status !== "skipped" ? (
                <>
                  <button
                    onClick={handleSkip}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 border border-[#dadce0] bg-white text-slate-700 px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-slate-50 transition active:scale-95"
                  >
                    Skip Auto-Reply
                  </button>

                  <button
                    disabled={!replyText.trim()}
                    onClick={handleSendNow}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 bg-google-blue text-white px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-google-blue-pressed transition active:scale-95 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Send Reply
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-400 bg-slate-50 rounded-full border border-slate-150">
                  {comment.status === "replied" ? (
                    <>
                      <CheckCircle className="h-4.5 w-4.5 text-accent-success" />
                      Reply has been dispatched successfully
                    </>
                  ) : (
                    <>
                      <X className="h-4.5 w-4.5 text-slate-400" />
                      Auto-reply was skipped / dismissed
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
