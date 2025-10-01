"use client"

import type { ReactNode } from "react"

interface CustomScrollbarProps {
  children: ReactNode
  className?: string
}

export function CustomScrollbar({ children, className = "" }: CustomScrollbarProps) {
  return <div className={`custom-scrollbar ${className}`}>{children}</div>
}
