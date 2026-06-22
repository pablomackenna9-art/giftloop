/**
 * priceUpdater.ts
 *
 * Actualiza los precios de los productos guardados en Supabase
 * que no han sido revisados en las últimas N horas.
 *
 * CÓMO ACTIVARLO:
 *
 * Opción A — Vercel Cron (recomendado para producción):
 *   En vercel.json agrega:
 *   {
 *     "crons": [{ "path": "/api/update-prices", "schedule": "0 8 * * *" }]
 *   }
 *   Luego crea api/update-prices.ts (ver instrucciones abajo)
 *
 * Opción B — node-cron (recomendado para desarrollo local):
 *   npm install node-cron @types/node-cron
 *   Y en server/src/index.ts:
 *     import { startPriceCron } from './lib/scrapers/priceUpdater.js';
 *     startPriceCron();
 */

import { extractProductEnhanced } from './index.js';
import { getStaleProducts, saveScrapedProduct } from './saveProduct.js';

// ─── LÓGICA DE ACTUALIZACIÓN ─────────────────────────────────────────────────

/**
 * Actualiza los precios de todos los productos en BD que tengan
 * más de `staleHours` horas sin actualizar.
 *
 * Procesa en lotes para no saturar las APIs externas.
 */
export async function updateStaleProducts(staleHours = 24): Promise<{ updated: number; failed: number }> {
  const stale = await getStaleProducts(staleHours);
  console.log(`[priceUpdater] ${stale.length} productos para actualizar`);

  let updated = 0;
  let failed  = 0;

  for (const row of stale) {
    try {
      // Rescrapeamos el producto con el scraper modular
      const fresh = await extractProductEnhanced(row.source_url);
      const saved = await saveScrapedProduct(fresh);
      if (saved) {
        updated++;
        console.log(`  ✓ ${row.store} — ${fresh.title} → $${fresh.price}`);
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
      console.warn(`  ✗ ${row.source_url}: ${err instanceof Error ? err.message : 'Error'}`);
    }

    // Pausa entre requests para no sobrecargar las tiendas
    await new Promise(r => setTimeout(r, 1_500));
  }

  console.log(`[priceUpdater] Listo: ${updated} actualizados, ${failed} fallidos`);
  return { updated, failed };
}

// ─── OPCIÓN B: NODE-CRON ──────────────────────────────────────────────────────
// Descomenta esto si prefieres correr el cron dentro del servidor Express:

/*
import cron from 'node-cron';

export function startPriceCron() {
  // Ejecutar todos los días a las 08:00 hora Santiago
  cron.schedule('0 8 * * *', async () => {
    console.log('[priceUpdater] Iniciando actualización diaria de precios...');
    await updateStaleProducts(24);
  }, {
    timezone: 'America/Santiago',
  });
  console.log('[priceUpdater] Cron activado — actualización diaria a las 08:00');
}
*/
