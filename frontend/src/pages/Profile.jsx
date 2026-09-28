import React from "react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, LogOut, FileText, MessageCircle, Layers, Route } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDocuments } from "../context/DocumentsContext";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/Shared";
import OrbitOrb from "../components/OrbitOrb";
import { useEffect, useState } from "react";
import api from "../api/client";

export default function Profile() {
  const { user, logout } = useAuth();
  const { documents } = useDocuments();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/api/dashboard/stats").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your StudySphere AI account and activity." icon={User} />

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 lg:col-span-1 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 rounded-full bg-orbit-gradient flex items-center justify-center text-2xl font-bold text-white mb-4">
            {user?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <h3 className="font-display font-semibold text-white text-lg">{user?.full_name}</h3>
          <p className="text-slate-500 text-xs">StudySphere AI Member</p>

          <div className="w-full mt-6 space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Mail className="w-4 h-4 text-orbit-cyan shrink-0" /> {user?.email}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Calendar className="w-4 h-4 text-orbit-cyan shrink-0" /> Joined {joinDate}
            </div>
          </div>

          <button onClick={handleLogout} className="btn-secondary w-full mt-6 text-sm py-2.5">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-3 mb-6">
            <OrbitOrb size="w-10 h-10" />
            <div>
              <p className="font-display font-semibold text-white">Your Activity with ORBIT</p>
              <p className="text-slate-500 text-xs">A quick snapshot of your learning journey so far.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: FileText, label: "Documents Uploaded", value: stats?.total_documents ?? documents.length },
              { icon: MessageCircle, label: "Questions Asked", value: stats?.questions_asked ?? "—" },
              { icon: Route, label: "Study Sessions", value: stats?.study_sessions ?? "—" },
              { icon: Layers, label: "Flashcards Generated", value: stats?.flashcards_generated ?? "—" },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-orbit-cyan" />
                </div>
                <div>
                  <p className="text-lg font-display font-bold text-white leading-tight">{item.value}</p>
                  <p className="text-[11px] text-slate-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
