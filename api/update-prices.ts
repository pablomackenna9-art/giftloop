/**
 * api/update-prices.ts
 *
 * Endpoint de Vercel que se llama automáticamente por el cron configurado en vercel.json.
 * Actualiza precios de productos guardados en Supabase que tengan más de 24h sin revisar.
 *
 * SETUP:
 * 1. En vercel.json (en la raíz del proyecto), agrega:
 *    {
 *      "crons": [{ "path": "/api/update-prices", "schedule": "0 8 * * *" }]
 *    }
 *    (esto ejecuta el endpoint todos los días a las 08:00 UTC)
 *
 * 2. Agrega en Vercel → Settings → Environment Variables:
 *    SUPABASE_URL=https://xxxx.supabase.co
 *    SUPABASE_SERVICE_KEY=eyJ...  (service_role key)
 *    CRON_SECRET=tu-clave-secreta-aqui   (para proteger el endpoint)
 *
 * 3. El endpoint valida el header Authorization: Bearer {CRON_SECRET}
 *    Vercel lo agrega automáticamente en producción.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo aceptar GET
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  // Verificar que la llamada viene de Vercel Cron (o de un admin con la clave)
  const cronSecret  = process.env['CRON_SECRET'] ?? '';
  const authHeader  = String(req.headers['authorization'] ?? '');
  const isVercelCron = req.headers['x-vercel-cron'] === '1';

  if (!isVercelCron && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  try {
    process.env['PUPPETEER_SKIP'] = 'true';
    const { updateStaleProducts } = await import('../server/src/lib/scrapers/priceUpdater.js');
    const result = await updateStaleProducts(24);
    res.status(200).json({ ok: true, ...result, ts: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    res.status(500).json({ ok: false, error: message });
  }
}
