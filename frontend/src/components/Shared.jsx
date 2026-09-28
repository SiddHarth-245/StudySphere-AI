import React from "react";
import { motion } from "framer-motion";
import { FileText, ChevronDown } from "lucide-react";
import { useDocuments } from "../context/DocumentsContext";
import { Link } from "react-router-dom";

export function PageHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-orbit-gradient/20 border border-white/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-orbit-cyan" />
          </div>
        )}
        <div>
          <h1 className="section-title">{title}</h1>
          {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </motion.div>
  );
}

export function DocumentPicker() {
  const { documents, selectedDocumentId, setSelectedDocumentId, loading } = useDocuments();
  const readyDocs = documents.filter((d) => d.status === "ready");

  if (loading) {
    return <div className="glass-card px-4 py-3 text-sm text-slate-400 animate-pulse">Loading your library...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="glass-card px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        No documents yet.{" "}
        <Link to="/app/library" className="text-orbit-cyan hover:underline">
          Upload one first
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={selectedDocumentId || ""}
        onChange={(e) => setSelectedDocumentId(Number(e.target.value))}
        className="appearance-none glass-card pl-4 pr-10 py-3 text-sm text-slate-100 outline-none cursor-pointer min-w-[240px]"
      >
        {readyDocs.length === 0 && <option value="">No ready documents</option>}
        {readyDocs.map((doc) => (
          <option key={doc.id} value={doc.id} className="bg-space-900">
            {doc.filename}
          </option>
        ))}
        {documents.filter((d) => d.status !== "ready").map((doc) => (
          <option key={doc.id} value={doc.id} disabled className="bg-space-900 text-slate-500">
            {doc.filename} ({doc.status})
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-slate-400" />
        </div>
      )}
      <h3 className="font-display font-semibold text-white text-lg mb-1">{title}</h3>
      <p className="text-slate-400 text-sm max-w-sm mb-5">{description}</p>
      {action}
    </div>
  );
}
