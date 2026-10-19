# GiftLoop — Instrucciones para el agente

**Responde siempre en español chileno.** No uses inglés en ninguna respuesta.

## Contexto del proyecto
GiftLoop es una app social de listas de deseos y regalos grupales, construida con:
- React 18 + TypeScript + Vite + Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Vercel (deploy + serverless functions en `/api/`)

## Archivos clave
- `src/App.tsx` — navegación principal y estado global
- `src/screens/` — todas las pantallas
- `src/components/` — componentes y datos estáticos
- `api/scrape.ts` — función serverless de Vercel para scraping de productos
- `src/screens/xmas-data.ts` y `xmas-store-data.ts` — sección de Navidad

## Guía de revisión
Cuando revises código, evalúa:
1. Bugs potenciales y correctness
2. Gestión de estado (useState, localStorage, props)
3. UX y consistencia de navegación
4. Calidad del scraper serverless (CORS, headers, parsing)
5. TypeScript types y seguridad
