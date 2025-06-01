"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import type React from "react"

interface AnimatedButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  type?: "button" | "submit" | "reset"
}

export function AnimatedButton({
  children,
  className = "",
  onClick,
  disabled = false,
  variant = "default",
  size = "default",
  type = "button",
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        className={`transition-all duration-200 ${className}`}
        onClick={onClick}
        disabled={disabled}
        variant={variant}
        size={size}
        type={type}
      >
        {children}
      </Button>
    </motion.div>
  )
}
