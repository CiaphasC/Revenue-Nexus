"use client"

import { useLightSettings } from "@/hooks/use-light-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Zap, Lightbulb, RotateCcw } from "lucide-react"
import type { LightMode, LightSettings } from "@/lib/types"

const PRESETS = [
  {
    name: "Foco sutil",
    mode: "spotlight" as LightMode,
    intensity: 0.5,
    radius: 250,
    blur: 40,
    blendMode: "screen" as const,
    icon: Lightbulb,
  },
  {
    name: "Sueños de aurora",
    mode: "aurora" as LightMode,
    intensity: 0.7,
    radius: 350,
    blur: 60,
    blendMode: "screen" as const,
    icon: Sparkles,
  },
  {
    name: "Alta intensidad",
    mode: "spotlight" as LightMode,
    intensity: 1,
    radius: 400,
    blur: 30,
    blendMode: "overlay" as const,
    icon: Zap,
  },
]

export default function MotionLabPage() {
  const { settings, updateSettings, setMode } = useLightSettings()

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    updateSettings({
      mode: preset.mode,
      intensity: preset.intensity,
      radius: preset.radius,
      blur: preset.blur,
      blendMode: preset.blendMode,
    })
  }

  const resetToDefaults = () => {
    updateSettings({
      mode: "spotlight",
      intensity: 0.7,
      radius: 300,
      blur: 40,
      blendMode: "screen",
      trail: false,
    })
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <header className="mb-10 space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-chart-3">Laboratorio interactivo</p>
        <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">Laboratorio de movimiento</h1>
        <p className="max-w-2xl text-muted-foreground">
          Ajusta los efectos de luz del cursor en tiempo real y valida cómo se sienten las animaciones antes de llevarlas
          a producción.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-labelledby="preview-heading" className="order-2 lg:order-1">
          <Card className="relative min-h-[580px] border-border/40 bg-card/60">
            <CardHeader>
              <CardTitle id="preview-heading" className="font-serif text-2xl text-foreground">
                Vista previa en vivo
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Mueve tu cursor sobre la interfaz para experimentar el efecto actual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border border-border/40 bg-background/60 p-8 text-center">
                <h2 className="mb-2 font-serif text-xl font-semibold text-foreground">Demo interactiva</h2>
                <p className="text-sm text-muted-foreground">
                  Los modos seleccionados se aplican en toda la aplicación. Si necesitas una visualización específica,
                  ajusta los parámetros en el panel lateral.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-xl border border-chart-1/30 bg-chart-1/10 p-6">
                  <Sparkles className="mb-2 size-7 text-chart-1" aria-hidden />
                  <h3 className="font-semibold text-foreground">Modo actual</h3>
                  <p className="text-sm text-muted-foreground capitalize">{settings.mode}</p>
                </article>

                <article className="rounded-xl border border-chart-2/30 bg-chart-2/10 p-6">
                  <Zap className="mb-2 size-7 text-chart-2" aria-hidden />
                  <h3 className="font-semibold text-foreground">Intensidad</h3>
                  <p className="text-sm text-muted-foreground">{Math.round(settings.intensity * 100)}%</p>
                </article>

                <article className="rounded-xl border border-chart-3/30 bg-chart-3/10 p-6">
                  <svg className="mb-2 size-7 text-chart-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  <h3 className="font-semibold text-foreground">Radio</h3>
                  <p className="text-sm text-muted-foreground">{settings.radius}px</p>
                </article>

                <article className="rounded-xl border border-chart-4/30 bg-chart-4/10 p-6">
                  <Lightbulb className="mb-2 size-7 text-chart-4" aria-hidden />
                  <h3 className="font-semibold text-foreground">Desenfoque</h3>
                  <p className="text-sm text-muted-foreground">{settings.blur}px</p>
                </article>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside aria-label="Panel de configuración" className="order-1 space-y-6 lg:order-2">
          <Card className="border-border/40 bg-card/60">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Presets</CardTitle>
              <CardDescription className="text-muted-foreground">Guarda tiempo con configuraciones curadas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => applyPreset(preset)}
                >
                  <preset.icon className="size-4" aria-hidden />
                  {preset.name}
                </Button>
              ))}
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={resetToDefaults}>
                <RotateCcw className="size-4" aria-hidden />
                Restablecer valores
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/60">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Controles</CardTitle>
              <CardDescription className="text-muted-foreground">Ajusta la intensidad del efecto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Modo de luz</Label>
                <Select value={settings.mode} onValueChange={(value) => setMode(value as LightMode)}>
                  <SelectTrigger aria-label="Modo de luz">
                    <SelectValue placeholder="Seleccionar modo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Apagado</SelectItem>
                    <SelectItem value="spotlight">Foco</SelectItem>
                    <SelectItem value="aurora">Aurora</SelectItem>
                    <SelectItem value="high-glow">
                      <div className="flex items-center gap-2">
                        Brillo alto
                        <Badge variant="secondary" className="text-xs uppercase">WebGL</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="intensity-slider">Intensidad</Label>
                  <span className="text-sm text-muted-foreground">{Math.round(settings.intensity * 100)}%</span>
                </div>
                <Slider
                  id="intensity-slider"
                  value={[settings.intensity * 100]}
                  onValueChange={([value]) => updateSettings({ intensity: value / 100 })}
                  min={0}
                  max={100}
                  step={5}
                  disabled={settings.mode === "off"}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="radius-slider">Radio</Label>
                  <span className="text-sm text-muted-foreground">{settings.radius}px</span>
                </div>
                <Slider
                  id="radius-slider"
                  value={[settings.radius]}
                  onValueChange={([value]) => updateSettings({ radius: value })}
                  min={100}
                  max={600}
                  step={10}
                  disabled={settings.mode === "off"}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="blur-slider">Desenfoque</Label>
                  <span className="text-sm text-muted-foreground">{settings.blur}px</span>
                </div>
                <Slider
                  id="blur-slider"
                  value={[settings.blur]}
                  onValueChange={([value]) => updateSettings({ blur: value })}
                  min={0}
                  max={100}
                  step={5}
                  disabled={settings.mode === "off"}
                />
              </div>

              <div className="space-y-2">
                <Label>Modo de mezcla</Label>
                <Select
                  value={settings.blendMode}
                  onValueChange={(value) => updateSettings({ blendMode: value as LightSettings["blendMode"] })}
                  disabled={settings.mode === "off"}
                >
                  <SelectTrigger aria-label="Modo de mezcla">
                    <SelectValue placeholder="Seleccionar modo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="screen">Pantalla</SelectItem>
                    <SelectItem value="overlay">Superposición</SelectItem>
                    <SelectItem value="soft-light">Luz suave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/60">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Nota de rendimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Los efectos funcionan sobre hardware acelerado con requestAnimationFrame y respetan las preferencias de
                movimiento reducido del sistema operativo. El modo Brillo alto necesita soporte WebGL.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}


