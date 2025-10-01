import type { LucideProps } from "lucide-react"

import { cn } from "@/lib/utils"

export function SolIcon({ className, ...props }: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      focusable="false"
      aria-hidden="true"
      className={cn("fill-none", className)}
      {...props}
    >
      <path
        d="M15.5 5.5c0-1.657-1.567-3-3.5-3s-3.5 1.343-3.5 3 1.567 3 3.5 3h1c1.933 0 3.5 1.343 3.5 3s-1.567 3-3.5 3h-2c-1.933 0-3.5 1.343-3.5 3s1.567 3 3.5 3 3.5-1.343 3.5-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="8.5" y1="2.5" x2="8.5" y2="21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="17.5" y1="2.5" x2="6.5" y2="21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
