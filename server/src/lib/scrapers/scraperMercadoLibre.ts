/**
 * scraperMercadoLibre.ts
 *
 * Usa la API pública de MercadoLibre (sin autenticación).
 * Documentación: https://developers.mercadolibre.com/
 *
 * Extrae:
 *  - Nombre, precio actual, precio anterior, % descuento
 *  - Imagen, categoría, disponibilidad, descripción corta
 *
 * NO necesita Puppeteer ni scraping HTML — la API devuelve todo.
 */

import axios from 'axios';
import { extractProductId } from '../storeDetector.js';
import { makeEnhanced, trimDescription, type EnhancedProduct } from './types.js';

const api = axios.create({
  timeout: 10_000,
  headers: {
    'User-Agent': 'GiftLoop/1.0',
    Accept: 'application/json',
  },
});

// ─── TIPOS DE RESPUESTA DE LA API ────────────────────────────────────────────

interface MlItem {
  title?: string;
  name?: string;
  price?: number;
  original_price?: number | null;   // precio anterior si está en oferta
  currency_id?: string;
  pictures?: Array<{ url: string }>;
  available_quantity?: number;
  status?: string;                  // 'active' | 'paused' | 'closed'
  category_id?: string;
  subtitle?: string | null;
  attributes?: Array<{ id: string; value_name: string }>;
}

interface MlCategory {
  id: string;
  name: string;
}

// ─── FUNCIÓN PRINCIPAL ───────────────────────────────────────────────────────

export async function scraperMercadoLibre(url: string): Promise<EnhancedProduct> {
  const id = extractProductId(url, 'mercadolibre');
  if (!id) throw new Error('No se pudo extraer el ID del producto de MercadoLibre desde: ' + url);

  // Catálogo (/p/MLC…) vs. publicación directa (MLC…)
  const isCatalog = /\/p\/MLC/i.test(url);
  const endpoint = isCatalog
    ? `https://api.mercadolibre.com/products/${id}`
    : `https://api.mercadolibre.com/items/${id}`;

  const { data } = await api.get<MlItem>(endpoint);

  // ── Título ────────────────────────────────────────────────────────────────
  const title = String(data.name ?? data.title ?? '').trim();
  if (!title) throw new Error('MercadoLibre no devolvió nombre de producto');

  // ── Precios ───────────────────────────────────────────────────────────────
  const price: number | null = data.price != null ? Math.round(data.price) : null;
  const previousPrice: number | null =
    data.original_price != null && data.original_price > (price ?? 0)
      ? Math.round(data.original_price)
      : null;

  // ── Imagen ────────────────────────────────────────────────────────────────
  const rawImg = data.pictures?.[0]?.url ?? null;
  // Pide versión 600x600 en vez de la thumbnail por defecto
  const imageUrl = rawImg?.replace(/\d+x\d+/, '600x600') ?? rawImg;

  // ── Disponibilidad ────────────────────────────────────────────────────────
  const qty = data.available_quantity ?? 0;
  const status = data.status ?? '';
  const availability: EnhancedProduct['availability'] =
    status === 'active' && qty > 0 ? 'in_stock'
    : status === 'closed' || qty === 0 ? 'out_of_stock'
    : 'unknown';

  // ── Categoría (llamada extra a la API de categorías) ──────────────────────
  let category: string | null = null;
  if (data.category_id) {
    try {
      const { data: cat } = await api.get<MlCategory>(
        `https://api.mercadolibre.com/categories/${data.category_id}`
      );
      category = cat.name?.trim() || null;
    } catch {
      // No crítico — seguimos sin categoría
    }
  }

  // ── Descripción corta ─────────────────────────────────────────────────────
  // Primero buscamos en atributos, luego en subtitle
  const attrs = data.attributes ?? [];
  const descAttr = attrs.find(a =>
    ['SHORT_DESCRIPTION', 'DESCRIPTION', 'MAIN_FEATURE'].includes(a.id)
  );
  const rawDesc = descAttr?.value_name ?? data.subtitle ?? null;
  const shortDescription = trimDescription(rawDesc);

  return makeEnhanced({
    title,
    price,
    previousPrice,
    currency:         data.currency_id ?? 'CLP',
    imageUrl,
    sourceUrl:        url,
    store:            'mercadolibre',
    category,
    availability,
    shortDescription,
  });
}
