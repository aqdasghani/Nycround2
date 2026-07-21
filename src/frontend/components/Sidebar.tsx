"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUIStore } from "@/frontend/store";
import { 
  LayoutDashboard, 
  Settings, 
  MessageSquare, 
  Sliders, 
  FolderHeart, 
  BarChart3,
  Youtube,
  LogOut,
  ChevronDown,
  UserCheck
} from "lucide-react";

interface Channel {
  id: string;
  name: string;
  avatar: string;
  handle: string;
  status: "active" | "quota_error";
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeChannelId = useUIStore((state) => state.activeChannelId);
  const setActiveChannelId = useUIStore((state) => state.setActiveChannelId);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const showToast = useUIStore((state) => state.showToast);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
  const [userSession, setUserSession] = useState<any>(null);

  // Fetch channels on mount and when UI refreshes
  const refreshTrigger = useUIStore((state) => state.refreshTrigger);

  useEffect(() => {
    async function fetchChannelsAndSettings() {
      try {
        const [chRes, setRes] = await Promise.all([
          fetch("/api/channels"),
          fetch("/api/settings")
        ]);
        if (chRes.ok) {
          const data = await chRes.json();
          setChannels(data);
        }
        if (setRes.ok) {
          const data = await setRes.json();
          setWorkspaceName(data.workspace?.name || "My Workspace");
          setUserSession(data.userSession || null);
        }
      } catch (err) {
        console.error("Error fetching sidebar data:", err);
      }
    }
    fetchChannelsAndSettings();
  }, [refreshTrigger]);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* App Sidebar Shell */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar-bg text-slate-100 transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0 w-[240px]" : "-translate-x-full md:translate-x-0 md:w-[72px] lg:w-[240px]"}
        `}
      >
        {/* Workspace Switcher */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-google-blue font-display text-base font-semibold text-white">
              {(workspaceName || "M").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col truncate lg:block md:hidden">
              <span className="font-display text-sm font-semibold tracking-wide">
                {workspaceName}
              </span>

            </div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 lg:block md:hidden" />
        </div>

        {/* Channels Switcher List */}
        <div className="border-b border-slate-800 py-3 lg:px-2 md:px-0">
          <div className="px-3 mb-1.5 lg:block md:hidden">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Connected Channels
            </span>
          </div>
          <div className="space-y-1">
            {channels.map((ch) => {
              const isActive = activeChannelId === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChannelId(ch.id);
                    showToast(`Switched channel to ${ch.name}`, "success");
                  }}
                  className={`flex w-full items-center justify-between py-2 px-3 rounded-lg text-left transition-all duration-150 group
                    ${isActive ? "bg-slate-800 text-white font-medium" : "text-slate-300 hover:bg-slate-800/50 hover:text-white"}
                  `}
                >
                  <div className="flex items-center gap-2 overflow-hidden w-full">
                    {ch.avatar ? (
                      <img 
                        src={ch.avatar} 
                        alt={ch.name} 
                        className="h-6 w-6 shrink-0 rounded-full border border-slate-700 bg-slate-800 object-cover"
                      />
                    ) : (
                      <Youtube className="h-6 w-6 shrink-0 text-red-500" />
                    )}
                    <span className="truncate text-xs lg:block md:hidden">{ch.name}</span>
                  </div>

                  {/* Channel health badge */}
                  <div className="flex items-center gap-1.5">
                    <span 
                      className={`h-2 w-2 rounded-full shrink-0
                        ${ch.status === "active" ? "bg-accent-success" : "bg-accent-danger live-pulse"}
                      `}
                      title={ch.status === "active" ? "Active polling" : "Quota exceeded / connection warning"}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-1 py-4 lg:px-2 md:px-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive ? "text-white bg-slate-800/80" : "text-slate-300 hover:bg-slate-850 hover:text-white"}
                `}
              >
                {/* Active side indicator blue bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-google-blue rounded-r"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-google-blue" : "text-slate-400 group-hover:text-white"}`} />
                <span className="truncate lg:block md:hidden">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Profile & Settings */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src={userSession?.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(userSession.name || "Creator")}&background=1a73e8&color=fff` : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"}
                alt={userSession?.name || "Creator"}
                className="h-8 w-8 shrink-0 rounded-full border border-slate-700 object-cover"
              />
              <div className="flex flex-col truncate lg:block md:hidden">
                <span className="text-xs font-semibold text-slate-100 block truncate">
                  {userSession?.name || "Creator"}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {userSession?.email || "No Email"}
                </span>
              </div>
            </div>
            <button 
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", { method: "POST" });
                } catch (e) {
                  console.error("Logout failed:", e);
                }
                router.push("/login");
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-850 hover:text-white lg:block md:hidden"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
