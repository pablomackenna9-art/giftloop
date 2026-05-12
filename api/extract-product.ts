import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const rawUrl = String(req.query['url'] ?? '').trim();
  if (!rawUrl) {
    res.status(400).json({ ok: false, error: 'Falta el parámetro url' });
    return;
  }

  // Import and call extractProductFromUrl
  // Set PUPPETEER_SKIP=true env before importing to skip Puppeteer
  process.env['PUPPETEER_SKIP'] = 'true';
  const { extractProductFromUrl } = await import('../server/src/lib/productExtractor.js');

  try {
    const data = await extractProductFromUrl(rawUrl);
    res.status(200).json({ ok: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    const isUserError = message.includes('URL') || message.includes('no encontró') || message.includes('404') || message.includes('inválid');
    res.status(isUserError ? 422 : 500).json({ ok: false, error: message });
  }
}
