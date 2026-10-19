import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import scrape, { parseProductHtml } from '../../api/scrape.js';
import updatePrices from '../../api/update-prices.js';
import { fetchPublicHtml, isPublicAddress, validateProductUrl } from '../src/lib/safeHtml.js';
import { setStorageUser, readUserData, writeUserData } from '../../src/lib/user-storage.js';

function response() {
  const result = { code: 200, body: undefined as unknown };
  const res = {
    setHeader() {}, end() { return res; },
    status(code: number) { result.code = code; return res; },
    json(body: unknown) { result.body = body; return res; },
  };
  return { result, res: res as unknown as VercelResponse };
}

describe('Regresiones del scraper público', () => {
  it('conserva pesos cuando el precio viene con decimales', () => {
    const product = parseProductHtml('<title>Audífonos WH-1000 &amp; estuche</title><meta content="24990.00" property="product:price:amount"><meta property="og:image" content="/foto.jpg">', 'https://tienda.cl/p/1');
    assert.equal(product.price, '24990');
    assert.equal(product.name, 'Audífonos WH-1000 & estuche');
    assert.equal(product.image, 'https://tienda.cl/foto.jpg');
  });
  it('lee productos dentro de arreglos y grafos JSON-LD', () => {
    const product = parseProductHtml('<script type="application/ld+json">[{"@graph":[{"offers":[{"price":"29990.00"}]}]}]</script>', 'https://tienda.cl');
    assert.equal(product.price, '29990');
  });
  it('rechaza protocolos, credenciales y puertos ajenos a páginas web', () => {
    for (const url of ['file:///etc/passwd', 'ftp://tienda.cl', 'http://user:pass@tienda.cl', 'http://tienda.cl:3001']) assert.throws(() => validateProductUrl(url));
  });
  it('bloquea direcciones locales, privadas, IPv4 mapeado y túneles IPv6', () => {
    for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '172.16.0.1', '192.168.1.1', '100.64.0.1', '::1', '::ffff:127.0.0.1', 'fe80::1', 'fc00::1', '2002:7f00:1::', '2001:0000:1::']) assert.equal(isPublicAddress(address), false, address);
    assert.equal(isPublicAddress('8.8.8.8'), true);
    assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
  });
  it('rechaza destinos privados antes de abrir la conexión', async () => {
    await assert.rejects(fetchPublicHtml('http://127.0.0.1'), /Destino no permitido/);
  });
  it('rechaza métodos y parámetros múltiples', async () => {
    for (const [method, url, code] of [['POST', 'https://tienda.cl', 405], ['GET', ['a', 'b'], 400]] as const) {
      const { res, result } = response();
      await scrape({ method, query: { url } } as unknown as VercelRequest, res);
      assert.equal(result.code, code);
    }
  });
});

describe('Autorización del actualizador', () => {
  it('no acepta el encabezado de cron como autenticación', async () => {
    const oldSecret = process.env.CRON_SECRET;
    try {
      for (const secret of ['', 'secreto-de-prueba']) {
        process.env.CRON_SECRET = secret;
        const { res, result } = response();
        await updatePrices({ method: 'GET', headers: { 'x-vercel-cron': '1' } } as unknown as VercelRequest, res);
        assert.equal(result.code, 401);
      }
    } finally {
      if (oldSecret === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = oldSecret;
    }
  });
});

describe('Separación de cuentas', () => {
  it('mantiene datos distintos por cuenta y no lee claves antiguas compartidas', () => {
    const values = new Map<string, string>([['xmas_children', '["dato antiguo"]']]);
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    } });
    try {
      setStorageUser('cuenta-a'); writeUserData('xmas_children', ['niño A']);
      setStorageUser('cuenta-b'); assert.deepEqual(readUserData('xmas_children', []), []);
      writeUserData('xmas_children', ['niño B']);
      setStorageUser('cuenta-a'); assert.deepEqual(readUserData('xmas_children', []), ['niño A']);
      setStorageUser(''); assert.throws(() => writeUserData('xmas_children', []));
    } finally {
      setStorageUser('');
      if (original) Object.defineProperty(globalThis, 'localStorage', original);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });
});
