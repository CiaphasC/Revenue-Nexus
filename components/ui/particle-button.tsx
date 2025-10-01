"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

interface ParticleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "default" | "outline"
  href?: string
}

export const ParticleButton = React.forwardRef<HTMLButtonElement, ParticleButtonProps>(
  (
    {
      children,
      className,
      variant = "default",
      href,
      onClick,
      disabled,
      ...props
    },
    ref,
  ) => {
    const router = useRouter()
    const prefersReducedMotion = useReducedMotion()
    const showParticles = !prefersReducedMotion
    const [particles, setParticles] = React.useState<Array<{ id: number; x: number; y: number }>>([])
    const timeoutsRef = React.useRef<number[]>([])

    React.useEffect(() => {
      return () => {
        timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
        timeoutsRef.current = []
      }
    }, [])

    React.useEffect(() => {
      if (!showParticles) {
        setParticles([])
        timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
        timeoutsRef.current = []
      }
    }, [showParticles])

    React.useEffect(() => {
      if (!href) {
        return
      }
      try {
        router.prefetch(href)
      } catch {
        // Ignored: route may already be in the cache
      }
    }, [href, router])

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        onClick?.(event)
        return
      }

      if (showParticles) {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        const newParticles = Array.from({ length: 12 }, (_, index) => ({
          id: Date.now() + index,
          x,
          y,
        }))

        setParticles((previous) => [...previous, ...newParticles])

        const timeoutId = window.setTimeout(() => {
          setParticles((previous) =>
            previous.filter((particle) => !newParticles.some((candidate) => candidate.id === particle.id)),
          )
          timeoutsRef.current = timeoutsRef.current.filter((storedId) => storedId !== timeoutId)
        }, 1000)

        timeoutsRef.current.push(timeoutId)
      }

      onClick?.(event)

      if (!event.defaultPrevented && href) {
        event.preventDefault()
        router.push(href)
      }
    }

    return (
      <button
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-xl px-8 py-4 text-base font-semibold transition-all duration-300",
          variant === "default" &&
            "bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
          variant === "outline" &&
            "border-2 border-primary bg-transparent text-primary hover:bg-primary/10 hover:scale-105 active:scale-95",
          disabled && "cursor-not-allowed opacity-50 hover:scale-100",
          className,
        )}
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        <div
          className={cn(
            "shimmer-overlay -translate-x-full transition-opacity duration-300 motion-reduce:opacity-0",
            showParticles ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />

        {showParticles &&
          particles.map((particle, index) => (
            <div
              key={particle.id}
              className="pointer-events-none absolute size-2 animate-particle rounded-full bg-white"
              style={{
                left: particle.x,
                top: particle.y,
                animationDelay: `${index * 20}ms`,
                transform: `rotate(${index * 30}deg)`,
              }}
            />
          ))}

        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    )
  },
)

ParticleButton.displayName = "ParticleButton"
