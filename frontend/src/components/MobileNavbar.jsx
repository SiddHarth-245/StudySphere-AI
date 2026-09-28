import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import OrbitOrb from "./OrbitOrb";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard" },
  { to: "/app/library", label: "My Library" },
  { to: "/app/chat", label: "AI Chat" },
  { to: "/app/summarizer", label: "Summarizer" },
  { to: "/app/exam-assistant", label: "Exam Assistant" },
  { to: "/app/flashcards", label: "Flashcards" },
  { to: "/app/knowledge-explorer", label: "Knowledge Explorer" },
  { to: "/app/study-path", label: "AI Study Path" },
  { to: "/app/profile", label: "Profile" },
];

export default function MobileNavbar() {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="lg:hidden sticky top-0 z-40 glass border-b border-white/10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <OrbitOrb size="w-8 h-8" />
        <span className="font-display font-bold text-white text-sm">StudySphere AI</span>
      </div>
      <button onClick={() => setOpen(!open)} className="p-2 text-white">
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 glass border-b border-white/10 px-4 py-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? "bg-white/10 text-white" : "text-slate-400"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-400"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
