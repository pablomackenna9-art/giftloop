/**
 * extract-product-enhanced.ts
 *
 * GET /api/extract-product-enhanced?url=<url-del-producto>
 *
 * Igual que /api/extract-product pero usando los scrapers modulares.
 * Devuelve campos adicionales:
 *   - previousPrice  (precio anterior / tachado)
 *   - discount       (% de descuento)
 *   - category       (categoría del producto)
 *   - availability   ('in_stock' | 'out_of_stock' | 'unknown')
 *   - shortDescription
 *   - scrapedAt      (timestamp de cuándo se extrajo)
 *
 * Tiendas soportadas: MercadoLibre, Falabella, Paris, Ripley
 * Tiendas no soportadas aún: devolverá error 422 con mensaje claro.
 */

import type { Request, Response } from 'express';
import { extractProductEnhanced } from '../lib/scrapers/index.js';

const TIMEOUT_MS = 45_000;

export async function extractProductEnhancedHandler(req: Request, res: Response): Promise<void> {
  const rawUrl = String(req.query['url'] ?? '').trim();

  if (!rawUrl) {
    res.status(400).json({ ok: false, error: 'Falta el parámetro url' });
    return;
  }

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error('Tiempo de espera agotado. La tienda tarda demasiado en responder.')),
      TIMEOUT_MS,
    )
  );

  try {
    const data = await Promise.race([extractProductEnhanced(rawUrl), timeout]);
    res.json({ ok: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    const isUserError =
      message.includes('URL') ||
      message.includes('no encontró') ||
      message.includes('404') ||
      message.includes('inválid') ||
      message.includes('Tiempo') ||
      message.includes('scraper mejorado') ||
      message.includes('ASIN');
    res.status(isUserError ? 422 : 500).json({ ok: false, error: message });
  }
}
