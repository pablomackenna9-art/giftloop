import type { Request, Response } from 'express';
import { extractProductFromUrl } from '../lib/productExtractor.js';

const TIMEOUT_MS = 45_000; // 45 s max per extraction request

/**
 * GET /api/extract-product?url=<encoded-url>
 *
 * Returns:
 *   200 { ok: true,  data: ProductResult }
 *   400 { ok: false, error: string }          – bad input
 *   422 { ok: false, error: string }          – product not found
 *   500 { ok: false, error: string }          – unexpected error
 */
export async function extractProductHandler(req: Request, res: Response): Promise<void> {
  const rawUrl = String(req.query['url'] ?? '').trim();

  if (!rawUrl) {
    res.status(400).json({ ok: false, error: 'Falta el parámetro url' });
    return;
  }

  // Race extraction against a hard timeout so the request never hangs forever
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Tiempo de espera agotado. La tienda tarda demasiado en responder.')), TIMEOUT_MS)
  );

  try {
    const data = await Promise.race([extractProductFromUrl(rawUrl), timeout]);
    res.json({ ok: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado';

    // Distinguish user errors from server errors
    const isUserError =
      message.includes('URL') ||
      message.includes('no encontró') ||
      message.includes('404') ||
      message.includes('inválid') ||
      message.includes('Tiempo');

    res.status(isUserError ? 422 : 500).json({ ok: false, error: message });
  }
}
