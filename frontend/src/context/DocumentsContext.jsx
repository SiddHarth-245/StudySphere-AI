import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "./AuthContext";

const DocumentsContext = createContext(null);

export function DocumentsProvider({ children }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get("/api/documents");
      setDocuments(res.data);
      setSelectedDocumentId((prev) => {
        if (prev && res.data.some((d) => d.id === prev)) return prev;
        const ready = res.data.find((d) => d.status === "ready");
        return ready ? ready.id : res.data[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else {
      setDocuments([]);
      setSelectedDocumentId(null);
    }
  }, [user, refresh]);

  const selectedDocument = documents.find((d) => d.id === selectedDocumentId) || null;

  return (
    <DocumentsContext.Provider
      value={{ documents, loading, refresh, selectedDocumentId, setSelectedDocumentId, selectedDocument }}
    >
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentsProvider");
  return ctx;
}
