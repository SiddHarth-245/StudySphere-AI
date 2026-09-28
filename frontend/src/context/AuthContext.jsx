import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("studysphere_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("studysphere_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/api/auth/me")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("studysphere_user", JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem("studysphere_token");
        localStorage.removeItem("studysphere_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSession = (data) => {
    localStorage.setItem("studysphere_token", data.access_token);
    localStorage.setItem("studysphere_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const signup = async (payload) => {
    const res = await api.post("/api/auth/signup", payload);
    persistSession(res.data);
    return res.data;
  };

  const login = async (payload) => {
    const res = await api.post("/api/auth/login", payload);
    persistSession(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("studysphere_token");
    localStorage.removeItem("studysphere_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
