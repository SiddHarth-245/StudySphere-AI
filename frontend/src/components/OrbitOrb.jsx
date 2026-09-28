import React from "react";
import { motion } from "framer-motion";

/**
 * OrbitOrb - the signature animated AI avatar used across StudySphere AI.
 * size: tailwind width/height classes, e.g. "w-16 h-16"
 */
export default function OrbitOrb({ size = "w-16 h-16", pulsing = true, speaking = false }) {
  return (
    <div className={`relative ${size} shrink-0`}>
      <motion.div
        className="absolute inset-0 rounded-full bg-orbit-gradient blur-md"
        animate={pulsing ? { opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-[3px] rounded-full bg-space-900 border border-white/10 flex items-center justify-center overflow-hidden"
      >
        <motion.div
          className="absolute w-[140%] h-[140%] bg-orbit-gradient opacity-70"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ borderRadius: "40%" }}
        />
        <motion.div
          className="relative w-[55%] h-[55%] rounded-full bg-space-950/80 backdrop-blur-sm flex items-center justify-center"
          animate={speaking ? { scale: [1, 1.15, 0.95, 1] } : { scale: [1, 1.05, 1] }}
          transition={{ duration: speaking ? 0.6 : 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-[40%] h-[40%] rounded-full bg-white shadow-[0_0_12px_3px_rgba(255,255,255,0.7)]" />
        </motion.div>
      </motion.div>
    </div>
  );
}
