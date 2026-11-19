"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import * as React from "react";

/**
 * A button that leans towards the cursor. Purely decorative — disabled when
 * the visitor prefers reduced motion.
 */
export function Magnetic({
  children,
  className,
  strength = 12,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      style={{ x: springX, y: springY }}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const offsetX = event.clientX - (bounds.left + bounds.width / 2);
        const offsetY = event.clientY - (bounds.top + bounds.height / 2);
        x.set((offsetX / bounds.width) * strength * 2);
        y.set((offsetY / bounds.height) * strength * 2);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
