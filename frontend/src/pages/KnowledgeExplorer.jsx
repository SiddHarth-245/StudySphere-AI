import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Sparkles, ChevronDown } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useDocuments } from "../context/DocumentsContext";
import { PageHeader, DocumentPicker, EmptyState } from "../components/Shared";
import OrbitOrb from "../components/OrbitOrb";

function SubtopicNode({ node, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ scale: 1.04 }}
      className="glass rounded-xl px-4 py-2.5 text-xs text-slate-200 whitespace-nowrap"
    >
      {node.name}
    </motion.div>
  );
}

function TopicNode({ node, index }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col items-center">
      <motion.button
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.12 }}
        whileHover={{ y: -3 }}
        onClick={() => setOpen(!open)}
        className="glass-card px-5 py-3 text-sm font-medium text-white flex items-center gap-2 shadow-glow/20"
      >
        {node.name}
        {node.children?.length > 0 && (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </motion.button>

      <AnimatePresence>
        {open && node.children?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center overflow-hidden"
          >
            <div className="w-px h-6 bg-white/15" />
            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              {node.children.map((child, i) => (
                <SubtopicNode key={child.name + i} node={child} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function KnowledgeExplorer() {
  const { documents, selectedDocumentId } = useDocuments();
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasReadyDocs = documents.some((d) => d.status === "ready");

  const generate = async () => {
    if (!selectedDocumentId) return;
    setLoading(true);
    setError("");
    setGraph(null);
    try {
      const res = await api.post("/api/knowledge/graph", { document_id: selectedDocumentId });
      setGraph(res.data.root);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Knowledge Explorer"
        subtitle="Visualize how your subject breaks down into topics and subtopics."
        icon={Share2}
        action={
          <div className="flex items-center gap-3">
            <DocumentPicker />
            <button onClick={generate} disabled={loading || !hasReadyDocs} className="btn-primary text-sm px-5 py-2.5">
              {loading ? "Mapping..." : "Build Map"} <Sparkles className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {!hasReadyDocs ? (
        <EmptyState icon={Share2} title="No documents ready" description="Upload and process a document first to explore its topic map." />
      ) : error ? (
        <div className="glass-card p-4 text-sm text-red-300">{error}</div>
      ) : loading ? (
        <div className="glass-card p-8 flex flex-col items-center text-center">
          <OrbitOrb size="w-12 h-12" speaking />
          <p className="text-slate-400 text-sm mt-4">ORBIT is mapping the knowledge structure...</p>
        </div>
      ) : !graph ? (
        <EmptyState icon={Sparkles} title="No map yet" description="Click Build Map to visualize this document's topic hierarchy." />
      ) : (
        <div className="glass-card p-10 overflow-x-auto">
          <div className="flex flex-col items-center min-w-max">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-3.5 rounded-2xl bg-orbit-gradient text-white font-display font-semibold shadow-glow mb-2"
            >
              {graph.name}
            </motion.div>
            <div className="w-px h-8 bg-white/15" />
            <div className="flex flex-wrap justify-center gap-8">
              {graph.children?.map((topic, i) => (
                <TopicNode key={topic.name + i} node={topic} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
