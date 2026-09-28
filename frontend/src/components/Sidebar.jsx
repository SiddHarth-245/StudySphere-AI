import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Library, MessageCircle, GraduationCap,
  Layers, Share2, Route, User, LogOut, Sparkles, FileStack,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import OrbitOrb from "./OrbitOrb";

const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/library", label: "My Library", icon: Library },
  { to: "/app/chat", label: "AI Chat", icon: MessageCircle },
  { to: "/app/summarizer", label: "Summarizer", icon: FileStack },
  { to: "/app/exam-assistant", label: "Exam Assistant", icon: GraduationCap },
  { to: "/app/flashcards", label: "Flashcards", icon: Layers },
  { to: "/app/knowledge-explorer", label: "Knowledge Explorer", icon: Share2 },
  { to: "/app/study-path", label: "AI Study Path", icon: Route },
  { to: "/app/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 h-screen sticky top-0 glass border-r border-white/10 px-4 py-6">
      <div className="flex items-center gap-3 px-2 mb-8">
        <OrbitOrb size="w-10 h-10" />
        <div>
          <p className="font-display font-bold text-white leading-tight">StudySphere AI</p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orbit-cyan" /> Academic Companion
          </p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-white/[0.07] border border-white/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={`relative w-4.5 h-4.5 w-[18px] h-[18px] ${isActive ? "text-orbit-cyan" : ""}`} />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-orbit-gradient flex items-center justify-center text-sm font-bold text-white">
            {user?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
