import React, { useState } from "react";
import { motion } from "framer-motion";
import { Route, Sparkles, CalendarCheck, RefreshCw } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useDocuments } from "../context/DocumentsContext";
import { PageHeader, DocumentPicker, EmptyState } from "../components/Shared";
import OrbitOrb from "../components/OrbitOrb";

export default function StudyPath() {
  const { documents, selectedDocumentId } = useDocuments();
  const [days, setDays] = useState(5);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasReadyDocs = documents.some((d) => d.status === "ready");

  const generate = async () => {
    if (!selectedDocumentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/study-path/generate", { document_id: selectedDocumentId, days: Number(days) });
      setPlan(res.data.plan);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="AI Study Path"
        subtitle="A personalized, day-by-day learning + revision timeline built from your material."
        icon={Route}
        action={<DocumentPicker />}
      />

      {!hasReadyDocs ? (
        <EmptyState icon={Route} title="No documents ready" description="Upload and process a document first to generate a study path from it." />
      ) : (
        <>
          <div className="glass-card p-5 mb-8 flex flex-wrap items-end gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-2">Plan duration (days)</p>
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="input-field w-24 py-2"
              />
            </div>
            <button onClick={generate} disabled={loading} className="btn-primary text-sm px-5 py-2.5 ml-auto">
              {loading ? "Planning..." : plan ? "Regenerate Path" : "Generate Study Path"}
              {plan ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </button>
          </div>

          {error && <div className="glass-card p-4 text-sm text-red-300 mb-4">{error}</div>}

          {loading && (
            <div className="glass-card p-8 flex flex-col items-center text-center">
              <OrbitOrb size="w-12 h-12" speaking />
              <p className="text-slate-400 text-sm mt-4">ORBIT is designing your study timeline...</p>
            </div>
          )}

          {!loading && plan && (
            <div className="relative pl-8">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 0.8 }}
                className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-orbit-purple via-orbit-blue to-orbit-cyan"
              />
              <div className="space-y-6">
                {plan.map((day, i) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className="relative"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.12 + 0.1, type: "spring" }}
                      className={`absolute -left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-space-950 ${
                        day.is_revision ? "bg-orbit-cyan" : "bg-orbit-gradient"
                      }`}
                    >
                      {day.is_revision && <CalendarCheck className="w-3 h-3 text-space-950" />}
                    </motion.div>
                    <div className="glass-card p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-orbit-cyan uppercase tracking-wide">
                          Day {day.day}
                        </span>
                        {day.is_revision && (
                          <span className="text-[11px] px-2.5 py-1 rounded-full bg-orbit-cyan/15 text-orbit-cyan">
                            Revision
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-semibold text-white mb-2">{day.title}</h4>
                      <ul className="space-y-1.5">
                        {day.topics.map((topic, ti) => (
                          <li key={ti} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orbit-purple mt-1.5 shrink-0" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {!loading && !plan && !error && (
            <EmptyState icon={Sparkles} title="No study path yet" description="Choose a number of days and click Generate Study Path." />
          )}
        </>
      )}
    </div>
  );
}
