"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import * as React from "react";

export interface CounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

/**
 * Counts up to a value the first time it scrolls into view.
 */
export function Counter({
  value,
  suffix = "",
  prefix = "",
  duration = 1.4,
  className,
}: CounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();

  React.useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;

    if (reduce) {
      node.textContent = `${prefix}${value}${suffix}`;
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = `${prefix}${Math.round(latest)}${suffix}`;
      },
    });

    return () => controls.stop();
  }, [inView, value, duration, prefix, suffix, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}
