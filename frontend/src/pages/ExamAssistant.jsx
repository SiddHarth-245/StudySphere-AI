import React, { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { GraduationCap, Sparkles, Copy, Check } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useDocuments } from "../context/DocumentsContext";
import { PageHeader, DocumentPicker, EmptyState } from "../components/Shared";
import OrbitOrb from "../components/OrbitOrb";

const QUESTION_TYPES = [
  { key: "important", label: "Important Questions" },
  { key: "mcq", label: "MCQs" },
  { key: "short", label: "Short Questions" },
  { key: "long", label: "Long Questions" },
  { key: "revision_notes", label: "Revision Notes" },
  { key: "viva", label: "Viva Questions" },
];

const DIFFICULTIES = ["easy", "medium", "hard"];

export default function ExamAssistant() {
  const { documents, selectedDocumentId } = useDocuments();
  const [questionType, setQuestionType] = useState("important");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const hasReadyDocs = documents.some((d) => d.status === "ready");

  const generate = async () => {
    if (!selectedDocumentId) return;
    setLoading(true);
    setError("");
    setContent("");
    try {
      const res = await api.post("/api/exam/generate", {
        document_id: selectedDocumentId,
        question_type: questionType,
        difficulty,
        count: Number(count),
      });
      setContent(res.data.content);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const copyContent = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <PageHeader
        title="AI Exam Assistant"
        subtitle="Generate MCQs, short/long questions, revision notes, and viva questions."
        icon={GraduationCap}
        action={<DocumentPicker />}
      />

      {!hasReadyDocs ? (
        <EmptyState icon={GraduationCap} title="No documents ready" description="Upload and process a document first to generate exam material from it." />
      ) : (
        <>
          <div className="glass-card p-5 mb-6 space-y-4">
            <div>
              <p className="text-xs text-slate-400 mb-2">Question Type</p>
              <div className="flex flex-wrap gap-2">
                {QUESTION_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setQuestionType(t.key)}
                    className={`text-xs px-3.5 py-2 rounded-full border transition-all ${
                      questionType === t.key
                        ? "bg-orbit-gradient text-white border-transparent shadow-glow"
                        : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs text-slate-400 mb-2">Difficulty</p>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`text-xs px-3.5 py-2 rounded-full border capitalize transition-all ${
                        difficulty === d
                          ? "bg-white/15 text-white border-white/20"
                          : "border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {questionType !== "revision_notes" && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">How many?</p>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="input-field w-24 py-2"
                  />
                </div>
              )}

              <button onClick={generate} disabled={loading} className="btn-primary text-sm px-5 py-2.5 ml-auto">
                {loading ? "Generating..." : "Generate"} <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && <div className="glass-card p-4 text-sm text-red-300 mb-4">{error}</div>}

          {loading && (
            <div className="glass-card p-8 flex flex-col items-center text-center">
              <OrbitOrb size="w-12 h-12" speaking />
              <p className="text-slate-400 text-sm mt-4">ORBIT is preparing your exam material...</p>
            </div>
          )}

          {!loading && content && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 relative">
              <button
                onClick={copyContent}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <div className="markdown-body text-sm text-slate-100 pr-16">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </motion.div>
          )}

          {!loading && !content && !error && (
            <EmptyState icon={Sparkles} title="Ready when you are" description="Choose a question type and click Generate." />
          )}
        </>
      )}
    </div>
  );
}
