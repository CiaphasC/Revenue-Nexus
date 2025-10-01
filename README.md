# Revenue Nexus

Plataforma demo construida con Next.js 15 y React 19 que muestra un flujo CRM/Workspace de alto pulido visual, animaciones con efectos de luz y componentes responsivos listos para producción. Todo el contenido y la configuración están adaptados al español y a la moneda peruana (S/), convirtiéndolo en una vitrina ideal para presentar experiencias SaaS premium en mercados LATAM.

## ✨ Características principales

- **Experiencia CRM**: gestión de oportunidades con estados, probabilidad ponderada y creación optimista mediante acciones de servidor.
- **Workspace en vivo**: panel ejecutivo con KPIs, actividad reciente y resumen de pipeline sincronizado en tiempo real.
- **Efectos de luz y motion**: laboratorio interactivo para ajustar spotlight, auroras y parámetros de brillo con soporte `prefers-reduced-motion`.
- **UI consistente**: diseño tipográfico serif/sans, variantes de Tailwind v4, theming OKLCH y componentes reutilizables (`nav-tile`, `surface-glass`, `sol-icon`).
- **Moneda local**: todos los importes se renderizan con `Intl.NumberFormat` para PEN (`S/`), incluyendo datos de mock, actividades y tooltips.
- **Accesibilidad**: encabezados jerárquicos, roles ARIA en iconos personalizados, focus rings y soporte de teclado en toda la interfaz.

## 🧱 Stack y arquitectura

| Capa                         | Tecnología / herramienta |
|-----------------------------|---------------------------|
| Framework                   | Next.js 15 (App Router)   |
| UI y estilos                | Tailwind CSS 4, tokens OKLCH, `tailwind-merge` |
| Animaciones y efectos       | `requestAnimationFrame`, capas personalizadas (`aurora`, `spotlight`, `high-glow`) |
| Componentes base            | shadcn/ui adaptado y extendido |
| Tipografías                 | Geist Sans & Mono         |
| Estado / datos              | Acciones de servidor, `unstable_cache`, almacén en memoria (`workspace-store`) |
| Calidad                     | ESLint 9 (`eslint.config.mjs`), TypeScript estricto |

### Estructura relevante

```
app/
  ├─ dashboard/        # Panel ejecutivo y KPI cards
  ├─ workspace/        # Layout, acciones y slots CRM/Insights
  ├─ lab/              # Laboratorio de motion y presets de luz
components/
  ├─ ui/               # Botones, tarjetas, icono de moneda, charts
  ├─ workspace/        # Panel CRM, inspector de deals, pipeline
  └─ lights/           # Capas spotlight/aurora/high-glow
lib/
  ├─ utils/format.ts   # Formateadores de moneda y fechas PEN
  ├─ constants/        # Metadatos de actividad con `SolIcon`
  └─ server/           # Almacén en memoria y eventos workspace
```

## 🚀 Puesta en marcha

1. **Instalación**
   ```bash
   npm install
   ```
2. **Desarrollo local**
   ```bash
   npm run dev
   ```
   > El proyecto ya está configurado con `lang="es"` y metadatos SEO en español.
3. **Linting**
   ```bash
   npm run lint
   ```
   Usa la configuración flat de ESLint con `eslint-config-next` 15.
4. **Build de producción**
   ```bash
   npm run build
   ```
   Genera artefactos optimizados con la moneda S/ en toda la UI.

## 💱 Moneda & localización

- La utilidad `formatCurrency` (PEN) se reutiliza en CRM, dashboard, workspace y acciones de servidor.
- `SolIcon` reemplaza a los antiguos íconos con `$`, garantizando coherencia visual con el símbolo `S/`.
- Datos mock y eventos en vivo reflejan montos en soles con separadores locales (`es-PE`).

## 🧩 Componentes destacados

- **`<ParticleButton />`**: animaciones con detección de `prefers-reduced-motion` y partículas dinámicas.
- **`<HeroAurora />`**: blobs aurora reutilizables basados en clases utilitarias (`aurora-blob-*`).
- **`<Header />`**: navegación responsiva con tiles gradientes, prefetch progresivo y marca “Revenue Nexus”.
- **`SolIcon`**: icono SVG personalizado con trazo en S/ reutilizado en métricas y feeds.

## 🛠️ Flujo de desarrollo recomendado

- Ejecuta `npm run lint` antes de subir cambios.
- Para añadir nuevos importes, utiliza siempre `formatCurrency(value)`.
- Prefiere las clases utilitarias definidas en `app/globals.css` (`nav-tile`, `surface-glass`, `shimmer-overlay`) para mantener consistencia.
- Al extender datos mock, conserva el idioma español y la moneda S/ para respetar el contexto regional.

## 📄 Licencia

Este proyecto se distribuye como demo educativa. Puedes adaptarlo libremente para presentaciones, workshops o prototipos comerciales manteniendo el crédito a Revenue Nexus.

Disfruta construyendo experiencias SaaS premium en español ⚡
