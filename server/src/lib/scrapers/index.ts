/**
 * scrapers/index.ts
 *
 * Punto de entrada del sistema de scrapers modular.
 * Detecta la tienda de la URL y llama al scraper correcto.
 *
 * Uso:
 *   import { extractProductEnhanced } from './scrapers/index.js';
 *   const product = await extractProductEnhanced('https://www.falabella.com.cl/...');
 */

import { detectStore } from '../storeDetector.js';
import type { EnhancedProduct } from './types.js';

// ─── IMPORTAR SCRAPERS POR TIENDA ─────────────────────────────────────────────
import { scraperMercadoLibre } from './scraperMercadoLibre.js';
import { scraperFalabella }    from './scraperFalabella.js';
import { scraperParis }        from './scraperParis.js';
import { scraperRipley }       from './scraperRipley.js';
import { scraperAmazon }       from './scraperAmazon.js';

// ─── PARA AGREGAR UNA TIENDA NUEVA: ──────────────────────────────────────────
// 1. Crea server/src/lib/scrapers/scraperNuevaTienda.ts
// 2. Agrégala al import de arriba
// 3. Agrégala al mapa SCRAPER_MAP abajo

type ScraperFn = (url: string) => Promise<EnhancedProduct>;

const SCRAPER_MAP: Partial<Record<string, ScraperFn>> = {
  mercadolibre: scraperMercadoLibre,
  falabella:    scraperFalabella,
  paris:        scraperParis,
  ripley:       scraperRipley,
  // Amazon: se llama directamente al detectar dominio amazon.com
};

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Extrae datos enriquecidos de un producto (precio anterior, descuento,
 * categoría, disponibilidad, descripción) usando el scraper específico
 * de cada tienda.
 *
 * A diferencia de extractProductFromUrl(), este sistema es modular:
 * cada tienda tiene su propio archivo independiente.
 */
export async function extractProductEnhanced(url: string): Promise<EnhancedProduct> {
  if (!url?.trim()) throw new Error('URL vacía');
  const fullUrl = url.startsWith('http') ? url : 'https://' + url;
  try { new URL(fullUrl); } catch { throw new Error('URL inválida'); }

  const store = detectStore(fullUrl);

  // Detectar Amazon por dominio (no está en StoreId todavía)
  if (/amazon\.(com|com\.ar|com\.br|es|co\.uk)/i.test(fullUrl)) {
    return scraperAmazon(fullUrl);
  }

  const scraperFn = SCRAPER_MAP[store];

  if (!scraperFn) {
    throw new Error(
      `La tienda "${store}" aún no tiene un scraper mejorado. ` +
      `Por ahora puedes usar el endpoint /api/extract-product para obtener ` +
      `los datos básicos (nombre, precio, imagen).`
    );
  }

  return scraperFn(fullUrl);
}

// Reexportar tipos para que el resto del código los pueda usar
export type { EnhancedProduct } from './types.js';
