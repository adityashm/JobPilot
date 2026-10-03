"use client";

import React, { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

interface SpringCounterProps {
  value: number | string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  glowOnComplete?: boolean;
}

export function SpringCounter({
  value,
  duration = 1.2,
  prefix = "",
  suffix = "",
  className = "",
  glowOnComplete = true,
}: SpringCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  // Extract numeric part and trailing suffix if string (e.g. "95%" -> numeric: 95, extraSuffix: "%")
  const rawStr = String(value);
  const numericMatch = rawStr.match(/([0-9]+(?:\.[0-9]+)?)/);
  const targetNumber = numericMatch ? parseFloat(numericMatch[1]) : 0;
  const inferredSuffix = rawStr.replace(/^[0-9]+(?:\.[0-9]+)?/, "") || suffix;

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 70,
    damping: 18,
    mass: 0.6,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(targetNumber);
    }
  }, [isInView, targetNumber, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        const isDecimal = Number.isInteger(targetNumber) ? 0 : 1;
        const formatted = latest.toFixed(isDecimal);
        ref.current.textContent = `${prefix}${formatted}${inferredSuffix}`;
      }
    });
    return () => unsubscribe();
  }, [springValue, prefix, inferredSuffix, targetNumber]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4 }}
      className={`inline-block tabular-nums font-mono ${className} ${
        glowOnComplete ? "transition-all duration-500 drop-shadow-[0_0_12px_rgba(99,102,241,0.25)]" : ""
      }`}
    >
      {prefix}0{inferredSuffix}
    </motion.span>
  );
}

export default SpringCounter;
