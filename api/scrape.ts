import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    clearTimeout(timer);

    if (!response.ok) {
      return res.status(502).json({ error: `HTTP ${response.status}` });
    }

    const html = await response.text();

    const getMeta = (attr: string, val: string): string => {
      const re1 = new RegExp(`<meta[^>]+${attr}=["']${val}["'][^>]+content=["']([^"']+)["']`, 'i');
      const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${val}["']`, 'i');
      return (html.match(re1) ?? html.match(re2))?.[1] ?? '';
    };

    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? '';

    const name = (
      getMeta('property', 'og:title') ||
      getMeta('name', 'twitter:title') ||
      titleTag
    ).replace(/\s*[-|].*$/, '').trim().slice(0, 150);

    const image =
      getMeta('property', 'og:image') ||
      getMeta('property', 'og:image:url') ||
      getMeta('name', 'twitter:image') || '';

    let price =
      getMeta('property', 'product:price:amount') ||
      getMeta('property', 'og:price:amount') || '';

    if (!price) {
      const ldMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
      for (const script of ldMatches) {
        if (price) break;
        try {
          const content = script.replace(/<\/?script[^>]*>/gi, '');
          const d = JSON.parse(content) as Record<string, unknown>;
          const offers = d.offers as Record<string, unknown> | Array<Record<string, unknown>> | null;
          if (offers && !Array.isArray(offers) && offers.price) {
            price = String(offers.price);
          } else if (Array.isArray(offers) && offers[0]?.price) {
            price = String(offers[0].price);
          }
        } catch { /* skip invalid JSON-LD */ }
      }
    }

    const priceClean = price.replace(/[^0-9]/g, '');
    const domain = parsedUrl.hostname.replace(/^www\./, '');

    return res.json({ name, image, price: priceClean, domain });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
