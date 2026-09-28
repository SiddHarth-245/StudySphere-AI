import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText, MessageCircle, Route, Layers, Upload, ArrowRight,
} from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useDocuments } from "../context/DocumentsContext";
import { PageHeader } from "../components/Shared";
import OrbitOrb from "../components/OrbitOrb";

function StatCard({ icon: Icon, label, value, index, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="glass-card p-5 relative overflow-hidden"
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-30 ${accent}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs mb-2">{label}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.08 + 0.2 }}
            className="text-3xl font-display font-bold text-white"
          >
            {value}
          </motion.p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 w-[18px] h-[18px] text-orbit-cyan" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { documents } = useDocuments();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/api/dashboard/stats").then((res) => setStats(res.data)).catch(() => {});
  }, [documents]);

  const firstName = (user?.full_name || "Student").split(" ")[0];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Here's a snapshot of your academic workspace."
        icon={undefined}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="Total Documents" value={stats?.total_documents ?? "—"} index={0} accent="bg-orbit-purple" />
        <StatCard icon={MessageCircle} label="Questions Asked" value={stats?.questions_asked ?? "—"} index={1} accent="bg-orbit-blue" />
        <StatCard icon={Route} label="Study Sessions" value={stats?.study_sessions ?? "—"} index={2} accent="bg-orbit-cyan" />
        <StatCard icon={Layers} label="Flashcards Generated" value={stats?.flashcards_generated ?? "—"} index={3} accent="bg-orbit-violet" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <h3 className="font-display font-semibold text-white text-lg mb-4">Your Documents</h3>
          {documents.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10">
              <Upload className="w-8 h-8 text-slate-500 mb-3" />
              <p className="text-slate-400 text-sm mb-4">No documents uploaded yet.</p>
              <Link to="/app/library" className="btn-primary text-sm px-5 py-2.5">
                Upload your first document <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.slice(0, 6).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-orbit-cyan shrink-0" />
                    <span className="text-sm text-slate-200 truncate">{doc.filename}</span>
                  </div>
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-full shrink-0 ${
                      doc.status === "ready"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : doc.status === "failed"
                        ? "bg-red-500/15 text-red-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
              <Link to="/app/library" className="block text-center text-sm text-orbit-cyan hover:underline pt-2">
                View all documents →
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 flex flex-col items-center text-center justify-center"
        >
          <OrbitOrb size="w-16 h-16" />
          <p className="text-slate-300 text-sm mt-4 mb-5">
            "Hello! I'm ORBIT. Upload your notes and ask me anything — I'll answer straight from your material."
          </p>
          <Link to="/app/chat" className="btn-secondary text-sm px-5 py-2.5 w-full">
            Chat with ORBIT
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
