"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/frontend/store";
import { 
  Search, 
  X, 
  Youtube, 
  Sliders, 
  FolderHeart, 
  LayoutDashboard, 
  Settings, 
  ArrowRight,
  TrendingUp,
  MessageSquare
} from "lucide-react";

interface SearchItem {
  id: string;
  name: string;
  category: "Pages" | "Channels" | "Rules";
  url: string;
  icon: any;
  action?: () => void;
}

export default function CommandPalette() {
  const router = useRouter();
  const isOpen = useUIStore((state) => state.commandPaletteOpen);
  const setIsOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const setActiveChannelId = useUIStore((state) => state.setActiveChannelId);
  const showToast = useUIStore((state) => state.showToast);
  const refreshTrigger = useUIStore((state) => state.refreshTrigger);

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Default items + dynamic items fetched from API
  useEffect(() => {
    async function loadItems() {
      const pageItems: SearchItem[] = [
        { id: "p-dash", name: "Go to Dashboard Overview", category: "Pages", url: "/dashboard", icon: LayoutDashboard },
        { id: "p-feed", name: "Go to Live Comment Feed", category: "Pages", url: "/dashboard/feed", icon: MessageSquare },
        { id: "p-rules", name: "Go to Rule Builder list", category: "Pages", url: "/dashboard/rules", icon: Sliders },
        { id: "p-tpl", name: "Go to Template Library", category: "Pages", url: "/dashboard/templates", icon: FolderHeart },
        { id: "p-analytics", name: "Go to Analytics Charts", category: "Pages", url: "/dashboard/analytics", icon: TrendingUp },
        { id: "p-settings", name: "Go to Workspace Settings", category: "Pages", url: "/dashboard/settings", icon: Settings },
      ];

      try {
        const [channelsRes, rulesRes] = await Promise.all([
          fetch("/api/channels"),
          fetch("/api/rules")
        ]);

        let channelItems: SearchItem[] = [];
        if (channelsRes.ok) {
          const channels = await channelsRes.json();
          channelItems = channels.map((c: any) => ({
            id: `c-${c.id}`,
            name: `Switch Active Channel to ${c.name} (${c.handle})`,
            category: "Channels",
            url: "/dashboard",
            icon: Youtube,
            action: () => {
              setActiveChannelId(c.id);
              showToast(`Switched active channel to ${c.name}`);
            }
          }));
        }

        let ruleItems: SearchItem[] = [];
        if (rulesRes.ok) {
          const rules = await rulesRes.json();
          ruleItems = rules.map((r: any) => ({
            id: `r-${r.id}`,
            name: `Edit Rule: ${r.name}`,
            category: "Rules",
            url: `/dashboard/rules/${r.id}`,
            icon: Sliders
          }));
        }

        setItems([...pageItems, ...channelItems, ...ruleItems]);
      } catch (err) {
        console.error("Error loading command palette search items:", err);
        setItems(pageItems);
      }
    }

    if (isOpen) {
      loadItems();
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, refreshTrigger, setActiveChannelId, showToast]);

  // Handle keyboard select / navigation
  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    }
  };

  const handleSelect = (item: SearchItem) => {
    setIsOpen(false);
    if (item.action) {
      item.action();
    }
    router.push(item.url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative w-full max-w-[550px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-google-modal focus-within:ring-2 focus-within:ring-google-blue/20"
            onKeyDown={handleKeyDown}
          >
            {/* Search Input bar */}
            <div className="flex h-12 items-center gap-3 border-b border-slate-100 px-4">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command or search rules, channels..."
                className="w-full h-full text-sm outline-none placeholder:text-slate-400 text-slate-800"
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results listing */}
            <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No matching results found for &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Group items by category in UI or just render list */}
                  {filtered.map((item, index) => {
                    const isSelected = selectedIndex === index;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-all duration-75
                          ${isSelected ? "bg-google-blue-light text-google-blue" : "text-slate-700 hover:bg-slate-50"}
                        `}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <item.icon className={`h-4.5 w-4.5 shrink-0 ${isSelected ? "text-google-blue" : "text-slate-400"}`} />
                          <span className="truncate font-medium">{item.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider
                            ${item.category === "Pages" ? "bg-slate-100 text-slate-600" : ""}
                            ${item.category === "Channels" ? "bg-green-50 text-green-700" : ""}
                            ${item.category === "Rules" ? "bg-red-50 text-red-700" : ""}
                          `}>
                            {item.category}
                          </span>
                          {isSelected && <ArrowRight className="h-3 w-3 shrink-0 text-google-blue" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with hint keys */}
            <div className="flex h-9 items-center justify-between border-t border-slate-100 bg-slate-50 px-4 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>Navigate:</span>
                <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-sans font-semibold shadow-sm">↑↓</kbd>
                <span>Select:</span>
                <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-sans font-semibold shadow-sm">↵</kbd>
              </div>
              <div className="flex items-center gap-1">
                <span>Close:</span>
                <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-sans font-semibold shadow-sm">esc</kbd>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
