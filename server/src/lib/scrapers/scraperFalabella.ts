/**
 * scraperFalabella.ts
 *
 * Extrae datos de Falabella.com.cl usando su API interna.
 * La misma API la usan Sodimac, Easy y Tottus (grupo Falabella).
 *
 * Extrae:
 *  - Nombre, precio internet, precio normal (anterior), % descuento
 *  - Imagen, categoría, disponibilidad, descripción corta
 */

import axios from 'axios';
import { extractProductId } from '../storeDetector.js';
import { parsePrice } from '../priceParser.js';
import { deepFind } from '../productExtractor.js';
import { makeEnhanced, trimDescription, type EnhancedProduct } from './types.js';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const api = axios.create({
  timeout: 10_000,
  headers: {
    'User-Agent': BROWSER_UA,
    Accept: 'application/json, */*',
    'Accept-Language': 'es-CL,es;q=0.9',
  },
});

// ─── TIPOS INTERNOS ───────────────────────────────────────────────────────────

interface PriceEntry {
  type: string;
  price: string | number;
}
interface SkuData {
  prices?: PriceEntry[];
  images?: Array<Record<string, string>>;
  available?: boolean;
  stockQuantity?: number;
}
interface FalabellaProduct {
  displayName?: string;
  name?: string;
  skus?: SkuData[];
  medias?: Array<Record<string, string>>;
  // Campos que a veces aparecen según el endpoint
  categoryName?: string;
  category?: { name?: string } | string;
  available?: boolean;
  shortDescription?: string;
  description?: string;
}

// ─── EXTRACTOR INTERNO ────────────────────────────────────────────────────────

function extractFromProduct(
  product: FalabellaProduct,
  url: string,
  id: string,
): EnhancedProduct {
  const title = String(product.displayName ?? product.name ?? '').trim();
  const skus = product.skus ?? [];
  const prices = skus[0]?.prices ?? [];

  // Precio internet = precio de oferta online
  const internetEntry = prices.find(p => p.type === 'internetPrice')
                     ?? prices.find(p => p.type === 'offerPrice');
  // Precio normal = precio sin descuento (tachado)
  const normalEntry   = prices.find(p => p.type === 'normalPrice')
                     ?? prices.find(p => p.type === 'listPrice');

  const price         = parsePrice(String(internetEntry?.price ?? normalEntry?.price ?? ''));
  const previousPrice = normalEntry && internetEntry
    ? parsePrice(String(normalEntry.price))
    : null;

  // Imagen: priorizar xxlarge, luego xlarge, luego CDN de respaldo
  const skuImgs   = (skus[0]?.images ?? []).flatMap(i => [i['xxlarge'], i['xlarge'], i['large'], i['url']]);
  const mediaImgs = (product.medias ?? []).map(m => m['xxlarge'] ?? m['url']);
  const cdnImg    = `https://falabella.scene7.com/is/image/Falabella/${id}/?$producto575x575$`;
  const imageUrl  = [...skuImgs, ...mediaImgs].find(u => u && u.startsWith('http')) ?? cdnImg;

  // Categoría
  const category =
    typeof product.category === 'string' ? product.category
    : (product.category as { name?: string } | undefined)?.name
    ?? product.categoryName
    ?? null;

  // Disponibilidad
  const sku0 = skus[0];
  const availability: EnhancedProduct['availability'] =
    sku0?.available === true  ? 'in_stock'
    : sku0?.available === false || (sku0?.stockQuantity ?? 1) === 0 ? 'out_of_stock'
    : product.available === true  ? 'in_stock'
    : product.available === false ? 'out_of_stock'
    : 'unknown';

  // Descripción corta
  const shortDescription = trimDescription(product.shortDescription ?? product.description);

  return makeEnhanced({
    title,
    price,
    previousPrice,
    currency: 'CLP',
    imageUrl,
    sourceUrl: url,
    store: 'falabella',
    category,
    availability,
    shortDescription,
  });
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

export async function scraperFalabella(url: string): Promise<EnhancedProduct> {
  const id = extractProductId(url, 'falabella');
  if (!id) throw new Error('No se pudo extraer el ID del producto de Falabella desde: ' + url);

  // Falabella tiene dos posibles endpoints — intentamos ambos
  const endpoints = [
    `https://www.falabella.com.cl/falabella-cl/api/page/products/${id}`,
    `https://www.falabella.com.cl/falabella-cl/api/page/product-detail/${id}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint, {
        headers: {
          Referer: 'https://www.falabella.com.cl/',
          Origin:  'https://www.falabella.com.cl',
        },
      });

      // Navegar la estructura anidada del JSON
      const product: FalabellaProduct | null =
        data?.data?.product
        ?? data?.product
        ?? deepFind<FalabellaProduct>(data, ['displayName', 'skus'])
        ?? deepFind<FalabellaProduct>(data, ['displayName', 'prices']);

      if (product) {
        const title = String(product.displayName ?? product.name ?? '').trim();
        if (title.length > 2) {
          return extractFromProduct(product, url, id);
        }
      }
    } catch {
      // Probamos el siguiente endpoint
    }
  }

  throw new Error(
    'Falabella bloqueó la solicitud o el producto no existe. ' +
    'Verifica que el enlace apunte a un producto específico.'
  );
}
