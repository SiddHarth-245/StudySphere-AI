import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, FileText, Trash2, CheckCircle2, XCircle, Loader2, BookOpen,
} from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useDocuments } from "../context/DocumentsContext";
import { PageHeader, EmptyState } from "../components/Shared";

const STAGES = [
  { key: "uploading", label: "Uploading Document..." },
  { key: "extracting", label: "Extracting Knowledge..." },
  { key: "embedding", label: "Building AI Memory..." },
  { key: "ready", label: "StudySphere is Ready!" },
];

function UploadCard({ file, onDone }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const timers = useRef([]);

  React.useEffect(() => {
    const upload = async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Advance to "extracting" once the raw upload bytes finish transferring,
        // then simulate the remaining pipeline stages while the backend
        // synchronously extracts, chunks, and embeds the document.
        const extractingTimer = setTimeout(() => setStageIndex(1), 250);
        const embeddingTimer = setTimeout(() => setStageIndex(2), 1400);
        timers.current.push(extractingTimer, embeddingTimer);

        const res = await api.post("/api/documents/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (evt) => {
            const pct = Math.round((evt.loaded * 100) / (evt.total || 1));
            setProgress(pct);
          },
        });

        timers.current.forEach(clearTimeout);
        setStageIndex(3);
        setProgress(100);
        setTimeout(() => onDone(res.data), 600);
      } catch (err) {
        timers.current.forEach(clearTimeout);
        setError(getErrorMessage(err, "Upload failed."));
      }
    };
    upload();
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-5 h-5 text-orbit-cyan shrink-0" />
        <span className="text-sm text-slate-200 truncate flex-1">{file.name}</span>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-red-300 text-sm">
          <XCircle className="w-4 h-4" /> {error}
        </div>
      ) : (
        <>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-orbit-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${stageIndex === 0 ? progress : (stageIndex / 3) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            {stageIndex === 3 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin text-orbit-cyan" />
            )}
            <AnimatePresence mode="wait">
              <motion.span
                key={stageIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                {STAGES[stageIndex].label}
              </motion.span>
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function Library() {
  const { documents, refresh } = useDocuments();
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef();

  const handleFiles = useCallback((fileList) => {
    const pdfFiles = Array.from(fileList).filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (pdfFiles.length === 0) return;
    setUploadingFiles((prev) => [...prev, ...pdfFiles.map((f) => ({ id: `${f.name}-${Date.now()}-${Math.random()}`, file: f }))]);
  }, []);

  const handleUploadDone = (id) => {
    setUploadingFiles((prev) => prev.filter((u) => u.id !== id));
    refresh();
  };

  const handleDelete = async (docId) => {
    if (!confirm("Delete this document? This also removes its chat history, flashcards, and study paths.")) return;
    await api.delete(`/api/documents/${docId}`);
    refresh();
  };

  return (
    <div>
      <PageHeader
        title="My Library"
        subtitle="Upload PDFs — notes, books, papers, question banks — to build ORBIT's memory."
        icon={BookOpen}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`glass-card border-2 border-dashed cursor-pointer transition-all p-10 flex flex-col items-center text-center mb-8 ${
          dragActive ? "border-orbit-cyan bg-white/[0.06]" : "border-white/10 hover:border-white/20"
        }`}
      >
        <motion.div animate={{ y: dragActive ? -6 : 0 }} className="w-14 h-14 rounded-2xl bg-orbit-gradient/20 border border-white/10 flex items-center justify-center mb-4">
          <UploadCloud className="w-6 h-6 text-orbit-cyan" />
        </motion.div>
        <p className="text-white font-medium mb-1">Drag & drop your PDFs here</p>
        <p className="text-slate-400 text-sm">or click to browse — supports multiple files</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploadingFiles.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <AnimatePresence>
            {uploadingFiles.map((u) => (
              <UploadCard key={u.id} file={u.file} onDone={() => handleUploadDone(u.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {documents.length === 0 && uploadingFiles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Your library is empty"
          description="Upload your first PDF above to start chatting, summarizing, and generating study material from it."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-orbit-gradient/20 border border-white/10 flex items-center justify-center">
                  <FileText className="w-4.5 h-4.5 w-[18px] h-[18px] text-orbit-cyan" />
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-white truncate mb-1" title={doc.filename}>{doc.filename}</p>
              <p className="text-xs text-slate-500 mb-3">
                {doc.num_pages} pages · {doc.num_chunks} chunks
              </p>
              <span
                className={`text-[11px] w-fit px-2.5 py-1 rounded-full ${
                  doc.status === "ready"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : doc.status === "failed"
                    ? "bg-red-500/15 text-red-300"
                    : "bg-amber-500/15 text-amber-300"
                }`}
              >
                {doc.status === "ready" ? "Ready" : doc.status === "failed" ? "Failed" : "Processing"}
              </span>
              {doc.status === "failed" && doc.error_message && (
                <p className="text-[11px] text-red-400 mt-2">{doc.error_message}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
