/**
 * scraperAmazon.ts
 *
 * ⚠️  IMPORTANTE — LEE ESTO ANTES DE USAR
 * ─────────────────────────────────────────
 * Amazon bloquea agresivamente el scraping HTML:
 *   - Devuelve CAPTCHA en vez de la página del producto
 *   - Cambia la estructura HTML frecuentemente
 *   - Ban de IP si haces muchas solicitudes
 *
 * LA SOLUCIÓN OFICIAL ES LA PRODUCT ADVERTISING API (PA API):
 *   https://webservices.amazon.com/paapi5/documentation/
 *
 * Requisitos para PA API:
 *   1. Tener cuenta de Amazon Associates (programa de afiliados)
 *   2. Generar credenciales: ACCESS_KEY + SECRET_KEY + PARTNER_TAG
 *   3. Pegar en .env del servidor:
 *      AMAZON_ACCESS_KEY=tu_clave
 *      AMAZON_SECRET_KEY=tu_secreto
 *      AMAZON_PARTNER_TAG=giftloop-cl-20
 *
 * VENTAJAS de PA API:
 *   - Datos oficiales y estructurados (precio, imagen, descripción, categoría)
 *   - Precio real sin bloqueadores
 *   - Genera comisión cuando alguien compra desde GiftLoop 💰
 *   - Se actualiza sola cada hora
 *
 * Por ahora este scraper intenta HTML como fallback, pero fallará frecuentemente.
 * Cuando tengas las credenciales de PA API, reemplaza la función `tryPaApi()`
 * con la llamada real.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../priceParser.js';
import { makeEnhanced, trimDescription, type EnhancedProduct } from './types.js';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const http = axios.create({
  timeout: 15_000,
  headers: {
    'User-Agent': BROWSER_UA,
    Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Language': 'es-419,es;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
  },
  maxRedirects: 5,
  decompress: true,
});

// ─── EXTRAE EL ASIN (ID DE AMAZON) ───────────────────────────────────────────

function extractAsin(url: string): string | null {
  return (
    url.match(/\/dp\/([A-Z0-9]{10})/i)?.[1] ??
    url.match(/\/gp\/product\/([A-Z0-9]{10})/i)?.[1] ??
    url.match(/[?&]asin=([A-Z0-9]{10})/i)?.[1] ??
    null
  );
}

// ─── PLACEHOLDER PARA PA API (IMPLEMENTAR CUANDO TENGAS CREDENCIALES) ────────

async function tryPaApi(_asin: string): Promise<EnhancedProduct | null> {
  const accessKey = process.env['AMAZON_ACCESS_KEY'];
  const secretKey = process.env['AMAZON_SECRET_KEY'];
  const partnerTag = process.env['AMAZON_PARTNER_TAG'];

  if (!accessKey || !secretKey || !partnerTag) {
    // Credenciales no configuradas aún
    return null;
  }

  // TODO: Implementar llamada a PA API con firma AWS Signature v4
  // Librería sugerida: paapi5-nodejs (npm install paapi5-nodejs)
  // Documentación: https://webservices.amazon.com/paapi5/documentation/
  console.log('[Amazon] PA API configurada pero no implementada aún. ASIN:', _asin);
  return null;
}

// ─── FALLBACK: SCRAPING HTML (FUNCIONA POCO, SOLO EN DEV) ────────────────────

async function tryHtmlScrape(url: string): Promise<EnhancedProduct | null> {
  try {
    const res = await http.get(url, {
      headers: { Referer: 'https://www.amazon.com/' },
    });

    // Si Amazon devuelve CAPTCHA, la página contiene este texto
    if (
      String(res.data).includes('Robot Check') ||
      String(res.data).includes('captcha') ||
      String(res.data).includes('api-services-support@amazon.com')
    ) {
      console.warn('[Amazon] CAPTCHA detectado — scraping bloqueado');
      return null;
    }

    const $ = cheerio.load(res.data as string);

    // Título
    const title = $('#productTitle').text().trim()
               || $('[data-feature-name="title"] h1').text().trim()
               || '';
    if (!title || title.length < 3) return null;

    // Precio actual
    const priceWhole = $('.a-price .a-price-whole').first().text().replace(/\D/g, '');
    const price      = parsePrice(priceWhole);

    // Precio anterior (tachado)
    const prevRaw = $('.a-text-price .a-offscreen').first().text().trim()
                 || $('[data-a-strike="true"]').first().text().trim();
    const previousPrice = parsePrice(prevRaw);

    // Imagen
    const imgData  = $('#imgTagWrapperId img, #landingImage').first().attr('data-old-hires')
                  ?? $('#imgTagWrapperId img, #landingImage').first().attr('src');
    const imageUrl = imgData ?? null;

    // Categoría (breadcrumb)
    const breadcrumbs = $('#wayfinding-breadcrumbs_feature_div li a').toArray();
    const category    = $(breadcrumbs[breadcrumbs.length - 1]).text().trim() || null;

    // Disponibilidad
    const availText = $('#availability span').first().text().toLowerCase().trim();
    const availability: EnhancedProduct['availability'] =
      availText.includes('en stock') || availText.includes('in stock') ? 'in_stock'
      : availText.includes('no disponible') || availText.includes('out of stock') ? 'out_of_stock'
      : 'unknown';

    // Descripción corta (feature bullets)
    const bullets = $('#feature-bullets li span:not(.aok-hidden)')
      .toArray()
      .map(el => $(el).text().trim())
      .filter(t => t.length > 5)
      .slice(0, 2)
      .join(' • ');
    const shortDescription = trimDescription(bullets || null);

    return makeEnhanced({
      title,
      price,
      previousPrice: previousPrice && price && previousPrice > price ? previousPrice : null,
      currency: 'CLP',
      imageUrl,
      sourceUrl: url,
      store: 'unknown',   // Amazon no está en StoreId, se envía como unknown por ahora
      category,
      availability,
      shortDescription,
    });
  } catch {
    return null;
  }
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

export async function scraperAmazon(url: string): Promise<EnhancedProduct> {
  const asin = extractAsin(url);

  if (!asin) {
    throw new Error(
      'No se pudo extraer el ASIN del producto de Amazon. ' +
      'El enlace debe contener /dp/XXXXXXXXXX en la URL.'
    );
  }

  // 1. Intentar PA API (requiere credenciales en .env)
  const paResult = await tryPaApi(asin);
  if (paResult) return paResult;

  // 2. Fallback HTML (funciona poco — Amazon bloquea)
  const htmlResult = await tryHtmlScrape(url);
  if (htmlResult) return htmlResult;

  throw new Error(
    'Amazon bloqueó la extracción del producto. ' +
    'Para obtener datos de Amazon de forma confiable, ' +
    'necesitas configurar la Product Advertising API (PA API). ' +
    'Consulta los comentarios en server/src/lib/scrapers/scraperAmazon.ts para instrucciones.'
  );
}
