"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import type React from "react";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export function AnimatedCard({
  children,
  className = "",
  delay = 0,
  hover = true,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -5, scale: 1.02 } : {}}
      whileTap={hover ? { scale: 0.98 } : {}}
    >
      <Card className={`transition-all duration-300 ${className}`}>
        {children}
      </Card>
    </motion.div>
  );
}
