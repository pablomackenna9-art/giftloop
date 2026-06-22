/**
 * types.ts
 * Tipos compartidos para el sistema de scrapers modular de GiftLoop.
 * Extiende el ProductResult básico con: precio anterior, descuento,
 * categoría, disponibilidad y descripción corta.
 */

import type { StoreId } from '../storeDetector.js';

// ─── TIPO PRINCIPAL ──────────────────────────────────────────────────────────

export interface EnhancedProduct {
  /** Nombre del producto */
  title: string;

  /** Precio actual en centavos o CLP */
  price: number | null;

  /** Precio anterior (tachado) — null si no hay descuento */
  previousPrice: number | null;

  /** Porcentaje de descuento calculado (0-100) — null si no aplica */
  discount: number | null;

  /** Moneda (CLP, USD, etc.) */
  currency: string;

  /** URL de imagen principal */
  imageUrl: string | null;

  /** URL original del producto */
  sourceUrl: string;

  /** Identificador de la tienda */
  store: StoreId;

  /** Categoría del producto (puede ser null si la tienda no la expone) */
  category: string | null;

  /** Disponibilidad de stock */
  availability: 'in_stock' | 'out_of_stock' | 'unknown';

  /** Descripción corta — máx ~200 caracteres */
  shortDescription: string | null;

  /** Cuándo se extrajo este dato (ISO 8601) */
  scrapedAt: string;
}

// ─── INTERFAZ DE CADA SCRAPER ────────────────────────────────────────────────

export interface StoreScraper {
  /** ID de la tienda que maneja este scraper */
  storeId: StoreId;

  /** Devuelve true si este scraper puede manejar la URL dada */
  canHandle(url: string): boolean;

  /** Extrae los datos del producto desde la URL */
  scrape(url: string): Promise<EnhancedProduct>;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Calcula el porcentaje de descuento entre precio actual y precio anterior.
 * Retorna null si los precios son inválidos o no hay descuento real.
 */
export function calcDiscount(
  price: number | null,
  previousPrice: number | null,
): number | null {
  if (!price || !previousPrice || previousPrice <= price) return null;
  return Math.round((1 - price / previousPrice) * 100);
}

/**
 * Construye un EnhancedProduct con valores por defecto seguros.
 * Calcula el descuento automáticamente.
 */
export function makeEnhanced(
  fields: Partial<EnhancedProduct> & {
    title: string;
    sourceUrl: string;
    store: StoreId;
  },
): EnhancedProduct {
  const price = fields.price ?? null;
  const previousPrice = fields.previousPrice ?? null;

  return {
    title:            fields.title,
    price,
    previousPrice,
    discount:         calcDiscount(price, previousPrice),
    currency:         fields.currency ?? 'CLP',
    imageUrl:         fields.imageUrl ?? null,
    sourceUrl:        fields.sourceUrl,
    store:            fields.store,
    category:         fields.category ?? null,
    availability:     fields.availability ?? 'unknown',
    shortDescription: fields.shortDescription ?? null,
    scrapedAt:        new Date().toISOString(),
  };
}

/**
 * Recorta y limpia una descripción a máximo N caracteres.
 */
export function trimDescription(text: string | null | undefined, max = 200): string | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned.slice(0, max) : null;
}
