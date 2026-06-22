/**
 * scraperRipley.ts
 *
 * Ripley.cl usa la plataforma VTEX, que expone una API pública de catálogo.
 * La API de VTEX incluye precio normal (ListPrice) y precio de venta (Price),
 * cantidad disponible y categoría del árbol de navegación.
 *
 * Endpoint VTEX:
 *   GET /api/catalog_system/pub/products/search?fq=skuId:{sku}&sc=1
 *
 * Extrae:
 *  - Nombre, precio de venta, precio de lista (anterior), % descuento
 *  - Imagen, categoría, disponibilidad, descripción corta
 */

import axios from 'axios';
import { extractProductId } from '../storeDetector.js';
import { makeEnhanced, trimDescription, type EnhancedProduct } from './types.js';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const api = axios.create({
  timeout: 12_000,
  headers: {
    'User-Agent': BROWSER_UA,
    Accept: 'application/json',
    'Accept-Language': 'es-CL,es;q=0.9',
  },
});

const RIPLEY_DOMAIN = 'www.ripley.cl';

// ─── TIPOS VTEX ───────────────────────────────────────────────────────────────

interface VtexOffer {
  Price?: number;
  ListPrice?: number;
  AvailableQuantity?: number;
  IsAvailable?: boolean;
}
interface VtexSeller {
  commertialOffer?: VtexOffer;
}
interface VtexImage {
  imageUrl?: string;
  imageText?: string;
}
interface VtexItem {
  sellers?: VtexSeller[];
  images?: VtexImage[];
  name?: string;
}
interface VtexProduct {
  productName?: string;
  productTitle?: string;
  description?: string;
  categories?: string[];           // e.g. ["/Electro/Televisores/"]
  categoryTree?: Array<{ name: string }>;
  items?: VtexItem[];
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

export async function scraperRipley(url: string): Promise<EnhancedProduct> {
  const sku = extractProductId(url, 'ripley');
  if (!sku) throw new Error('No se pudo extraer el SKU de Ripley desde: ' + url);

  const apiUrl =
    `https://${RIPLEY_DOMAIN}/api/catalog_system/pub/products/search?fq=skuId:${sku}&sc=1`;

  const { data } = await api.get<VtexProduct[]>(apiUrl, {
    headers: { Referer: `https://${RIPLEY_DOMAIN}/` },
  });

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Ripley no devolvió resultados para este SKU: ' + sku);
  }

  const product = data[0];
  const title = String(product.productName ?? product.productTitle ?? '').trim();
  if (!title) throw new Error('Ripley no devolvió nombre de producto');

  // Precio: de la oferta del primer seller del primer item
  const item   = product.items?.[0];
  const offer  = item?.sellers?.[0]?.commertialOffer;

  // Price = precio de venta; ListPrice = precio de lista (anterior/normal)
  const price: number | null        = offer?.Price        ? Math.round(offer.Price)        : null;
  const previousPrice: number | null = offer?.ListPrice   ? Math.round(offer.ListPrice)    : null;

  // Solo consideramos previousPrice si es mayor al precio actual
  const realPreviousPrice = previousPrice && price && previousPrice > price ? previousPrice : null;

  // Imagen
  const images  = item?.images ?? [];
  const imageUrl = images[0]?.imageUrl ?? null;

  // Disponibilidad
  const qty = offer?.AvailableQuantity ?? 0;
  const availability: EnhancedProduct['availability'] =
    offer?.IsAvailable === true || qty > 0 ? 'in_stock'
    : offer?.IsAvailable === false || qty === 0 ? 'out_of_stock'
    : 'unknown';

  // Categoría: VTEX devuelve un array de paths como ["/Electro/Televisores/"]
  // Tomamos la última parte del path más específico
  let category: string | null = null;
  const cats = product.categories ?? [];
  if (cats.length > 0) {
    // El path más largo es el más específico
    const deepest = cats.sort((a, b) => b.length - a.length)[0];
    const parts = deepest.split('/').filter(Boolean);
    category = parts[parts.length - 1] ?? null;
  }

  // Descripción corta
  const shortDescription = trimDescription(product.description);

  return makeEnhanced({
    title,
    price,
    previousPrice: realPreviousPrice,
    currency: 'CLP',
    imageUrl,
    sourceUrl: url,
    store: 'ripley',
    category,
    availability,
    shortDescription,
  });
}
