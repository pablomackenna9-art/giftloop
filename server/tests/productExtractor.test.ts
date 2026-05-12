/**
 * Unit tests for server/src/lib/productExtractor.ts
 *
 * These tests use mocked HTML / JSON (no real HTTP calls).
 * Run with:  npx tsx --test server/tests/productExtractor.test.ts
 *
 * Node 18+ built-in test runner is used (node:test).
 */

import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';

// ── helpers under test ────────────────────────────────────────────────────────
import {
  extractJsonLd,
  extractOpenGraph,
  extractNextData,
} from '../src/lib/productExtractor.js';

import { parsePrice } from '../src/lib/priceParser.js';
import { detectStore, extractProductId } from '../src/lib/storeDetector.js';

// ─────────────────────────────────────────────────────────────────────────────
// priceParser
// ─────────────────────────────────────────────────────────────────────────────
describe('parsePrice', () => {
  it('parses Chilean dot-separated thousands', () => {
    assert.equal(parsePrice('$399.990'), 399990);
    assert.equal(parsePrice('1.299.990'), 1299990);
  });

  it('parses comma-separated thousands', () => {
    assert.equal(parsePrice('1,299,990'), 1299990);
  });

  it('parses European format (decimal comma)', () => {
    assert.equal(parsePrice('29.990,50'), 29990);
  });

  it('parses plain integer', () => {
    assert.equal(parsePrice(29990), 29990);
  });

  it('returns null for empty/null', () => {
    assert.equal(parsePrice(null), null);
    assert.equal(parsePrice(''), null);
    assert.equal(parsePrice('N/A'), null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// storeDetector
// ─────────────────────────────────────────────────────────────────────────────
describe('detectStore', () => {
  const cases: [string, string][] = [
    ['https://www.falabella.com.cl/falabella-cl/product/123456/', 'falabella'],
    ['https://www.paris.cl/zapatillas-nike-881888400.html', 'paris'],
    ['https://simple.ripley.cl/zapatillas-nike-2000003456p', 'ripley'],
    ['https://www.zara.com/cl/es/camiseta-p12345678.html', 'zara'],
    ['https://www.mercadolibre.cl/p/MLC12345678', 'mercadolibre'],
    ['https://www.lippi.cl/producto/chaleco-polar', 'lippi'],
    ['https://www.ikea.com/cl/es/p/kallax-estanteria-80275887/', 'ikea'],
    ['https://www.example.com/product/xyz', 'unknown'],
  ];

  for (const [url, expected] of cases) {
    it(`detects ${expected} from URL`, () => {
      assert.equal(detectStore(url), expected);
    });
  }
});

describe('extractProductId', () => {
  it('extracts Falabella product ID', () => {
    assert.equal(
      extractProductId('https://www.falabella.com.cl/falabella-cl/product/10123456/nombre', 'falabella'),
      '10123456'
    );
  });

  it('extracts Paris SKU from .html URL', () => {
    assert.equal(
      extractProductId('https://www.paris.cl/zapatillas-nike-881888400.html', 'paris'),
      '881888400'
    );
  });

  it('extracts Ripley ID ending in p', () => {
    assert.equal(
      extractProductId('https://simple.ripley.cl/zapatillas-nike-2000003456p', 'ripley'),
      '2000003456'
    );
  });

  it('extracts Zara ID from -p{id}.html', () => {
    assert.equal(
      extractProductId('https://www.zara.com/cl/es/camiseta-p12345678.html', 'zara'),
      '12345678'
    );
  });

  it('extracts MercadoLibre catalog ID', () => {
    assert.equal(
      extractProductId('https://www.mercadolibre.cl/p/MLC987654321', 'mercadolibre'),
      'MLC987654321'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractJsonLd
// ─────────────────────────────────────────────────────────────────────────────
describe('extractJsonLd', () => {
  it('extracts product from schema.org/Product JSON-LD', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Televisor Samsung 55 pulgadas",
          "image": "https://example.com/img/tv.jpg",
          "offers": {
            "@type": "Offer",
            "price": "399990",
            "priceCurrency": "CLP"
          }
        }
        </script>
      </head></html>
    `;
    const $ = cheerio.load(html);
    const result = extractJsonLd($, 'https://example.com');

    assert.ok(result, 'should return a result');
    assert.equal(result!.title, 'Televisor Samsung 55 pulgadas');
    assert.equal(result!.price, 399990);
    assert.equal(result!.currency, 'CLP');
    assert.equal(result!.imageUrl, 'https://example.com/img/tv.jpg');
  });

  it('returns null when no JSON-LD present', () => {
    const $ = cheerio.load('<html><head></head></html>');
    assert.equal(extractJsonLd($, 'https://example.com'), null);
  });

  it('handles JSON-LD array with Product as first match', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        [
          { "@type": "BreadcrumbList", "name": "Nav" },
          { "@type": "Product", "name": "Chaqueta Lippi", "offers": { "price": "89990", "priceCurrency": "CLP" } }
        ]
        </script>
      </head></html>
    `;
    const $ = cheerio.load(html);
    const result = extractJsonLd($, 'https://lippi.cl');
    assert.ok(result);
    assert.equal(result!.title, 'Chaqueta Lippi');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractOpenGraph
// ─────────────────────────────────────────────────────────────────────────────
describe('extractOpenGraph', () => {
  it('extracts product from OG tags', () => {
    const html = `
      <html><head>
        <meta property="og:title"           content="Zapatillas Zara Blancas" />
        <meta property="og:image"           content="https://static.zara.net/photos/img.jpg" />
        <meta property="og:price:amount"    content="49990" />
        <meta property="og:price:currency"  content="CLP" />
      </head></html>
    `;
    const $ = cheerio.load(html);
    const result = extractOpenGraph($, 'https://www.zara.com');
    assert.ok(result);
    assert.equal(result!.title, 'Zapatillas Zara Blancas');
    assert.equal(result!.price, 49990);
    assert.equal(result!.imageUrl, 'https://static.zara.net/photos/img.jpg');
  });

  it('falls back to h1 when og:title missing', () => {
    const html = `<html><head></head><body><h1>Mi Producto</h1></body></html>`;
    const $ = cheerio.load(html);
    const result = extractOpenGraph($, 'https://example.com');
    assert.ok(result);
    assert.equal(result!.title, 'Mi Producto');
  });

  it('returns null when no title available', () => {
    const $ = cheerio.load('<html><head></head><body></body></html>');
    assert.equal(extractOpenGraph($, 'https://example.com'), null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractNextData
// ─────────────────────────────────────────────────────────────────────────────
describe('extractNextData', () => {
  function makeNextDataHtml(pageProps: unknown): string {
    const json = JSON.stringify({ props: { pageProps } });
    return `<html><head><script id="__NEXT_DATA__" type="application/json">${json}</script></head></html>`;
  }

  it('extracts product from Falabella-shaped __NEXT_DATA__', () => {
    const pageProps = {
      product: {
        displayName: 'Smart TV Samsung 55"',
        skus: [{
          prices: [{ type: 'internetPrice', price: '399990' }],
          images: [{ xxlarge: 'https://falabella.scene7.com/is/image/Falabella/1234/xl' }],
        }],
      },
    };
    const $ = cheerio.load(makeNextDataHtml(pageProps));
    const result = extractNextData($, 'https://www.falabella.com.cl');
    assert.ok(result);
    assert.equal(result!.title, 'Smart TV Samsung 55"');
    assert.equal(result!.price, 399990);
    assert.ok(result!.imageUrl?.includes('falabella.scene7.com'));
  });

  it('extracts product via regex fallback from raw __NEXT_DATA__', () => {
    // Valid JSON but no skus/prices/images keys so deepFind returns null → regex fallback kicks in
    const data = {
      props: {
        pageProps: {
          misc: {
            nested: {
              displayName: 'Ripley Zapatilla Running',
              internetPrice: '129990',
            },
          },
        },
      },
    };
    const html = `<html><head>
      <script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>
    </head></html>`;
    const $ = cheerio.load(html);
    const result = extractNextData($, 'https://simple.ripley.cl');
    assert.ok(result, 'should find product via regex fallback');
    assert.equal(result!.title, 'Ripley Zapatilla Running');
    assert.equal(result!.price, 129990);
  });

  it('returns null when __NEXT_DATA__ absent', () => {
    const $ = cheerio.load('<html><head></head></html>');
    assert.equal(extractNextData($, 'https://example.com'), null);
  });
});
