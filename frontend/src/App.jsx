import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Library from "./pages/Library.jsx";
import Chat from "./pages/Chat.jsx";
import ExamAssistant from "./pages/ExamAssistant.jsx";
import Summarizer from "./pages/Summarizer.jsx";
import Flashcards from "./pages/Flashcards.jsx";
import KnowledgeExplorer from "./pages/KnowledgeExplorer.jsx";
import StudyPath from "./pages/StudyPath.jsx";
import Profile from "./pages/Profile.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="library" element={<Library />} />
        <Route path="chat" element={<Chat />} />
        <Route path="summarizer" element={<Summarizer />} />
        <Route path="exam-assistant" element={<ExamAssistant />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="knowledge-explorer" element={<KnowledgeExplorer />} />
        <Route path="study-path" element={<StudyPath />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
