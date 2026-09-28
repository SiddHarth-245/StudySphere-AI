import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageCircle, Brain, GraduationCap, Layers, Share2, Route,
  ArrowRight, Sparkles, ShieldCheck, Zap,
} from "lucide-react";
import OrbitOrb from "../components/OrbitOrb";
import ParticleField from "../components/ParticleField";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "AI Document Chat",
    description: "Ask questions about your notes, books, or papers — perfect for assignments and project research — and get grounded, cited answers from ORBIT.",
  },
  {
    icon: Brain,
    title: "Smart Study Mode",
    description: "Switch between Beginner, Exam Prep, Quick Revision, and more — ORBIT adapts its teaching style instantly.",
  },
  {
    icon: GraduationCap,
    title: "AI Exam Assistant",
    description: "Generate MCQs, short/long questions, viva questions, and revision notes at any difficulty level.",
  },
  {
    icon: Layers,
    title: "Flashcard Generator",
    description: "Turn dense material into bite-sized, flippable flashcards you can rapid-fire through before exams.",
  },
  {
    icon: Share2,
    title: "Knowledge Explorer",
    description: "Visualize how topics connect with an interactive, animated subject → topic → subtopic map.",
  },
  {
    icon: Route,
    title: "AI Study Path",
    description: "A day-by-day, personalized learning + revision timeline generated straight from your materials.",
  },
];

function FeatureCard({ icon: Icon, title, description, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -6 }}
      className="glass-card p-6 group cursor-default"
    >
      <div className="w-12 h-12 rounded-xl bg-orbit-gradient/20 border border-white/10 flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
        <Icon className="w-5 h-5 text-orbit-cyan" />
      </div>
      <h3 className="font-display font-semibold text-white text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* NAVBAR */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <OrbitOrb size="w-9 h-9" />
          <span className="font-display font-bold text-white">StudySphere AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-slate-300 hover:text-white px-4 py-2 transition-colors">
            Log In
          </Link>
          <Link to="/signup" className="btn-primary text-sm px-4 py-2">
            Get Started
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative px-6 pt-10 pb-24 md:pt-16 md:pb-32 max-w-7xl mx-auto">
        <ParticleField count={26} />
        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass-card px-4 py-1.5 text-xs text-slate-300 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-orbit-cyan" /> Generative AI · RAG · Prompt Engineering
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl max-w-4xl leading-tight text-white"
          >
            Your Study Materials. <span className="text-gradient">Now Intelligent.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-slate-400 max-w-xl text-base md:text-lg"
          >
            Upload your notes, textbooks, or question papers and get real help with assignments, exam
            preparation, and project overviews — built around ORBIT, your personal academic knowledge companion.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/signup" className="btn-primary text-base px-7 py-3">
              Start Learning <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="btn-secondary text-base px-7 py-3">
              Explore Features
            </a>
          </motion.div>

          {/* Animated AI Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative mt-16 md:mt-20"
          >
            <div className="absolute inset-0 blur-3xl bg-orbit-gradient opacity-20 rounded-full" />
            <OrbitOrb size="w-40 h-40 md:w-52 md:h-52" />
            <motion.div
              className="absolute -inset-10 border border-white/10 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -inset-20 border border-white/5 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="px-6 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 -mt-6 mb-24">
        {[
          { icon: ShieldCheck, text: "Answers grounded in your own documents, with citations." },
          { icon: Zap, text: "Real RAG pipeline: chunking, embeddings, and FAISS retrieval." },
          { icon: Brain, text: "Prompt-engineered study modes tuned for how you like to learn." },
        ].map((item, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-3">
            <item.icon className="w-5 h-5 text-orbit-cyan shrink-0" />
            <p className="text-xs text-slate-400">{item.text}</p>
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 max-w-7xl mx-auto pb-28">
        <div className="text-center mb-14">
          <h2 className="section-title mb-3">An AI-powered academic workspace</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Not just another PDF chatbot — six connected tools that help with assignments, exams, and project
            work, all grounded in the material you upload.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 max-w-4xl mx-auto pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card relative overflow-hidden text-center px-8 py-14"
        >
          <div className="absolute inset-0 bg-orbit-radial" />
          <div className="relative z-10">
            <OrbitOrb size="w-14 h-14" />
            <h3 className="font-display font-bold text-2xl md:text-3xl text-white mt-6 mb-3">
              "Hello! I'm ORBIT, your academic knowledge companion."
            </h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Upload your study materials, and let's make learning easier — together.
            </p>
            <Link to="/signup" className="btn-primary text-base px-8 py-3 mx-auto w-fit">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-slate-500 border-t border-white/5">
        StudySphere AI · Intelligent Academic Knowledge Companion · Built with FastAPI, React & RAG
      </footer>
    </div>
  );
}
