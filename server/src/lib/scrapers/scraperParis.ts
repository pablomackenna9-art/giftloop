/**
 * scraperParis.ts
 *
 * Paris.cl pertenece al grupo Cencosud y usa una API similar a la de Falabella.
 * Estructura de precios idéntica: internetPrice / normalPrice en array de prices.
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
interface ParisProduct {
  displayName?: string;
  name?: string;
  skus?: SkuData[];
  medias?: Array<Record<string, string>>;
  categoryName?: string;
  category?: { name?: string } | string;
  available?: boolean;
  shortDescription?: string;
  description?: string;
}

export async function scraperParis(url: string): Promise<EnhancedProduct> {
  const id = extractProductId(url, 'paris');
  if (!id) throw new Error('No se pudo extraer el ID del producto de Paris desde: ' + url);

  const endpoints = [
    `https://www.paris.cl/paris-cl/api/page/products/${id}`,
    `https://www.paris.cl/paris-cl/api/page/product-detail/${id}`,
    `https://api.paris.cl/v1/products/${id}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint, {
        headers: {
          Referer: 'https://www.paris.cl/',
          Origin:  'https://www.paris.cl',
        },
      });

      const product: ParisProduct | null =
        data?.data?.product
        ?? data?.product
        ?? deepFind<ParisProduct>(data, ['displayName', 'skus'])
        ?? deepFind<ParisProduct>(data, ['displayName', 'prices']);

      if (!product) continue;

      const title = String(product.displayName ?? product.name ?? '').trim();
      if (title.length < 3) continue;

      const skus   = product.skus ?? [];
      const prices = skus[0]?.prices ?? [];

      const internetEntry = prices.find(p => p.type === 'internetPrice')
                         ?? prices.find(p => p.type === 'offerPrice');
      const normalEntry   = prices.find(p => p.type === 'normalPrice')
                         ?? prices.find(p => p.type === 'listPrice');

      const price         = parsePrice(String(internetEntry?.price ?? normalEntry?.price ?? ''));
      const previousPrice = normalEntry && internetEntry
        ? parsePrice(String(normalEntry.price))
        : null;

      const skuImgs   = (skus[0]?.images ?? []).flatMap(i => [i['xxlarge'], i['xlarge'], i['large'], i['url']]);
      const mediaImgs = (product.medias ?? []).map(m => m['xxlarge'] ?? m['url']);
      const imageUrl  = [...skuImgs, ...mediaImgs].find(u => u && u.startsWith('http')) ?? null;

      const category =
        typeof product.category === 'string' ? product.category
        : (product.category as { name?: string } | undefined)?.name
        ?? product.categoryName
        ?? null;

      const sku0 = skus[0];
      const availability: EnhancedProduct['availability'] =
        sku0?.available === true  ? 'in_stock'
        : sku0?.available === false ? 'out_of_stock'
        : (sku0?.stockQuantity ?? 1) === 0 ? 'out_of_stock'
        : 'unknown';

      const shortDescription = trimDescription(product.shortDescription ?? product.description);

      return makeEnhanced({
        title,
        price,
        previousPrice,
        currency: 'CLP',
        imageUrl,
        sourceUrl: url,
        store: 'paris',
        category,
        availability,
        shortDescription,
      });

    } catch {
      // Probar siguiente endpoint
    }
  }

  throw new Error(
    'No se pudo obtener información de Paris para este producto. ' +
    'Verifica que el enlace apunte a un producto específico.'
  );
}
