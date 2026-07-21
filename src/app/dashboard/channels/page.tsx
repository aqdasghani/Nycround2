"use client";

import React, { useEffect, useState } from "react";
import { useUIStore } from "@/frontend/store";
import { 
  Youtube, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  Loader2, 
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Video,
  Play,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Channel {
  id: string;
  name: string;
  avatar: string;
  handle: string;
  status: "active" | "quota_error";
  subscribers: string;
  automatedVideos?: string[];
}

interface YTVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

export default function ChannelsPage() {
  const showToast = useUIStore((state) => state.showToast);
  const triggerRefresh = useUIStore((state) => state.triggerRefresh);
  const refreshTrigger = useUIStore((state) => state.refreshTrigger);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  
  // Video listing panel state
  const [expandedChannelId, setExpandedChannelId] = useState<string | null>(null);
  const [videos, setVideos] = useState<YTVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [savingVideos, setSavingVideos] = useState(false);

  // Check URL Search Params for OAuth return status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    const chName = params.get("channel");

    if (success === "connected" && chName) {
      showToast(`Linked YouTube channel: ${chName} successfully!`, "success");
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
      triggerRefresh();
    } else if (error) {
      if (error === "credentials_not_configured") {
        showToast("Google OAuth credentials are not set. Check settings.", "error");
      } else {
        showToast(`OAuth Error: ${error.replace(/_/g, " ")}`, "error");
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [showToast, triggerRefresh]);

  // Load channels
  useEffect(() => {
    async function loadPageData() {
      try {
        const channelsRes = await fetch("/api/channels");

        if (channelsRes.ok) {
          setChannels(await channelsRes.json());
        }
      } catch (err) {
        console.error("Error loading channels page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPageData();
  }, [refreshTrigger]);

  // Expand channel panel to load its YouTube videos
  const toggleExpandChannel = async (channelId: string) => {
    if (expandedChannelId === channelId) {
      setExpandedChannelId(null);
      setVideos([]);
      return;
    }

    setExpandedChannelId(channelId);
    setLoadingVideos(true);
    setVideos([]);

    try {
      const res = await fetch(`/api/youtube/videos?channelId=${channelId}`);
      if (res.ok) {
        const videoList = await res.json();
        setVideos(videoList);
      } else {
        showToast("Failed to fetch channel videos from YouTube API", "error");
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      showToast("Error connecting to videos service", "error");
    } finally {
      setLoadingVideos(false);
    }
  };

  // Toggle automation checkbox on a video
  const handleToggleVideoAutomation = async (channelId: string, videoId: string, currentAutomated: boolean) => {
    setSavingVideos(true);
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) return;

    let updatedList = channel.automatedVideos ? [...channel.automatedVideos] : [];
    if (currentAutomated) {
      // Remove video ID
      updatedList = updatedList.filter((vid) => vid !== videoId);
    } else {
      // Add video ID
      updatedList.push(videoId);
    }

    try {
      const res = await fetch("/api/channels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          automatedVideos: updatedList
        })
      });

      if (res.ok) {
        // Optimistically update state
        setChannels(channels.map((c) => c.id === channelId ? { ...c, automatedVideos: updatedList } : c));
        showToast(
          currentAutomated ? "Deactivated reply automation for video" : "Activated auto-reply automation for video!",
          "success"
        );
        triggerRefresh();
      } else {
        showToast("Failed to save video automation selection", "error");
      }
    } catch (err) {
      console.error("Failed to save automation checklist:", err);
      showToast("Error updating video status", "error");
    } finally {
      setSavingVideos(false);
    }
  };

  // Initiate Redirect to Google OAuth screen
  const handleGoogleLoginRedirect = () => {
    window.location.href = "/api/auth/google";
  };

  // Disconnect a channel
  const handleDisconnect = async (channelId: string) => {
    if (!confirm("Are you sure you want to disconnect this channel? You can reconnect later.")) return;
    setDisconnecting(channelId);
    try {
      const res = await fetch("/api/channels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId })
      });

      if (res.ok) {
        showToast("Channel disconnected successfully.", "success");
        setChannels(channels.filter((c) => c.id !== channelId));
        triggerRefresh();
      } else {
        showToast("Failed to disconnect channel.", "error");
      }
    } catch (err) {
      showToast("Error disconnecting channel.", "error");
    } finally {
      setDisconnecting(null);
    }
  };

  // Run Manual Poll trigger for immediate sync
  const triggerManualSync = async () => {
    showToast("Checking automated videos for new comments...", "info");
    try {
      const res = await fetch("/api/youtube/poll");
      if (res.ok) {
        const data = await res.json();
        const summary = data.summary;
        if (summary.repliedCount > 0) {
          showToast(`Sync complete: Dispatched ${summary.repliedCount} automated replies!`, "success");
        } else {
          showToast("Sync complete: No new keyword matches found.", "success");
        }
        triggerRefresh();
      } else {
        showToast("Sync failed: check API limits or connection status", "error");
      }
    } catch (err) {
      showToast("Sync poll request failed.", "error");
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-lg font-bold text-[#202124] md:text-xl">
            Connected YouTube Channels
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Link channels, select specific videos for keyword auto-replies, and poll comments in real-time.
          </p>
        </div>

        {channels.length > 0 && (
          <button
            onClick={triggerManualSync}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white font-semibold text-xs px-5 py-2 hover:bg-slate-800 transition active:scale-95 shadow-sm"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            Check & Sync Comments
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
      {/* Connection Form Column */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm space-y-4 md:col-span-1">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-800">YouTube Account Integration</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Sign in with Google to link your YouTube channel securely.</p>
          </div>

          <button
            onClick={handleGoogleLoginRedirect}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-700 py-2.5 text-xs font-semibold text-white transition shadow-sm active:scale-95 cursor-pointer"
          >
            <Youtube className="h-4 w-4 text-white fill-white" />
            Connect YouTube Channel
          </button>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex gap-1.5 items-start text-[10px] text-slate-450 leading-relaxed">
              <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <p>We never store your password. YouTube access can be revoked anytime from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-google-blue font-semibold hover:underline">Google account settings</a>.</p>
            </div>
          </div>
        </div>

        {/* Channels List Column */}
        <div className="space-y-3 md:col-span-2">
          {loading ? (
            <div className="h-40 rounded-xl border bg-white flex items-center justify-center text-xs text-slate-400">
              Loading linked channels...
            </div>
          ) : channels.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-[#dadce0] bg-white p-8 text-center">
              <Youtube className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700">No Channels Connected</h4>
              <p className="text-xs text-slate-500 mt-1">Connect your official Google account on the left to pull your active channel.</p>
            </div>
          ) : (
            channels.map((ch) => {
              const isExpanded = expandedChannelId === ch.id;
              const automatedCount = ch.automatedVideos?.length || 0;
              
              return (
                <div key={ch.id} className="rounded-xl border border-[#dadce0] bg-white overflow-hidden shadow-sm">
                  {/* Channel Header Info */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
                    <div className="flex items-center gap-3.5">
                      {ch.avatar ? (
                        <img
                          src={ch.avatar}
                          alt={ch.name}
                          className="h-11 w-11 rounded-full object-cover border border-slate-150 bg-white"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full border border-slate-150 bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                          {ch.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="text-left space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-slate-800">{ch.name}</span>
                          <span className="text-[10px] font-bold text-slate-400">{ch.handle}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
                          <span>{ch.subscribers} Subscribers</span>
                          <span>•</span>
                          <span className="text-google-blue">{automatedCount} Automated Videos</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-2 sm:pt-0 sm:border-t-0">
                      <button
                        onClick={() => toggleExpandChannel(ch.id)}
                        className="inline-flex items-center gap-1 border border-[#dadce0] bg-white text-slate-600 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:bg-slate-50 transition"
                      >
                        <span>Setup Videos</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        onClick={() => handleDisconnect(ch.id)}
                        disabled={disconnecting === ch.id}
                        className="inline-flex items-center gap-1 border border-red-200 bg-white text-red-500 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50"
                        title="Disconnect this channel"
                      >
                        {disconnecting === ch.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                      
                      <a
                        href={`https://youtube.com/${ch.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                        title="View Channel page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  {/* Video Selector Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="border-t border-slate-100 overflow-hidden"
                      >
                        <div className="p-4 bg-white space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                              Select upload videos to automate replies on:
                            </span>
                            {loadingVideos && <Loader2 className="h-3.5 w-3.5 text-google-blue animate-spin" />}
                          </div>

                          {loadingVideos ? (
                            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                              <Loader2 className="h-5 w-5 text-google-blue animate-spin mx-auto" />
                              <p>Loading channel video list from YouTube API...</p>
                            </div>
                          ) : videos.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                              No videos found on this channel. Upload content first!
                            </div>
                          ) : (
                            <div className="grid gap-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                              {videos.map((vid) => {
                                const isAutomated = ch.automatedVideos?.includes(vid.id) || false;
                                return (
                                  <div
                                    key={vid.id}
                                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-all
                                      ${isAutomated 
                                        ? "border-google-blue/30 bg-blue-50/20" 
                                        : "border-slate-150 hover:bg-slate-50/50"}
                                    `}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {vid.thumbnail ? (
                                        <img
                                          src={vid.thumbnail}
                                          alt={vid.title}
                                          className="h-10 w-16 object-cover rounded-md border bg-slate-100 shrink-0"
                                        />
                                      ) : (
                                        <div className="h-10 w-16 rounded-md border bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                          <Video className="h-5 w-5" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <span className="font-bold text-slate-800 block truncate leading-snug">{vid.title}</span>
                                        <span className="text-[10px] text-slate-400 block mt-0.5">
                                          Published: {new Date(vid.publishedAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 pl-3">
                                      {isAutomated && (
                                        <span className="text-[9px] font-bold text-google-blue bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
                                          🤖 Active
                                        </span>
                                      )}
                                      
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          disabled={savingVideos}
                                          checked={isAutomated}
                                          onChange={() => handleToggleVideoAutomation(ch.id, vid.id, isAutomated)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-google-blue"></div>
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
