"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/frontend/store";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  HelpCircle, 
  Info,
  Check,
  ChevronRight,
  X,
  Play,
  RotateCcw,
  BookOpen
} from "lucide-react";

interface Condition {
  id: string;
  type: "contains" | "equals" | "starts_with" | "reply_all";
  value: string;
}

interface RuleBuilderFormProps {
  ruleId?: string; // If editing
}

export default function RuleBuilderForm({ ruleId }: RuleBuilderFormProps) {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);
  const triggerRefresh = useUIStore((state) => state.triggerRefresh);

  const [ruleName, setRuleName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [colorLabel, setColorLabel] = useState<"red" | "blue" | "yellow" | "green">("blue");
  
  // Trigger conditions
  const [conditions, setConditions] = useState<Condition[]>([
    { id: "cond-init-1", type: "contains", value: "" }
  ]);
  const [operator, setOperator] = useState<"AND" | "OR">("OR");

  // Filters
  const [topLevelOnly, setTopLevelOnly] = useState(true);
  const [maxReplies, setMaxReplies] = useState(5);
  const [language, setLanguage] = useState("auto");

  // Template Actions
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [replyTextPreview, setReplyTextPreview] = useState("");
  const [customVar1, setCustomVar1] = useState("");
  const [customVar2, setCustomVar2] = useState("");
  const [customVar3, setCustomVar3] = useState("");

  // Delay & Limits
  const [delayMinutes, setDelayMinutes] = useState(3);
  const [dailyLimit, setDailyLimit] = useState(50);

  // Testing Drawer State
  const [testingDrawerOpen, setTestingDrawerOpen] = useState(false);
  const [testComments, setTestComments] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});

  const replyTextAreaRef = useRef<HTMLTextAreaElement>(null);

  // Variable chip helpers
  const variables = [
    { label: "Commenter Name", placeholder: "{{commenter_name}}" },
    { label: "Video Title", placeholder: "{{video_title}}" },
    { label: "Channel Name", placeholder: "{{channel_name}}" },
    { label: "Pricing Link", placeholder: "{{custom_variable_1}}" },
    { label: "Promo Code", placeholder: "{{custom_variable_2}}" },
    { label: "Support Email", placeholder: "{{custom_variable_3}}" },
  ];

  // Fetch templates and rule if editing
  useEffect(() => {
    async function loadData() {
      try {
        const tplRes = await fetch("/api/templates");
        if (tplRes.ok) {
          const tpls = await tplRes.json();
          setTemplates(tpls);
          if (tpls.length > 0 && !selectedTemplateId) {
            setSelectedTemplateId(tpls[0].id);
            setReplyTextPreview(tpls[0].body);
          }
        }

        if (ruleId) {
          const ruleRes = await fetch(`/api/rules/${ruleId}`);
          if (ruleRes.ok) {
            const r = await ruleRes.json();
            setRuleName(r.name);
            setIsActive(r.isActive);
            setColorLabel(r.colorLabel);
            setConditions(r.conditions);
            setOperator(r.operator);
            setTopLevelOnly(r.filters.topLevelOnly);
            setMaxReplies(r.filters.maxRepliesPerUser);
            setLanguage(r.filters.language);
            setSelectedTemplateId(r.templateId);
            setDelayMinutes(Math.round(r.delaySeconds / 60));
            setDailyLimit(r.dailyLimit);
            setCustomVar1(r.customVariable1);
            setCustomVar2(r.customVariable2);
            setCustomVar3(r.customVariable3);

            // Fetch template body if there is one
            const tplDetailRes = await fetch(`/api/templates/${r.templateId}`);
            if (tplDetailRes.ok) {
              const td = await tplDetailRes.json();
              setReplyTextPreview(td.body);
            }
          }
        }
      } catch (err) {
        console.error("Error loading rule builder data:", err);
      }
    }
    loadData();
  }, [ruleId, selectedTemplateId]);

  // Sync template body on changing selection
  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const matched = templates.find((t) => t.id === tplId);
    if (matched) {
      setReplyTextPreview(matched.body);
    }
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: `cond-${Date.now()}`, type: "contains", value: "" }
    ]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length === 1) return;
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const updateConditionValue = (id: string, val: string) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, value: val } : c))
    );
  };

  const updateConditionType = (id: string, type: Condition["type"]) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, type } : c))
    );
  };

  const insertVariable = (variable: string) => {
    const textarea = replyTextAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = replyTextPreview;
    
    const newText = currentText.substring(0, start) + variable + currentText.substring(end);
    setReplyTextPreview(newText);
    
    // Reset focus and cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 10);
  };

  // Run the matching evaluation on recent comments
  const runTestRule = async () => {
    setTestingDrawerOpen(true);
    try {
      const res = await fetch("/api/comments");
      if (res.ok) {
        const comments = await res.json();
        setTestComments(comments.slice(0, 10)); // take 10 comments

        // Check each comment against current form conditions
        const results: { [key: string]: boolean } = {};
        comments.slice(0, 10).forEach((comment: any) => {
          const textLower = comment.text.toLowerCase();
          const matches = conditions.map((cond) => {
            if (cond.type === "reply_all") return true;
            const condVal = cond.value.toLowerCase().trim();
            if (!condVal) return false;
            
            if (cond.type === "contains") return textLower.includes(condVal);
            if (cond.type === "equals") return textLower === condVal;
            if (cond.type === "starts_with") return textLower.startsWith(condVal);
            return false;
          });

          if (matches.length === 0 || (conditions.every(c => c.type !== "reply_all" && !c.value.trim()))) {
            results[comment.id] = false;
          } else if (operator === "AND") {
            results[comment.id] = matches.every(m => m);
          } else {
            results[comment.id] = matches.some(m => m);
          }
        });

        setTestResults(results);
      }
    } catch (err) {
      console.error("Test rule fetch error:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save template changes first (if edited)
    try {
      if (selectedTemplateId) {
        await fetch(`/api/templates/${selectedTemplateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: replyTextPreview
          })
        });
      }

      const payload = {
        name: ruleName || "Unnamed Rule",
        isActive,
        colorLabel,
        conditions: conditions.filter(c => c.type === "reply_all" || c.value.trim() !== ""),
        operator,
        filters: {
          topLevelOnly,
          maxRepliesPerUser: maxReplies,
          language
        },
        templateId: selectedTemplateId,
        delaySeconds: delayMinutes * 60,
        dailyLimit,
        customVariable1: customVar1,
        customVariable2: customVar2,
        customVariable3: customVar3
      };

      const endpoint = ruleId ? `/api/rules/${ruleId}` : "/api/rules";
      const method = ruleId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(ruleId ? "Rule updated successfully" : "Rule created successfully", "success");
        triggerRefresh();
        router.push("/dashboard/rules");
      } else {
        showToast("Error saving rule", "error");
      }
    } catch (err) {
      console.error("Error saving rule:", err);
      showToast("Error saving rule", "error");
    }
  };

  // Helper to highlight keywords in comment preview
  const highlightKeywords = (text: string) => {
    let result: React.ReactNode[] = [text];
    
    conditions.forEach((cond) => {
      const val = cond.value.trim();
      if (!val) return;

      const regex = new RegExp(`(${val})`, "gi");
      
      const newResult: React.ReactNode[] = [];
      result.forEach((node) => {
        if (typeof node !== "string") {
          newResult.push(node);
          return;
        }

        const parts = node.split(regex);
        parts.forEach((part, i) => {
          if (part.toLowerCase() === val.toLowerCase()) {
            newResult.push(
              <span key={`${i}-${part}`} className="bg-yellow-100 font-bold px-0.5 rounded text-amber-800">
                {part}
              </span>
            );
          } else if (part !== "") {
            newResult.push(part);
          }
        });
      });
      result = newResult;
    });

    return result;
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Section 1: Rule Info Card */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-google-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rule Name
              </label>
              <input
                type="text"
                required
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g. Price & Cost keywords"
                className="w-full max-w-lg rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/15"
              />
            </div>
            
            <div className="flex items-center gap-6 shrink-0 pt-4 sm:pt-0">
              <div className="flex flex-col items-start gap-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Color Badge</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {(["blue", "red", "yellow", "green"] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setColorLabel(color)}
                      className={`h-6 w-6 rounded-full border-2 transition active:scale-90
                        ${color === "blue" ? "bg-google-blue" : ""}
                        ${color === "red" ? "bg-accent-live" : ""}
                        ${color === "yellow" ? "bg-accent-warning" : ""}
                        ${color === "green" ? "bg-accent-success" : ""}
                        ${colorLabel === color ? "border-slate-800 scale-110 shadow-sm" : "border-transparent hover:border-slate-350"}
                      `}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-start gap-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out mt-1
                    ${isActive ? "bg-google-blue" : "bg-slate-200"}
                  `}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${isActive ? "translate-x-5" : "translate-x-0"}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Trigger Conditions */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-google-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-display text-sm font-bold text-[#202124]">
                TRIGGER — Match comments where:
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define the keywords and operators to evaluate incoming comment text.
              </p>
            </div>
            
            {/* AND/OR Operator pill */}
            <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setOperator("OR")}
                className={`rounded-md px-2.5 py-1 font-semibold transition
                  ${operator === "OR" ? "bg-white text-google-blue shadow-sm" : "text-slate-500 hover:text-slate-800"}
                `}
              >
                OR
              </button>
              <button
                type="button"
                onClick={() => setOperator("AND")}
                className={`rounded-md px-2.5 py-1 font-semibold transition
                  ${operator === "AND" ? "bg-white text-google-blue shadow-sm" : "text-slate-500 hover:text-slate-800"}
                `}
              >
                AND
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {conditions.map((cond, index) => (
              <div key={cond.id} className="flex flex-wrap items-center gap-3">
                <div className="text-xs font-semibold text-slate-400 w-10">
                  {index === 0 ? "IF" : operator}
                </div>
                
                <select
                  value={cond.type}
                  onChange={(e) => updateConditionType(cond.id, e.target.value as any)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-google-blue"
                >
                  <option value="contains">Keyword / Phrase</option>
                  <option value="equals">Exact match</option>
                  <option value="starts_with">Starts with</option>
                  <option value="reply_all">Reply to every comment</option>
                </select>

                <div className="text-xs font-medium text-slate-500">
                  {cond.type === "contains" ? "contains" : cond.type === "starts_with" ? "starts with" : cond.type === "reply_all" ? "" : "equals"}
                </div>

                {cond.type !== "reply_all" && (
                  <input
                    type="text"
                    required
                    value={cond.value}
                    onChange={(e) => updateConditionValue(cond.id, e.target.value)}
                    placeholder="e.g. price"
                    className="flex-1 min-w-[150px] max-w-xs rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono outline-none focus:border-google-blue"
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeCondition(cond.id)}
                  disabled={conditions.length === 1}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-accent-danger transition disabled:opacity-30"
                  title="Remove Condition"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCondition}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 mt-4 transition active:scale-95 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Condition
          </button>
        </div>

        {/* Section 3: Filters */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-google-card">
          <h3 className="font-display text-sm font-bold text-[#202124] border-b border-slate-100 pb-3 mb-4">
            FILTER — Only apply if:
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-slate-150 p-3 hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={topLevelOnly}
                onChange={(e) => setTopLevelOnly(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-google-blue focus:ring-google-blue h-4 w-4"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Top-Level Only</span>
                <span className="text-slate-500">Do not reply to threads or nested replies.</span>
              </div>
            </label>

            <div className="rounded-lg border border-slate-150 p-3 flex flex-col justify-between">
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Prior Reply Limit</span>
                <span className="text-slate-500">Only reply if user has fewer than X prior replies.</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxReplies}
                  onChange={(e) => setMaxReplies(parseInt(e.target.value) || 5)}
                  className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs text-center outline-none focus:border-google-blue"
                />
                <span className="text-[10px] font-semibold text-slate-400">replies</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-150 p-3 flex flex-col justify-between">
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Detect Language</span>
                <span className="text-slate-500">Verify matching language before replying.</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 mt-2 text-xs text-slate-700 outline-none focus:border-google-blue"
              >
                <option value="auto">Auto-detect (Recommended)</option>
                <option value="en">English (en)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Action Template */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-google-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
            <div>
              <h3 className="font-display text-sm font-bold text-[#202124]">
                ACTION — Then reply with:
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a template and configure dynamic variables.
              </p>
            </div>

            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-google-blue"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {/* Variable insertion dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">Insert Dynamic Variables</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    insertVariable(e.target.value);
                    e.target.value = ""; // Reset
                  }
                }}
                className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-google-blue font-semibold"
                defaultValue=""
              >
                <option value="" disabled>Select personalization variable...</option>
                <option value="{{commenter_name}}">{"{{commenter_name}}"} - The person who commented</option>
                <option value="{{video_title}}">{"{{video_title}}"} - Current video title</option>
                <option value="{{channel_name}}">{"{{channel_name}}"} - Your channel name</option>
                <option value="{{reply_date}}">{"{{reply_date}}"} - Today's date</option>
                <option value="{{custom_variable_1}}">{"{{custom_variable_1}}"} - Custom Variable 1 (Link)</option>
                <option value="{{custom_variable_2}}">{"{{custom_variable_2}}"} - Custom Variable 2 (Code)</option>
                <option value="{{custom_variable_3}}">{"{{custom_variable_3}}"} - Custom Variable 3 (Contact)</option>
              </select>
            </div>

            {/* Response edit box */}
            <div className="space-y-1">
              <textarea
                ref={replyTextAreaRef}
                rows={4}
                required
                value={replyTextPreview}
                onChange={(e) => setReplyTextPreview(e.target.value)}
                placeholder="Compose your reply body..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-google-blue focus:ring-2 focus:ring-google-blue/15 font-sans leading-relaxed"
              />
            </div>

            {/* Live Preview block */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">Live Preview</label>
              <div className="rounded-xl border border-slate-150 bg-slate-50 p-3.5 text-xs text-slate-650 font-sans leading-relaxed italic">
                {replyTextPreview ? (
                  replyTextPreview
                    .replace(/\{\{commenter_name\}\}/g, "John Doe")
                    .replace(/\{\{video_title\}\}/g, "My Latest Video Stream")
                    .replace(/\{\{channel_name\}\}/g, "My Channel Title")
                    .replace(/\{\{reply_date\}\}/g, new Date().toLocaleDateString())
                    .replace(/\{\{custom_variable_1\}\}/g, customVar1 || "")
                    .replace(/\{\{custom_variable_2\}\}/g, customVar2 || "")
                    .replace(/\{\{custom_variable_3\}\}/g, customVar3 || "")
                ) : (
                  <span className="text-slate-400">Compose your template reply to view live preview...</span>
                )}
              </div>
            </div>

            {/* Custom Variables definitions */}
            <div className="grid gap-3 pt-2 sm:grid-cols-3 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400 block">Custom Variable 1 (Link)</label>
                <input
                  type="text"
                  value={customVar1}
                  onChange={(e) => setCustomVar1(e.target.value)}
                  placeholder="https://acme.com/link"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-google-blue"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400 block">Custom Variable 2 (Code)</label>
                <input
                  type="text"
                  value={customVar2}
                  onChange={(e) => setCustomVar2(e.target.value)}
                  placeholder="PROMO10"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-google-blue"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400 block">Custom Variable 3 (Contact)</label>
                <input
                  type="text"
                  value={customVar3}
                  onChange={(e) => setCustomVar3(e.target.value)}
                  placeholder="support@acme.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-google-blue"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Delays & Limits */}
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-google-card">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Humanization Delay
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Introduce a delay before firing to make replies appear written by a human.
              </p>
              <select
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 3)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-google-blue"
              >
                <option value={1}>1 Minute Delay</option>
                <option value={2}>2 Minutes Delay</option>
                <option value={3}>3 Minutes Delay (Recommended)</option>
                <option value={5}>5 Minutes Delay</option>
                <option value={10}>10 Minutes Delay</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Daily Execution Cap
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Prevent automated replies from consuming API quotas or spamming.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseInt(e.target.value) || 50)}
                  className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-center outline-none focus:border-google-blue"
                />
                <span className="text-xs text-slate-400 font-semibold">Replies per day</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Operations toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={runTestRule}
            className="inline-flex items-center gap-1.5 rounded-full border border-google-blue bg-white px-4 py-2 text-xs font-semibold text-google-blue hover:bg-google-blue/5 active:scale-95 transition shadow-sm"
          >
            <BookOpen className="h-4 w-4" />
            Test Rule on Sample Comments
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/rules")}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-4 py-2"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-full bg-google-blue hover:bg-google-blue-pressed px-6 py-2.5 text-xs font-semibold text-white shadow-md transition active:scale-95"
            >
              Save Rule Config
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Side Testing Drawer Overlay */}
      <AnimatePresence>
        {testingDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Drawer Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTestingDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative z-10 flex h-full w-full max-w-[440px] flex-col border-l border-slate-200 bg-white shadow-google-modal"
            >
              {/* Drawer Header */}
              <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-google-blue" />
                  <span className="font-display text-sm font-bold text-slate-800">
                    Rule Match Tester
                  </span>
                </div>
                <button
                  onClick={() => setTestingDrawerOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50">
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-800 leading-relaxed">
                  <Info className="h-4.5 w-4.5 text-google-blue inline shrink-0 mr-1.5 align-text-bottom" />
                  Below are the 10 most recent comments. Any comment highlighted in <span className="text-green-800 font-bold bg-green-50 px-1 border border-green-200 rounded">green</span> matches your active trigger conditions. Matched tokens inside comment text are highlighted in yellow.
                </div>

                <div className="space-y-2.5">
                  {testComments.map((comment) => {
                    const isMatched = testResults[comment.id] || false;
                    return (
                      <div
                        key={comment.id}
                        className={`rounded-xl border p-3.5 bg-white transition-all shadow-sm
                          ${isMatched 
                            ? "border-green-300 ring-2 ring-accent-success/10 bg-green-50/10" 
                            : "border-slate-200"}
                        `}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={comment.authorAvatar}
                              alt={comment.author}
                              className="h-5 w-5 rounded-full object-cover border border-slate-200"
                            />
                            <span className="text-xs font-bold text-slate-800">{comment.author}</span>
                          </div>
                          
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider
                            ${isMatched ? "bg-accent-success/10 text-accent-success" : "bg-slate-100 text-slate-400"}
                          `}>
                            {isMatched ? "Match" : "No Match"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-medium italic mb-2">
                          &ldquo;{highlightKeywords(comment.text)}&rdquo;
                        </p>
                        
                        {isMatched && (
                          <div className="bg-slate-50 rounded-lg p-2 border border-slate-150 text-[10px] text-slate-500 italic">
                            <span className="font-bold text-google-blue block mb-0.5">Dispatched Response preview:</span>
                            {replyTextPreview
                              .replace(/\{\{commenter_name\}\}/g, comment.author)
                              .replace(/\{\{channel_name\}\}/g, "TechUnboxed")
                              .replace(/\{\{video_title\}\}/g, comment.videoTitle)
                              .replace(/\{\{custom_variable_1\}\}/g, customVar1)
                              .replace(/\{\{custom_variable_2\}\}/g, customVar2)
                              .replace(/\{\{custom_variable_3\}\}/g, customVar3)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="flex h-12 items-center justify-end border-t border-slate-100 bg-white px-4">
                <button
                  onClick={() => setTestingDrawerOpen(false)}
                  className="rounded-full bg-slate-900 hover:bg-slate-800 px-5 py-1.5 text-xs font-semibold text-white transition active:scale-95"
                >
                  Done Testing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
