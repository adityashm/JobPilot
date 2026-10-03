"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";

interface SmoothCursorProps {
  cursorSize?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  hideSystemCursor?: boolean;
  enableClickEffect?: boolean;
  enableHoverEffect?: boolean;
}

export function SmoothCursor({
  cursorSize = 34,
  stiffness = 450,
  damping = 40,
  mass = 0.8,
  hideSystemCursor = true,
  enableClickEffect = true,
  enableHoverEffect = true,
}: SmoothCursorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);

  // Position springs
  const cursorX = useSpring(-100, { stiffness, damping, mass });
  const cursorY = useSpring(-100, { stiffness, damping, mass });

  // Rotation & Scale springs
  const rotation = useSpring(0, { stiffness: 320, damping: 50 });
  const scale = useSpring(1, { stiffness: 500, damping: 30 });

  const lastMousePos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastUpdateTime = useRef(Date.now());
  const previousAngle = useRef(0);
  const accumulatedRotation = useRef(0);
  const rafId = useRef<number | null>(null);
  const isMouseDown = useRef(false);

  // 1. Mobile & Touch Screen Detection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkDeviceConstraints = () => {
      const isMobileWidth = window.innerWidth < 768;
      const isTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

      if (isMobileWidth || isTouch) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    checkDeviceConstraints();
    window.addEventListener("resize", checkDeviceConstraints);
    return () => window.removeEventListener("resize", checkDeviceConstraints);
  }, []);

  // 2. Cursor Movement, Velocity Rotation, & Click Handling
  useEffect(() => {
    if (typeof window === "undefined" || !isVisible) {
      document.body.style.cursor = "auto";
      return;
    }

    const updateVelocity = (currentPos: { x: number; y: number }) => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateTime.current;
      if (deltaTime > 0) {
        velocity.current = {
          x: (currentPos.x - lastMousePos.current.x) / deltaTime,
          y: (currentPos.y - lastMousePos.current.y) / deltaTime,
        };
      }
      lastUpdateTime.current = currentTime;
      lastMousePos.current = currentPos;
    };

    const smoothMouseMove = (e: MouseEvent) => {
      const currentPos = { x: e.clientX, y: e.clientY };
      updateVelocity(currentPos);

      const speed = Math.sqrt(
        Math.pow(velocity.current.x, 2) + Math.pow(velocity.current.y, 2)
      );

      cursorX.set(currentPos.x);
      cursorY.set(currentPos.y);

      // Rotate dynamically in movement direction when moving with moderate speed
      if (speed > 0.15) {
        const currentAngle =
          Math.atan2(velocity.current.y, velocity.current.x) * (180 / Math.PI) + 90;
        let angleDiff = currentAngle - previousAngle.current;

        // Normalize angle diff to prevent 360 wrap flickers
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;

        accumulatedRotation.current += angleDiff;
        rotation.set(accumulatedRotation.current);
        previousAngle.current = currentAngle;

        // Minor movement velocity squish
        if (!isMouseDown.current && !isHoveringInteractive) {
          scale.set(0.96);
          setTimeout(() => {
            if (!isMouseDown.current && !isHoveringInteractive) {
              scale.set(1);
            }
          }, 120);
        }
      }

      // Check if hovering over clickable element
      if (enableHoverEffect) {
        const target = e.target as HTMLElement | null;
        if (target) {
          const isInteractive = Boolean(
            target.closest(
              "button, a, input, select, textarea, [role='button'], [data-clickable='true'], .cursor-pointer"
            )
          );
          setIsHoveringInteractive(isInteractive);
          if (isInteractive && !isMouseDown.current) {
            scale.set(1.22);
          } else if (!isInteractive && !isMouseDown.current) {
            scale.set(1);
          }
        }
      }
    };

    const throttledMouseMove = (e: MouseEvent) => {
      if (rafId.current) return;
      rafId.current = requestAnimationFrame(() => {
        smoothMouseMove(e);
        rafId.current = null;
      });
    };

    const handleMouseDown = () => {
      isMouseDown.current = true;
      if (enableClickEffect) {
        scale.set(0.72);
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
      if (enableClickEffect) {
        scale.set(isHoveringInteractive ? 1.22 : 1);
      }
    };

    if (hideSystemCursor) {
      document.body.style.cursor = "none";
    }

    window.addEventListener("mousemove", throttledMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", throttledMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);
      document.body.style.cursor = "auto";
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [
    cursorX,
    cursorY,
    rotation,
    scale,
    hideSystemCursor,
    isVisible,
    enableClickEffect,
    enableHoverEffect,
    isHoveringInteractive,
  ]);

  if (!isVisible) return null;

  return (
    <>
      {hideSystemCursor && (
        <style jsx global>{`
          *,
          *::before,
          *::after {
            cursor: none !important;
          }
        `}</style>
      )}

      {/* Main Smooth Spring Motion Cursor */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          x: cursorX,
          y: cursorY,
          rotate: rotation,
          scale: scale,
          zIndex: 9999999,
          pointerEvents: "none",
          willChange: "transform",
          width: cursorSize,
          height: cursorSize,
          marginLeft: -cursorSize / 2,
          marginTop: -cursorSize / 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Subtle accent glow halo when hovering interactive elements */}
        {isHoveringInteractive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.4 }}
            className="absolute inset-0 rounded-full bg-indigo-500/25 blur-md pointer-events-none"
          />
        )}

        {/* Precision Framer Vector Arrow with Drop Shadow and Violet Tint */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 50 54"
          fill="none"
          className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)]"
        >
          <g filter="url(#jobpilot_cursor_filter)">
            {/* Core Fill (Bright Crisp White) */}
            <path
              d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"
              fill={isHoveringInteractive ? "#818cf8" : "#ffffff"}
              className="transition-colors duration-150"
            />
            {/* Precision Stroke Border */}
            <path
              d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
          </g>
          <defs>
            <filter
              id="jobpilot_cursor_filter"
              x="0.6"
              y="0.9"
              width="49"
              height="52.5"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>
        </svg>
      </motion.div>
    </>
  );
}

export default SmoothCursor;
