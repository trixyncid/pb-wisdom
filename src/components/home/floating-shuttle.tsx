"use client";

import { motion } from "motion/react";

export function FloatingShuttle() {
  return (
    <motion.img
      src="/brand/shuttle-3d.png"
      alt=""
      className="pointer-events-none absolute -right-2 top-3 z-0 h-16 w-16 opacity-80"
      animate={{ y: [0, -12, 0], rotate: [0, 8, -4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
