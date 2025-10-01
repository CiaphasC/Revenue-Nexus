import { ArrowRight, Sparkles, Zap } from "lucide-react"
import { ParticleButton } from "@/components/ui/particle-button"
import { HeroAurora } from "@/components/hero-aurora"
import { Card } from "@/components/ui/card"

const FEATURE_CARDS = [
  {
    icon: Sparkles,
    title: "Efectos de luz del cursor",
    description:
      "Modos Foco, Aurora y Brillo Alto con aceleración WebGL para una retroalimentación visual impecable.",
  },
  {
    icon: Zap,
    title: "Acciones React 19",
    description:
      "Acciones del servidor, useOptimistic y revalidación segmentada para interfaces realmente instantáneas.",
  },
  {
    icon: undefined,
    title: "Rendimiento primero",
    description:
      "Animaciones basadas en requestAnimationFrame, soporte para prefers-reduced-motion y estrategias de caché inteligentes.",
  },
]

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <section aria-labelledby="hero-heading" className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-4">
        <HeroAurora />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-4 py-2 text-sm backdrop-blur-sm">
            <Sparkles className="size-4 text-chart-1" aria-hidden />
            <span className="text-muted-foreground">Impulsado por Next 15 y React 19</span>
          </div>

          <h1 id="hero-heading" className="mb-6 font-serif text-[clamp(2.75rem,7vw,5rem)] font-bold leading-tight tracking-tight text-balance">
            Interfaces premium con foco en la experiencia.
            <br />
            <span className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-transparent">
              Pulido de nivel motion desde el primer render.
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground text-balance sm:text-xl">
            Lumen Studio combina los patrones de arquitectura modernos de Next con un diseño cuidadoso para que tus
            productos luzcan profesionales, accesibles y fluidos desde cualquier dispositivo.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ParticleButton href="/dashboard" aria-label="Ir al panel de control">
              Explorar panel
              <ArrowRight className="size-5" aria-hidden />
            </ParticleButton>

            <ParticleButton variant="outline" href="/lab" aria-label="Abrir laboratorio de movimiento">
              <Zap className="size-5" aria-hidden />
              Laboratorio
            </ParticleButton>
          </div>
        </div>
      </section>

      <section aria-labelledby="feature-heading" className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <header className="mb-16 text-center">
            <h2 id="feature-heading" className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-bold">
              Sofisticación con propósito
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Cada módulo está maquetado con una jerarquía clara, contrastes suficientes y animaciones discretas que
              acompañan la narrativa sin distraer.
            </p>
          </header>

          <ul className="grid gap-6 md:grid-cols-3">
            {FEATURE_CARDS.map((feature) => (
              <li key={feature.title}>
                <Card className="h-full border-border/50 bg-card/60 p-8">
                  <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-accent/10 text-chart-1">
                    {feature.icon ? <feature.icon className="size-6" aria-hidden /> : (
                      <svg
                        className="size-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
