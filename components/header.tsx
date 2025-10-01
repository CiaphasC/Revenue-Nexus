"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import type { LightMode } from "@/lib/types"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLightSettings } from "@/hooks/use-light-settings"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  Lightbulb,
  Sparkles,
  Zap,
  Sun,
  Power,
  Home,
  LayoutDashboard,
  Users,
  Calendar,
  FlaskConical,
  PanelsTopLeft,
} from "lucide-react"

const NAV_ITEMS: Array<{
  href: string
  label: string
}> = [
  { href: "/", label: "Inicio" },
  { href: "/dashboard", label: "Panel" },
  { href: "/workspace", label: "Workspace" },
  { href: "/crm", label: "CRM" },
  { href: "/calendario", label: "Calendario" },
  { href: "/lab", label: "Laboratorio" },
]

const LIGHT_MODE_OPTIONS: Array<{
  value: LightMode
  label: string
  icon: LucideIcon
  description: string
  gradient: string
  iconColor: string
  glowColor: string
}> = [
  {
    value: "spotlight",
    label: "Spotlight",
    icon: Zap,
    description: "Focused beam effect",
    gradient: "from-yellow-500/20 to-orange-500/20",
    iconColor: "text-yellow-500",
    glowColor: "shadow-yellow-500/50",
  },
  {
    value: "aurora",
    label: "Aurora",
    icon: Sparkles,
    description: "Flowing waves of light",
    gradient: "from-cyan-500/20 to-purple-500/20",
    iconColor: "text-cyan-400",
    glowColor: "shadow-cyan-500/50",
  },
  {
    value: "high-glow",
    label: "High Glow",
    icon: Sun,
    description: "Intense radiance",
    gradient: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-500",
    glowColor: "shadow-pink-500/50",
  },
  {
    value: "off",
    label: "Off",
    icon: Power,
    description: "No light effects",
    gradient: "from-gray-500/20 to-gray-600/20",
    iconColor: "text-gray-400",
    glowColor: "shadow-gray-500/50",
  },
]

const NAV_ICON: Record<string, LucideIcon> = {
  "/": Home,
  "/dashboard": LayoutDashboard,
  "/workspace": PanelsTopLeft,
  "/crm": Users,
  "/calendario": Calendar,
  "/lab": FlaskConical,
}

const NAV_GRADIENT: Record<string, { gradient: string; iconColor: string; glow: string }> = {
  "/": {
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
    glow: "shadow-blue-500/50",
  },
  "/dashboard": {
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500",
    glow: "shadow-purple-500/50",
  },
  "/workspace": {
    gradient: "from-cyan-500/20 to-indigo-500/20",
    iconColor: "text-cyan-500",
    glow: "shadow-cyan-500/50",
  },
  "/crm": {
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500",
    glow: "shadow-green-500/50",
  },
  "/calendario": {
    gradient: "from-orange-500/20 to-amber-500/20",
    iconColor: "text-orange-500",
    glow: "shadow-orange-500/50",
  },
  "/lab": {
    gradient: "from-rose-500/20 to-red-500/20",
    iconColor: "text-rose-500",
    glow: "shadow-rose-500/50",
  },
}

type IdleCapableWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
    cancelIdleCallback?: (handle: number) => void
  }

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { settings, setMode } = useLightSettings()
  const [isOpen, setIsOpen] = useState(false)
  const [isLightMenuOpen, setIsLightMenuOpen] = useState(false)

  const prefetchedRoutes = useRef(new Set<string>([pathname]))
  const handlePrefetch = useCallback(
    (href: string) => {
      if (href === pathname || prefetchedRoutes.current.has(href)) {
        return
      }
      prefetchedRoutes.current.add(href)
      try {
        router.prefetch(href)
      } catch {
        // no-op
      }
    },
    [pathname, router],
  )

  const currentMode =
    LIGHT_MODE_OPTIONS.find((mode) => mode.value === settings.mode) ?? LIGHT_MODE_OPTIONS[LIGHT_MODE_OPTIONS.length - 1]

  useEffect(() => {
    if (typeof window === "undefined") return

    const remaining = NAV_ITEMS.map((item) => item.href).filter((href) => href !== pathname)
    let idleId: number | null = null
    let timeoutId: number | null = null
    let cancelled = false
    const idleWindow = window as IdleCapableWindow

    const schedule = () => {
      if (cancelled || remaining.length === 0) {
        return
      }

      const run = () => {
        if (cancelled) return
        const href = remaining.shift()
        if (href) {
          handlePrefetch(href)
        }
        schedule()
      }

      if (typeof idleWindow.requestIdleCallback === "function") {
        idleId = idleWindow.requestIdleCallback(() => {
          run()
        }, { timeout: 1500 })
      } else {
        timeoutId = window.setTimeout(run, 200)
      }
    }

    schedule()

    return () => {
      cancelled = true
      if (idleId !== null && typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(idleId)
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [handlePrefetch, pathname])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 transition-transform duration-300 hover:scale-105">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-all duration-300 hover:rotate-12">
              <span className="font-serif text-lg font-bold text-primary-foreground">L</span>
            </div>
            <span className="font-serif text-xl font-semibold">Revenue Nexus</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onPointerEnter={() => handlePrefetch(item.href)}
                  onFocus={() => handlePrefetch(item.href)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-secondary text-secondary-foreground shadow-inner"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setIsLightMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2 backdrop-blur-sm transition-all duration-300 hover:border-chart-1/50 hover:bg-background/80 hover:shadow-lg hover:shadow-chart-1/20"
            >
              <Lightbulb className="size-4 text-muted-foreground transition-transform duration-300 hover:rotate-12" />
              <span className="text-sm font-medium">{currentMode.label}</span>
              <svg
                className={cn(
                  "size-4 text-muted-foreground transition-transform duration-300",
                  isLightMenuOpen && "rotate-180",
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isLightMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLightMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-72 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="rounded-xl border border-border/50 bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
                    <div className="mb-2 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Light Effects</p>
                    </div>
                    <div className="space-y-1">
                      {LIGHT_MODE_OPTIONS.map((mode) => {
                        const Icon = mode.icon
                        const isActive = settings.mode === mode.value
                        return (
                          <button
                            key={mode.value}
                            type="button"
                            onClick={() => {
                              setMode(mode.value)
                              setIsLightMenuOpen(false)
                            }}
                            className={cn(
                              "group nav-tile w-full p-3 text-left",
                              isActive
                                ? `bg-gradient-to-r ${mode.gradient} shadow-lg ${mode.glowColor}`
                                : "hover:bg-accent/50",
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "nav-tile__icon size-10",
                                  isActive
                                    ? cn("nav-tile__glow", mode.glowColor)
                                    : "bg-accent/50 group-hover:scale-110",
                                )}
                              >
                                <Icon className={cn("size-5", isActive ? mode.iconColor : "text-muted-foreground")} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="nav-tile__label">{mode.label}</p>
                                  {isActive && (
                                    <div className="nav-tile__indicator motion-safe:animate-pulse" />
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">{mode.description}</p>
                              </div>
                            </div>
                            {isActive && (
                              <div className="shimmer-overlay motion-reduce:opacity-0" aria-hidden />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="transition-all duration-200 hover:scale-110">
                <Menu className="size-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] transition-all duration-300 sm:w-[320px]">
              <nav className="mt-8 flex flex-col gap-4">
                <div className="mb-2">
                  <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navegación</p>
                </div>
                <div className="space-y-2">
                  {NAV_ITEMS.map((item) => {
                    const Icon = NAV_ICON[item.href]
                    const palette = NAV_GRADIENT[item.href]
                    const isActive = pathname === item.href

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        onPointerEnter={() => handlePrefetch(item.href)}
                        onFocus={() => handlePrefetch(item.href)}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "group nav-tile p-3 text-left",
                          isActive
                            ? `bg-gradient-to-r ${palette.gradient} shadow-lg ${palette.glow}`
                            : "hover:bg-accent/50",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "nav-tile__icon size-10",
                              isActive
                                ? cn("nav-tile__glow", palette.glow)
                                : "bg-accent/50 group-hover:scale-110",
                            )}
                          >
                            {Icon && (
                              <Icon className={cn("size-5", isActive ? palette.iconColor : "text-muted-foreground")} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="nav-tile__label">{item.label}</p>
                          </div>
                          {isActive && (
                            <div className="nav-tile__indicator motion-safe:animate-pulse" />
                          )}
                        </div>
                        {isActive && (
                          <div className="shimmer-overlay motion-reduce:opacity-0" aria-hidden />
                        )}
                      </Link>
                    )
                  })}
                </div>

                <div className="mt-6 space-y-2 border-t border-border/50 pt-6">
                  <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Light Effects
                  </p>
                  {LIGHT_MODE_OPTIONS.map((mode) => {
                    const Icon = mode.icon
                    const isActive = settings.mode === mode.value
                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => {
                          setMode(mode.value)
                          setIsOpen(false)
                        }}
                        className={cn(
                          "group nav-tile w-full p-3 text-left",
                          isActive
                            ? `bg-gradient-to-r ${mode.gradient} shadow-lg ${mode.glowColor}`
                            : "hover:bg-accent/50",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "nav-tile__icon size-9",
                              isActive
                                ? cn("nav-tile__glow", mode.glowColor)
                                : "bg-accent/50 group-hover:scale-110",
                            )}
                          >
                            <Icon className={cn("size-4", isActive ? mode.iconColor : "text-muted-foreground")} />
                          </div>
                          <div className="flex-1">
                            <p className="nav-tile__label">{mode.label}</p>
                            <p className="text-xs text-muted-foreground">{mode.description}</p>
                          </div>
                          {isActive && (
                            <div className="nav-tile__indicator motion-safe:animate-pulse" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
