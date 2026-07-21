"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/frontend/store";
import { 
  Youtube, 
  CheckCircle, 
  Sliders, 
  ArrowRight, 
  Sparkles, 
  Play, 
  Loader2,
  Lock,
  Shield
} from "lucide-react";

export default function OnboardingFlow() {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);
  const triggerRefresh = useUIStore((state) => state.triggerRefresh);
  const refreshTrigger = useUIStore((state) => state.refreshTrigger);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [channelConnected, setChannelConnected] = useState(false);
  const [connectedChannelInfo, setConnectedChannelInfo] = useState<any>(null);
  
  // First Rule Data
  const [ruleName, setRuleName] = useState("Pricing Keywords");
  const [keywords, setKeywords] = useState("price, cost, how much");
  const [replyBody, setReplyBody] = useState("Hey {{commenter_name}}! Thanks for asking. Our basic package is $29/mo. Check details at https://Quick Reply.com/pricing! 👋");



  // Simulation Comment State for Step 3
  const [simState, setSimState] = useState<"idle" | "countdown" | "replied">("idle");
  const [simTimer, setSimTimer] = useState(5);

  // Check query parameters for success return from OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    const chName = params.get("channel");

    if (success === "connected" && chName) {
      showToast(`Linked YouTube channel: ${chName} successfully!`, "success");
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      setChannelConnected(true);
      setStep(2); // Auto-advance to Step 2
      triggerRefresh();
    } else if (error) {
      showToast(`Auth Error: ${error.replace(/_/g, " ")}`, "error");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [showToast, triggerRefresh]);

  // Fetch connected channels
  useEffect(() => {
    async function loadOnboardingData() {
      try {
        const [channelsRes, settingsRes] = await Promise.all([
          fetch("/api/channels"),
          fetch("/api/settings")
        ]);

        if (channelsRes.ok) {
          const channels = await channelsRes.json();
          if (channels.length > 0) {
            setChannelConnected(true);
            setConnectedChannelInfo(channels[0]);
          }
        }

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (!settings.userSession || !settings.userSession.email) {
            router.push("/login");
            return;
          }
        } else {
          router.push("/login");
          return;
        }
      } catch (err) {
        console.error("Onboarding load error:", err);
      }
    }
    loadOnboardingData();
  }, [refreshTrigger]);

  const handleOAuthConnect = () => {
    window.location.href = "/api/auth/google?state=onboarding";
  };

  const handleSaveRule = async () => {
    setLoading(true);
    try {
      // 1. Create a template for this rule
      const tplRes = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${ruleName} Template`,
          emoji: "💵",
          body: replyBody,
          variants: [replyBody]
        })
      });

      if (tplRes.ok) {
        const template = await tplRes.json();
        
        // 2. Create the rule tied to this template
        const conditions = keywords.split(",").map((kw, idx) => ({
          id: `cond-ob-${idx}`,
          type: "contains" as const,
          value: kw.trim()
        }));

        await fetch("/api/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: ruleName,
            conditions,
            operator: "OR",
            templateId: template.id,
            delaySeconds: 180,
            dailyLimit: 50,
            colorLabel: "red",
            customVariable1: "https://Quick Reply.com/pricing"
          })
        });

        showToast("Auto-reply rule saved!", "success");
        triggerRefresh();
        setStep(3);
      }
    } catch (err) {
      console.error("Save rule error:", err);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = () => {
    setSimState("countdown");
    setSimTimer(5);
    const interval = setInterval(() => {
      setSimTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSimState("replied");
          showToast("Simulation completed successfully!", "success");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };



  const handleFinishOnboarding = () => {
    showToast("Workspace onboarding completed!", "success");
    router.push("/dashboard");
  };

  const dotClass = (num: number) => {
    if (step === num) return "w-6 h-2 bg-google-blue rounded-full transition-all";
    if (step > num) return "w-2 h-2 bg-accent-success rounded-full";
    return "w-2 h-2 bg-slate-350 rounded-full";
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center py-6 px-4 font-sans">
      {/* Container */}
      <div className="w-full max-w-[580px] rounded-2xl bg-white p-6 shadow-google-card border border-[#dadce0] relative overflow-hidden text-left">
        {/* Step Indicator Headers */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-1.5">
            <span className={dotClass(1)} />
            <span className={dotClass(2)} />
            <span className={dotClass(3)} />
          </div>
          <span className="text-xs font-semibold text-slate-500 font-display">
            STEP {step} OF 3
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-200">
                  <Youtube className="h-8 w-8" />
                </div>
                <h2 className="font-display text-xl font-bold text-[#202124]">
                  Connect your YouTube Channel
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Allow Quick Reply to monitor comments and post replies automatically using secure, official Google OAuth integrations.
                </p>
              </div>

              {!channelConnected ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 flex flex-col items-center text-center">
                  <div className="mb-4 h-16 w-32 border border-slate-200 bg-white rounded-lg flex items-center justify-center text-slate-400 font-semibold text-xs shadow-sm">
                    YouTube API v3
                  </div>
                  
                  <button
                    onClick={handleOAuthConnect}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-google-blue hover:bg-google-blue-pressed px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Lock className="h-4 w-4 text-white" />
                    Link Google / YouTube Account
                  </button>

                  <div className="flex items-start gap-1.5 mt-4 text-[10px] text-slate-450 leading-relaxed">
                    <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <p>We never store your password. YouTube access can be revoked anytime from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-google-blue font-semibold hover:underline">Google account settings</a>.</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-green-200 bg-green-50/50 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={connectedChannelInfo?.avatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150"} 
                      alt={connectedChannelInfo?.name} 
                      className="h-10 w-10 rounded-full object-cover border border-green-200 bg-white"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{connectedChannelInfo?.name || "Connected Channel"}</h4>
                      <p className="text-xs text-slate-500">{connectedChannelInfo?.handle || "@handle"} · {connectedChannelInfo?.subscribers || "0"} Subscribers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-green-700 text-xs font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    <span>Connected</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Skip for now
                </button>
                <button
                  disabled={!channelConnected}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 rounded-full bg-google-blue hover:bg-google-blue-pressed text-xs font-semibold text-white px-5 py-2 disabled:opacity-50 transition"
                >
                  Create First Rule
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-google-blue-light text-google-blue border border-blue-150">
                  <Sliders className="h-8 w-8" />
                </div>
                <h2 className="font-display text-xl font-bold text-[#202124]">
                  Create your first auto-reply rule
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Build the trigger conditions and response template for pricing inquiries.
                </p>
              </div>

              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Rule Name
                  </label>
                  <input
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-google-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Trigger Keywords (Comma separated)
                  </label>
                  <input
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono outline-none focus:border-google-blue"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Response Template
                    </label>
                    <span className="text-[10px] text-google-blue bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                      {"{{commenter_name}}"} variable supported
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs outline-none focus:border-google-blue resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="text-xs font-semibold text-google-blue hover:underline"
                  >
                    Skip to Dashboard
                  </button>
                </div>
                <button
                  disabled={loading || !ruleName || !keywords || !replyBody}
                  onClick={handleSaveRule}
                  className="inline-flex items-center gap-1 rounded-full bg-google-blue hover:bg-google-blue-pressed text-xs font-semibold text-white px-5 py-2 disabled:opacity-50 transition"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving Rule...
                    </>
                  ) : (
                    <>
                      Save & Test Rule
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-accent-success border border-green-200">
                  <Sparkles className="h-7 w-7 animate-bounce" />
                </div>
                <h2 className="font-display text-xl font-bold text-[#202124]">
                  Watch Replies Happen (Live Demo)
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  See how an incoming comment triggers a delayed auto-reply automatically.
                </p>
              </div>

              {/* Simulation visual canvas */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 min-h-[160px] text-left flex flex-col justify-center">
                {simState === "idle" && (
                  <div className="text-center py-4">
                    <button
                      onClick={runSimulation}
                      className="inline-flex items-center gap-2 rounded-full bg-google-blue hover:bg-google-blue-pressed px-5 py-2 text-xs font-semibold text-white shadow-sm transition"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Simulate Incoming Comment
                    </button>
                  </div>
                )}

                {simState === "countdown" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-accent-live live-pulse" />
                        <span className="text-[10px] font-semibold text-accent-live uppercase tracking-wider">🔴 Incoming Live Comment</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">Ticking down...</span>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-google-blue">M</div>
                        <span className="text-xs font-bold text-slate-800">Mickey Mouse</span>
                        <span className="text-[10px] text-slate-400">• Just now</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium italic mb-2">
                        &ldquo;How much does the workspace subscription cost per month?&rdquo;
                      </p>
                      
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                        <span className="font-semibold text-accent-success bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                          Matched Rule: Pricing Keywords
                        </span>
                        <span className="font-semibold text-accent-live">
                          Firing reply in {simTimer}s
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {simState === "replied" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-accent-success uppercase tracking-wider">✅ Auto-Reply Dispatched</span>
                      <span className="text-[11px] font-medium text-slate-400">Success</span>
                    </div>

                    <div className="bg-white rounded-lg border border-green-200 p-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-google-blue">M</div>
                        <span className="text-xs font-bold text-slate-800">Mickey Mouse</span>
                        <span className="text-[10px] text-slate-400">• 5s ago</span>
                      </div>
                      <p className="text-xs text-slate-500 italic mb-2">
                        &ldquo;How much does the workspace subscription cost per month?&rdquo;
                      </p>
                      
                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-xs">
                        <div className="text-[10px] font-bold text-google-blue mb-1">Quick Reply Auto-Response:</div>
                        <p className="text-slate-700 italic">
                          &ldquo;Hey Mickey Mouse! Thanks for asking. Our basic package is $29/mo. Check details at https://Quick Reply.com/pricing! 👋&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Back
                </button>
                <button
                  disabled={simState !== "replied"}
                  onClick={handleFinishOnboarding}
                  className="inline-flex items-center gap-1 rounded-full bg-google-blue hover:bg-google-blue-pressed text-xs font-semibold text-white px-5 py-2 disabled:opacity-50 transition"
                >
                  Go to Dashboard
                  <CheckCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}


        </AnimatePresence>
      </div>
    </div>
  );
}
