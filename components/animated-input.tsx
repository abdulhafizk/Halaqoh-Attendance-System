"use client"

import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import type React from "react"

interface AnimatedInputProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  className?: string
  disabled?: boolean
}

export function AnimatedInput({
  placeholder,
  value,
  onChange,
  type = "text",
  className = "",
  disabled = false,
}: AnimatedInputProps) {
  return (
    <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        type={type}
        className={`transition-all duration-200 focus:shadow-lg ${className}`}
        disabled={disabled}
      />
    </motion.div>
  )
}
