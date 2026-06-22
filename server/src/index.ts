import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { extractProductHandler } from './api/extract-product.js';
import { extractProductEnhancedHandler } from './api/extract-product-enhanced.js';
import {
  instagramAuthHandler,
  instagramCallbackHandler,
  instagramStatusHandler,
} from './api/auth-instagram.js';

const PORT = Number(process.env['PORT'] ?? 3001);
const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────

/** Legacy compatibility: /scrape?url=... */
app.get('/scrape', extractProductHandler);

/** New clean route */
app.get('/api/extract-product', extractProductHandler);

/** Enhanced route — returns previousPrice, discount, category, availability, shortDescription */
app.get('/api/extract-product-enhanced', extractProductEnhancedHandler);

/** Instagram OAuth */
app.get('/auth/instagram/status',   instagramStatusHandler);
app.get('/auth/instagram',          instagramAuthHandler);
app.get('/auth/instagram/callback', instagramCallbackHandler);

/** Health check */
app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 GiftLoop scraper server  →  http://localhost:${PORT}`);
  console.log(`   /scrape?url=...                    (legacy)`);
  console.log(`   /api/extract-product?url=          (básico)`);
  console.log(`   /api/extract-product-enhanced?url= (con precio anterior, descuento, categoría)\n`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️  Port ${PORT} already in use — exiting (previous instance running).`);
    process.exit(0);
  }
  throw err;
});

// Graceful shutdown
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT',  () => { server.close(() => process.exit(0)); });
