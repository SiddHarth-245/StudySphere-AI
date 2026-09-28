import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ChevronLeft, ChevronRight, Sparkles, RotateCw } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useDocuments } from "../context/DocumentsContext";
import { PageHeader, DocumentPicker, EmptyState } from "../components/Shared";
import OrbitOrb from "../components/OrbitOrb";

function Flashcard({ card }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => setFlipped(false), [card]);

  return (
    <div className="[perspective:1200px] w-full max-w-xl mx-auto h-72">
      <motion.div
        className="relative w-full h-full cursor-pointer [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => setFlipped(!flipped)}
      >
        {/* Front */}
        <div className="absolute inset-0 [backface-visibility:hidden] glass-card p-8 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] uppercase tracking-wider text-orbit-cyan mb-3">Question</span>
          <p className="text-lg font-medium text-white leading-relaxed">{card.question}</p>
          <span className="absolute bottom-4 text-[11px] text-slate-500 flex items-center gap-1">
            <RotateCw className="w-3 h-3" /> Click to flip
          </span>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 [backface-visibility:hidden] glass-card p-8 flex flex-col items-center justify-center text-center bg-orbit-gradient/10"
          style={{ transform: "rotateY(180deg)" }}
        >
          <span className="text-[11px] uppercase tracking-wider text-orbit-cyan mb-3">Answer</span>
          <p className="text-base text-slate-100 leading-relaxed">{card.answer}</p>
          <span className="absolute bottom-4 text-[11px] text-slate-500 flex items-center gap-1">
            <RotateCw className="w-3 h-3" /> Click to flip back
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export default function Flashcards() {
  const { documents, selectedDocumentId } = useDocuments();
  const [count, setCount] = useState(8);
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasReadyDocs = documents.some((d) => d.status === "ready");

  useEffect(() => {
    if (!selectedDocumentId) return;
    api.get(`/api/flashcards?document_id=${selectedDocumentId}`).then((res) => {
      setCards(res.data);
      setIndex(0);
    });
  }, [selectedDocumentId]);

  const generate = async () => {
    if (!selectedDocumentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/flashcards/generate", { document_id: selectedDocumentId, count: Number(count) });
      setCards(res.data);
      setIndex(0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Flashcard Generator"
        subtitle="Rapid-fire, flippable flashcards generated straight from your materials."
        icon={Layers}
        action={<DocumentPicker />}
      />

      {!hasReadyDocs ? (
        <EmptyState icon={Layers} title="No documents ready" description="Upload and process a document first to generate flashcards from it." />
      ) : (
        <>
          <div className="glass-card p-5 mb-8 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-2">Number of flashcards</p>
              <input
                type="number"
                min={1}
                max={30}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="input-field w-24 py-2"
              />
            </div>
            <button onClick={generate} disabled={loading} className="btn-primary text-sm px-5 py-2.5 ml-auto self-end">
              {loading ? "Generating..." : "Generate Flashcards"} <Sparkles className="w-4 h-4" />
            </button>
          </div>

          {error && <div className="glass-card p-4 text-sm text-red-300 mb-4">{error}</div>}

          {loading && (
            <div className="glass-card p-8 flex flex-col items-center text-center">
              <OrbitOrb size="w-12 h-12" speaking />
              <p className="text-slate-400 text-sm mt-4">ORBIT is turning your notes into flashcards...</p>
            </div>
          )}

          {!loading && cards.length > 0 && (
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <Flashcard card={cards[index]} />
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index === 0}
                  className="btn-secondary px-3 py-2.5 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-400">
                  {index + 1} / {cards.length}
                </span>
                <button
                  onClick={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}
                  disabled={index === cards.length - 1}
                  className="btn-secondary px-3 py-2.5 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {!loading && cards.length === 0 && !error && (
            <EmptyState icon={Sparkles} title="No flashcards yet" description="Choose a count above and click Generate Flashcards." />
          )}
        </>
      )}
    </div>
  );
}
