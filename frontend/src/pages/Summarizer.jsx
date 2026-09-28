import React, { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { FileStack, Sparkles, Copy, Check } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useDocuments } from "../context/DocumentsContext";
import { PageHeader, DocumentPicker, EmptyState } from "../components/Shared";
import OrbitOrb from "../components/OrbitOrb";

const SUMMARY_TYPES = [
  { key: "bullet", label: "Bullet Points" },
  { key: "short", label: "Short Summary" },
  { key: "detailed", label: "Detailed Summary" },
];

export default function Summarizer() {
  const { documents, selectedDocumentId } = useDocuments();
  const [summaryType, setSummaryType] = useState("bullet");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const hasReadyDocs = documents.some((d) => d.status === "ready");

  const generate = async () => {
    if (!selectedDocumentId) return;
    setLoading(true);
    setError("");
    setSummary("");
    try {
      const res = await api.post("/api/summarize", { document_id: selectedDocumentId, summary_type: summaryType });
      setSummary(res.data.summary);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <PageHeader
        title="PDF Summarizer"
        subtitle="Condense any uploaded document into short, detailed, or bullet-point notes."
        icon={FileStack}
        action={<DocumentPicker />}
      />

      {!hasReadyDocs ? (
        <EmptyState icon={FileStack} title="No documents ready" description="Upload and wait for a document to finish processing before summarizing it." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {SUMMARY_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setSummaryType(t.key)}
                className={`text-xs px-3.5 py-2 rounded-full border transition-all ${
                  summaryType === t.key
                    ? "bg-orbit-gradient text-white border-transparent shadow-glow"
                    : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                {t.label}
              </button>
            ))}
            <button onClick={generate} disabled={loading} className="btn-primary text-sm px-5 py-2 ml-auto">
              {loading ? "Summarizing..." : "Generate Summary"} <Sparkles className="w-4 h-4" />
            </button>
          </div>

          {error && <div className="glass-card p-4 text-sm text-red-300 mb-4">{error}</div>}

          {loading && (
            <div className="glass-card p-8 flex flex-col items-center text-center">
              <OrbitOrb size="w-12 h-12" speaking />
              <p className="text-slate-400 text-sm mt-4">ORBIT is reading through your document...</p>
            </div>
          )}

          {!loading && summary && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 relative">
              <button
                onClick={copySummary}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <div className="markdown-body text-sm text-slate-100 pr-16">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </motion.div>
          )}

          {!loading && !summary && !error && (
            <EmptyState
              icon={Sparkles}
              title="Ready when you are"
              description="Pick a summary style above and click Generate Summary."
            />
          )}
        </>
      )}
    </div>
  );
}
