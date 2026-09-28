import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Send, Copy, RotateCcw, Trash2, FileText, Check, Sparkles,
} from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useDocuments } from "../context/DocumentsContext";
import { PageHeader, DocumentPicker, EmptyState } from "../components/Shared";
import OrbitOrb from "../components/OrbitOrb";

const STUDY_MODES = [
  { key: "detailed", label: "Detailed" },
  { key: "explain_simply", label: "Explain Simply" },
  { key: "exam_prep", label: "Exam Prep" },
  { key: "quick_revision", label: "Quick Revision" },
  { key: "beginner", label: "Beginner" },
];

const SUGGESTED_QUESTIONS = [
  "What are the important topics?",
  "Explain this chapter simply.",
  "Generate exam questions.",
  "Summarize this document.",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-orbit-cyan"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function SourceCard({ source }) {
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <div className="flex items-center gap-1.5 text-orbit-cyan font-medium mb-1">
        <FileText className="w-3 h-3" /> {source.document_name} · Page {source.page_number}
      </div>
      <p className="text-slate-400 line-clamp-2">{source.snippet}</p>
    </div>
  );
}

function ChatBubble({ message, onCopy, onRegenerate, copied }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && <OrbitOrb size="w-8 h-8" pulsing={false} />}
      <div className={`max-w-[80%] ${isUser ? "order-1" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser ? "bg-orbit-gradient text-white" : "glass-card text-slate-100"
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.sources?.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            {message.sources.map((s, i) => (
              <SourceCard key={i} source={s} />
            ))}
          </div>
        )}

        {!isUser && !message.pending && (
          <div className="flex items-center gap-3 mt-2 px-1">
            <button onClick={() => onCopy(message)} className="text-slate-500 hover:text-white text-xs flex items-center gap-1 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button onClick={() => onRegenerate(message)} className="text-slate-500 hover:text-white text-xs flex items-center gap-1 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Regenerate
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const { documents, selectedDocumentId, selectedDocument } = useDocuments();
  const [studyMode, setStudyMode] = useState("detailed");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text, lastUserMessageOverride) => {
    const content = (lastUserMessageOverride ?? text ?? input).trim();
    if (!content || sending) return;

    if (!lastUserMessageOverride) {
      setMessages((prev) => [...prev, { role: "user", content }]);
      setInput("");
    }
    setMessages((prev) => [...prev, { role: "assistant", content: "", pending: true }]);
    setSending(true);

    try {
      const res = await api.post("/api/chat", {
        message: content,
        document_id: selectedDocumentId,
        study_mode: studyMode,
      });
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: res.data.answer, sources: res.data.sources };
        return copy;
      });
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${getErrorMessage(err)}` };
        return copy;
      });
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => prev.slice(0, -1)); // drop last assistant message
    sendMessage(null, lastUser.content);
  };

  const handleCopy = (message, idx) => {
    navigator.clipboard.writeText(message.content);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const clearChat = () => setMessages([]);

  const hasReadyDocs = documents.some((d) => d.status === "ready");

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      <PageHeader
        title="AI Chat"
        subtitle="Ask ORBIT anything about your uploaded material."
        action={
          <div className="flex items-center gap-3">
            <DocumentPicker />
            <button onClick={clearChat} className="btn-secondary text-sm px-3 py-3" title="Clear chat">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Study Mode Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STUDY_MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setStudyMode(mode.key)}
            className={`text-xs px-3.5 py-2 rounded-full border transition-all ${
              studyMode === mode.key
                ? "bg-orbit-gradient text-white border-transparent shadow-glow"
                : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="glass-card flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
          {!hasReadyDocs ? (
            <EmptyState
              icon={Sparkles}
              title="Upload a document to start chatting"
              description="ORBIT answers using your own uploaded materials. Head to My Library to add your first PDF."
            />
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <OrbitOrb size="w-16 h-16" />
              <p className="text-slate-300 mt-4 mb-1 font-medium">
                Hi, I'm ORBIT — ask me about {selectedDocument?.filename || "your document"}.
              </p>
              <p className="text-slate-500 text-sm mb-6">Try one of these to get started:</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs glass-card px-3.5 py-2 hover:bg-white/[0.08] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, i) =>
                m.pending ? (
                  <div key={i} className="flex gap-3">
                    <OrbitOrb size="w-8 h-8" speaking />
                    <div className="glass-card rounded-2xl">
                      <TypingIndicator />
                    </div>
                  </div>
                ) : (
                  <ChatBubble
                    key={i}
                    message={m}
                    onCopy={(msg) => handleCopy(msg, i)}
                    onRegenerate={handleRegenerate}
                    copied={copiedIndex === i}
                  />
                )
              )}
            </AnimatePresence>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="border-t border-white/10 p-4 flex items-center gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!hasReadyDocs || sending}
            placeholder={hasReadyDocs ? "Ask ORBIT about your document..." : "Upload a document first..."}
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={!hasReadyDocs || sending || !input.trim()}
            className="btn-primary px-4 py-3"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
