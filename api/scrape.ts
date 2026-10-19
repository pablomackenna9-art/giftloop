import type { VercelRequest, VercelResponse } from '@vercel/node';
import { load } from 'cheerio';
import { fetchPublicHtml, validateProductUrl } from '../server/src/lib/safeHtml.js';
import { parsePrice } from '../server/src/lib/priceParser.js';

export function parseProductHtml(html: string, sourceUrl: string) {
  const $ = load(html);
  const meta = (key: string) => $(`meta[property="${key}"], meta[name="${key}"]`).first().attr('content')?.trim() ?? '';
  const name = (meta('og:title') || meta('twitter:title') || $('title').text()).trim().slice(0, 150);
  const rawImage = meta('og:image') || meta('og:image:url') || meta('twitter:image');
  let image = '';
  try { const resolved = new URL(rawImage, sourceUrl); if (rawImage && ['https:', 'http:'].includes(resolved.protocol)) image = resolved.href; } catch { /* Sin imagen válida. */ }
  let price = parsePrice(meta('product:price:amount') || meta('og:price:amount'));
  const visit = (value: unknown): void => {
    if (price !== null || !value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const node = value as Record<string, unknown>;
    const offers = node.offers;
    if (offers) for (const offer of Array.isArray(offers) ? offers : [offers]) {
      if (offer && typeof offer === 'object') {
        price = parsePrice((offer as Record<string, unknown>).price as string | number | undefined);
        if (price !== null) break;
      }
    }
    if (node['@graph']) visit(node['@graph']);
  };
  $('script[type="application/ld+json"]').each((_i, element) => {
    try { visit(JSON.parse($(element).text())); } catch { /* JSON-LD inválido. */ }
  });
  return { name, image, price: price === null ? '' : String(price), domain: new URL(sourceUrl).hostname.replace(/^www\./, '') };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  const raw = req.query.url;
  if (typeof raw !== 'string' || !raw.trim()) return res.status(400).json({ error: 'Falta la URL' });
  try { validateProductUrl(raw); } catch { return res.status(400).json({ error: 'URL no permitida' }); }
  try {
    const { html, url } = await fetchPublicHtml(raw);
    return res.json(parseProductHtml(html, url));
  } catch {
    return res.status(502).json({ error: 'No pudimos leer esa tienda. Ingresa los datos manualmente.' });
  }
}
