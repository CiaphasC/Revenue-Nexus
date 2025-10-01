"use client"

export function HeroAurora() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Aurora blob 1 */}
      <div
        className="absolute left-1/4 top-1/4 size-[600px] animate-aurora-1 rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.70 0.19 240), transparent 70%)",
        }}
      />

      {/* Aurora blob 2 */}
      <div
        className="absolute right-1/4 top-1/3 size-[500px] animate-aurora-2 rounded-full opacity-25 blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.65 0.18 280), transparent 70%)",
        }}
      />

      {/* Aurora blob 3 */}
      <div
        className="absolute bottom-1/4 left-1/3 size-[550px] animate-aurora-3 rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.68 0.16 200), transparent 70%)",
        }}
      />
    </div>
  )
}
