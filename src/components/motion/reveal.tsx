"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import * as React from "react";


const EASE = [0.22, 1, 0.36, 1] as const;

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  as?: "div" | "section" | "li" | "span";
}

/**
 * Scroll-triggered reveal. Collapses to a plain fade when the visitor asked
 * for reduced motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  duration = 0.55,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </Component>
  );
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "section";
}) {
  const reduce = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      variants={reduce ? undefined : containerVariants}
      initial={reduce ? undefined : "hidden"}
      whileInView={reduce ? undefined : "visible"}
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      variants={reduce ? undefined : itemVariants}
      initial={reduce ? undefined : "hidden"}
      whileInView={reduce ? undefined : "visible"}
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </Component>
  );
}
