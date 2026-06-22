/**
 * saveProduct.ts
 *
 * Guarda o actualiza un producto scrapeado en Supabase.
 * Maneja deduplicación y guarda historial de precios.
 *
 * Requiere en .env del servidor:
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY=eyJ...  (service_role key, NO la anon key)
 */

import type { EnhancedProduct } from './types.js';

// ─── CLIENTE SUPABASE (SERVER-SIDE) ──────────────────────────────────────────

let _client: import('@supabase/supabase-js').SupabaseClient | null = null;

async function getClient() {
  if (_client) return _client;

  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_KEY'];

  if (!url || !key) {
    console.warn('[saveProduct] SUPABASE_URL o SUPABASE_SERVICE_KEY no configurados — no se guardará en BD');
    return null;
  }

  const { createClient } = await import('@supabase/supabase-js');
  _client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return _client;
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Guarda el producto en Supabase.
 * Si ya existe un registro con el mismo source_url:
 *   - Actualiza precio, disponibilidad, etc.
 *   - Agrega el precio al historial (máx 90 entradas)
 * Si no existe, lo crea.
 *
 * Retorna true si se guardó, false si no había BD configurada.
 */
export async function saveScrapedProduct(product: EnhancedProduct): Promise<boolean> {
  const supabase = await getClient();
  if (!supabase) return false;

  try {
    // 1. Buscar si ya existe para preservar el historial de precios
    const { data: existing } = await supabase
      .from('scraped_products')
      .select('id, price_history')
      .eq('source_url', product.sourceUrl)
      .maybeSingle();

    // 2. Construir el nuevo historial agregando el precio actual
    const oldHistory: Array<{ price: number; date: string }> =
      (existing?.price_history as Array<{ price: number; date: string }>) ?? [];

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Evitar duplicar la misma fecha
    const newEntry = { price: product.price ?? 0, date: today };
    const filteredHistory = oldHistory.filter(e => e.date !== today);
    const priceHistory = [...filteredHistory, newEntry]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 90); // máx 90 días de historial

    // 3. Upsert (insertar o actualizar)
    const { error } = await supabase
      .from('scraped_products')
      .upsert(
        {
          source_url:        product.sourceUrl,
          store:             product.store,
          title:             product.title,
          price:             product.price,
          previous_price:    product.previousPrice,
          discount:          product.discount,
          currency:          product.currency,
          image_url:         product.imageUrl,
          category:          product.category,
          availability:      product.availability,
          short_description: product.shortDescription,
          scraped_at:        product.scrapedAt,
          price_history:     priceHistory,
        },
        { onConflict: 'source_url' },
      );

    if (error) {
      console.error('[saveProduct] Error al guardar:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[saveProduct] Excepción:', err);
    return false;
  }
}

/**
 * Obtiene una lista de productos cuyo precio no se ha actualizado
 * en las últimas `hours` horas. Útil para el cron de actualización.
 */
export async function getStaleProducts(hours = 24): Promise<Array<{ id: string; source_url: string; store: string }>> {
  const supabase = await getClient();
  if (!supabase) return [];

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('scraped_products')
    .select('id, source_url, store')
    .lt('updated_at', cutoff)
    .order('updated_at', { ascending: true })
    .limit(100); // actualiza hasta 100 a la vez

  if (error) {
    console.error('[saveProduct] Error buscando productos desactualizados:', error.message);
    return [];
  }

  return (data ?? []) as Array<{ id: string; source_url: string; store: string }>;
}
