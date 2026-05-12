import { z } from 'zod';
import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from './priceParser.js';
import { detectStore, extractProductId, type StoreId } from './storeDetector.js';

// ─── SCHEMA ──────────────────────────────────────────────────────────────────
export const ProductSchema = z.object({
  title:     z.string().min(2).max(300),
  price:     z.number().int().positive().nullable(),
  currency:  z.string().default('CLP'),
  imageUrl:  z.string().url().nullable(),
  store:     z.enum([
    'falabella','paris','ripley','zara','mercadolibre','lippi','ikea',
    'sodimac','easy','pcfactory','froens',
    'lider','jumbo','tottus','tricot','abc','wildlama','gnomo','aliexpress','hm','adidas','on',
    'unknown',
  ]),
  sourceUrl: z.string().url(),
});

export type ProductResult = z.infer<typeof ProductSchema>;
type Partial_ = Partial<Omit<ProductResult, 'sourceUrl' | 'store'>>;

// ─── HTTP CLIENTS ─────────────────────────────────────────────────────────────
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const http = axios.create({
  timeout: 15_000,
  headers: {
    'User-Agent': BROWSER_UA,
    'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
  maxRedirects: 5,
  decompress: true,
});

const apiHttp = axios.create({
  timeout: 10_000,
  headers: {
    'User-Agent': BROWSER_UA,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'es-CL,es;q=0.9',
  },
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function toAbsolute(src: string | undefined | null, base: string): string | null {
  if (!src) return null;
  if (src.startsWith('data:') || src.includes('1x1') || src.includes('blank') || src.length < 10) return null;
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  try { return new URL(src, base).href; } catch { return null; }
}

function firstValid(candidates: (string | null | undefined)[], base: string): string | null {
  for (const c of candidates) {
    const u = toAbsolute(c, base);
    if (u) return u;
  }
  return null;
}

export function deepFind<T>(obj: unknown, keys: string[], depth = 8): T | null {
  if (!obj || typeof obj !== 'object' || depth === 0) return null;
  const record = obj as Record<string, unknown>;
  if (keys.every(k => k in record)) return record as T;
  for (const v of Object.values(record)) {
    const found = deepFind<T>(v, keys, depth - 1);
    if (found) return found;
  }
  return null;
}

function isUsable(d: Partial_ | null): d is Partial_ & { title: string } {
  return !!d?.title && d.title.trim().length > 2;
}

function cleanTitle(s: string): string {
  // Strip common store prefixes like "Lider.cl - " or "Tienda - "
  return s
    .replace(/^[A-Za-z0-9._-]+\s*[-|]\s*/u, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

// ─── EXTRACTOR 1: JSON-LD schema.org/Product ─────────────────────────────────
export function extractJsonLd($: cheerio.CheerioAPI, base: string): Partial_ | null {
  for (const el of $('script[type="application/ld+json"]').toArray()) {
    try {
      let data: unknown = JSON.parse($(el).html() ?? '{}');
      if (Array.isArray(data)) {
        data = (data as Record<string,unknown>[]).find(d => d['@type'] === 'Product') ?? data[0];
      }
      const d = data as Record<string, unknown>;
      if (!d || (d['@type'] !== 'Product' && !d['name'])) continue;

      const offers = Array.isArray(d['offers'])
        ? (d['offers'] as Record<string,unknown>[])[0]
        : d['offers'] as Record<string,unknown>;

      const imgs = ([].concat(d['image'] as never)).filter(Boolean) as string[];
      const title = cleanTitle(String(d['name'] ?? ''));
      if (title.length < 2) continue;

      return {
        title,
        price:    offers?.price != null ? parsePrice(String(offers.price)) : null,
        currency: String(offers?.priceCurrency ?? 'CLP'),
        imageUrl: firstValid(imgs, base),
      };
    } catch { /* malformed JSON-LD */ }
  }
  return null;
}

// ─── EXTRACTOR 2: Open Graph ──────────────────────────────────────────────────
export function extractOpenGraph($: cheerio.CheerioAPI, base: string): Partial_ | null {
  const og = (...props: string[]) => {
    for (const p of props) {
      const v = $(`meta[property="${p}"]`).attr('content')
             ?? $(`meta[name="${p}"]`).attr('content');
      if (v?.trim()) return v.trim();
    }
    return null;
  };

  const title = og('og:title', 'twitter:title') ?? $('h1').first().text().trim() ?? null;
  if (!title || title.length < 3) return null;

  return {
    title:    cleanTitle(title),
    price:    parsePrice(og('og:price:amount', 'product:price:amount', 'twitter:data1')),
    currency: og('og:price:currency', 'product:price:currency') ?? 'CLP',
    imageUrl: firstValid([og('og:image', 'twitter:image')], base),
  };
}

// ─── EXTRACTOR 3: __NEXT_DATA__ (Falabella / Paris / Ripley / Sodimac / Easy / Lider / VTEX) ─
export function extractNextData($: cheerio.CheerioAPI, base: string, fallbackImage?: string | null): Partial_ | null {
  try {
    const raw = $('#__NEXT_DATA__').html();
    if (!raw) return null;

    // ── Structured parse ────────────────────────────────────────────────────
    const json = JSON.parse(raw) as Record<string, unknown>;
    const pp = (json?.props as Record<string, unknown>)?.pageProps as Record<string, unknown>;

    // ── VTEX structure (Ripley, Jumbo, etc.) ────────────────────────────────
    const vtexProduct =
      deepFind<Record<string,unknown>>(json, ['productName', 'items'])
      ?? deepFind<Record<string,unknown>>(json, ['productName', 'sellers']);
    if (vtexProduct) {
      const title = cleanTitle(String(vtexProduct.productName ?? ''));
      if (title.length > 2) {
        const items = (vtexProduct.items as Record<string,unknown>[] ?? []);
        const item = items[0] ?? vtexProduct;
        const sellers = (item.sellers as Record<string,unknown>[] ?? []);
        const offer = (sellers[0]?.commertialOffer ?? sellers[0] ?? {}) as Record<string,unknown>;
        const price = offer.Price
          ? Math.round(offer.Price as number)
          : (offer.ListPrice ? Math.round(offer.ListPrice as number) : null);
        const images = (item.images as Record<string,string>[] ?? []);
        const imageUrl = firstValid(
          [...images.map((i: Record<string,string>) => i.imageUrl ?? i.imageText), fallbackImage!],
          base
        );
        return { title, price, currency: 'CLP', imageUrl };
      }
    }

    const directPaths = [
      pp?.product,
      pp?.['initialData'] && (pp['initialData'] as Record<string,unknown>)?.product,
      pp?.['productData'] && (pp['productData'] as Record<string,unknown>)?.product,
      pp?.['data'] && (pp['data'] as Record<string,unknown>)?.product,
      pp?.['pageData'] && (pp['pageData'] as Record<string,unknown>)?.product,
    ].filter(Boolean);

    for (const product of directPaths) {
      const p = product as Record<string, unknown>;
      const title = cleanTitle(String(p?.displayName ?? p?.name ?? p?.productName ?? ''));
      if (title.length < 3) continue;

      const skus = (p?.skus as Record<string,unknown>[] | undefined) ?? [];
      const prices = (skus[0]?.prices ?? p?.prices ?? p?.priceList ?? []) as Array<Record<string, unknown>>;
      const priceTypes = ['internetPrice','offerPrice','normalPrice','listPrice','bestPrice','precioOferta','precioNormal'];
      const priceObj = prices.find(x => priceTypes.includes(String(x?.type))) ?? prices[0];
      const rawPrice = priceObj?.price ?? priceObj?.value ?? p?.price ?? p?.offerPrice
                     ?? p?.normalPrice ?? p?.listPrice ?? p?.bestPrice ?? p?.salePrice;
      const price = parsePrice(String(rawPrice ?? ''));

      const skuImgs = ((skus[0]?.images ?? []) as Array<Record<string,string>>)
        .flatMap(i => [i?.xxlarge, i?.xlarge, i?.large, i?.url]);
      const mediaImgs = ((p?.medias ?? p?.images ?? []) as Array<Record<string,string>>)
        .map(m => m?.xxlarge ?? m?.url ?? m?.src);
      const imageUrl = firstValid([...skuImgs, ...mediaImgs, fallbackImage] as string[], base);

      return { title, price, currency: 'CLP', imageUrl };
    }

    // ── Recursive deepFind ──────────────────────────────────────────────────
    const product =
      deepFind<Record<string, unknown>>(json, ['displayName', 'skus'])
      ?? deepFind<Record<string, unknown>>(json, ['displayName', 'prices'])
      ?? deepFind<Record<string, unknown>>(json, ['displayName', 'images'])
      ?? deepFind<Record<string, unknown>>(json, ['name', 'prices', 'images'])
      ?? deepFind<Record<string, unknown>>(json, ['productName', 'offerPrice'])
      ?? deepFind<Record<string, unknown>>(json, ['name', 'offerPrice'])
      ?? deepFind<Record<string, unknown>>(json, ['name', 'normalPrice'])
      ?? deepFind<Record<string, unknown>>(json, ['name', 'price']);

    if (product) {
      const title = cleanTitle(String(product.displayName ?? product.name ?? product.productName ?? ''));
      if (title.length > 2) {
        const prices = ((product.skus as Record<string,unknown>[])?.[0]?.prices ?? product.prices ?? []) as Array<Record<string,unknown>>;
        const priceTypes = ['internetPrice','offerPrice','normalPrice','listPrice','bestPrice'];
        const priceObj = prices.find(x => priceTypes.includes(String(x?.type))) ?? prices[0];
        const rawPrice = priceObj?.price ?? priceObj?.value ?? product.price ?? product.offerPrice ?? product.normalPrice ?? product.salePrice;
        const price = parsePrice(String(rawPrice ?? ''));
        const imgRaw = (product.skus as Record<string,unknown>[])?.[0]?.images as Record<string,unknown>[];
        const imageUrl = firstValid([
          imgRaw?.[0]?.xxlarge as string, imgRaw?.[0]?.url as string,
          (product.images as Record<string,string>[])?.[0]?.url,
          fallbackImage!,
        ], base);
        return { title, price, currency: 'CLP', imageUrl };
      }
    }

    // ── Regex fallback on raw JSON string ───────────────────────────────────
    const nameMatch = raw.match(/"displayName"\s*:\s*"([^"]{5,})"/)
                   ?? raw.match(/"productName"\s*:\s*"([^"]{5,})"/)
                   ?? raw.match(/"name"\s*:\s*"([^"]{5,})"/);
    const priceMatch = raw.match(/"internetPrice"\s*:\s*"?([\d.]+)"?/)
                    ?? raw.match(/"offerPrice"\s*:\s*"?([\d.]+)"?/)
                    ?? raw.match(/"normalPrice"\s*:\s*"?([\d.]+)"?/)
                    ?? raw.match(/"listPrice"\s*:\s*"?([\d.]+)"?/)
                    ?? raw.match(/"bestPrice"\s*:\s*"?([\d.]+)"?/)
                    ?? raw.match(/"salePrice"\s*:\s*"?([\d.]+)"?/)
                    ?? raw.match(/"price"\s*:\s*"?([\d]{4,})"?/);
    const imgMatch = raw.match(/"xxlarge"\s*:\s*"(https?:\/\/[^"]+)"/)
                  ?? raw.match(/"xlarge"\s*:\s*"(https?:\/\/[^"]+)"/)
                  ?? raw.match(/"imageUrl"\s*:\s*"(https?:\/\/[^"]+)"/)
                  ?? raw.match(/"url"\s*:\s*"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);

    if (nameMatch) {
      return {
        title:    cleanTitle(nameMatch[1]),
        price:    priceMatch ? parsePrice(priceMatch[1]) : null,
        currency: 'CLP',
        imageUrl: imgMatch?.[1] ?? fallbackImage ?? null,
      };
    }
  } catch { /* ignore parse errors */ }
  return null;
}

// ─── DOM SUPPLEMENT ───────────────────────────────────────────────────────────
function supplementFromDom($: cheerio.CheerioAPI, base: string, partial: Partial_): Partial_ {
  const result = { ...partial };

  // Supplement missing price from DOM
  if (!result.price) {
    const priceSelectors = [
      'span[itemprop="price"]',
      '[data-price]',
      '[data-product-price]',
      '[data-testid*="price"]',
      '.woocommerce-Price-amount',
      '.product__price .money',
      '.price-box .price',
      '.offer-price',
      '.gl-price__value',
      '[class*="internetPrice"]',
      '[class*="offerPrice"]',
      '[class*="normalPrice"]',
      '[class*="price"]:not([class*="label"]):not([class*="title"])',
      '[class*="Price"]:not([class*="Label"]):not([class*="Title"])',
    ];
    for (const sel of priceSelectors) {
      const el = $(sel).first();
      if (!el.length) continue;
      // Check data-price attribute first
      const attr = el.attr('data-price') ?? el.attr('content');
      if (attr) {
        const p = parsePrice(attr);
        if (p && p > 500) { result.price = p; break; }
      }
      const text = el.text().trim();
      if (text) {
        const p = parsePrice(text);
        if (p && p > 500) { result.price = p; break; }
      }
    }
  }

  // Supplement missing image from DOM
  if (!result.imageUrl) {
    const imgCandidates: (string | null | undefined)[] = [];

    // Lazy-loaded images
    $('img[data-src],img[data-original],img[data-zoom-image],img[data-lazy-src]').each((_i, el) => {
      imgCandidates.push(
        $(el).attr('data-zoom-image')
          ?? $(el).attr('data-src')
          ?? $(el).attr('data-original')
          ?? $(el).attr('data-lazy-src')
      );
    });

    // srcset sources
    $('picture source[srcset], img[srcset]').each((_i, el) => {
      const srcset = $(el).attr('srcset');
      if (srcset) imgCandidates.push(srcset.split(',')[0].trim().split(' ')[0]);
    });

    // Product section images (heuristic)
    $('[class*="product"] img, [class*="gallery"] img, [class*="Product"] img, .swiper-slide img, [class*="carousel"] img').each((_i, el) => {
      imgCandidates.push($(el).attr('src'));
    });

    const url = firstValid(imgCandidates as string[], base);
    if (
      url &&
      !url.includes('placeholder') &&
      !url.includes('blank') &&
      !url.includes('logo') &&
      !url.includes('icon')
    ) {
      result.imageUrl = url;
    }
  }

  return result;
}

// ─── STORE-SPECIFIC API CALLS ─────────────────────────────────────────────────

async function fetchMercadoLibre(url: string, id: string): Promise<Partial_ | null> {
  try {
    const isCatalog = /\/p\/MLC/i.test(url);
    const endpoint = isCatalog
      ? `https://api.mercadolibre.com/products/${id}`
      : `https://api.mercadolibre.com/items/${id}`;
    const { data } = await apiHttp.get(endpoint);
    const pic = (data.pictures?.[0]?.url as string)?.replace(/\d+x\d+/, '600x600') ?? null;
    return {
      title:    String(data.name ?? data.title ?? '').trim(),
      price:    data.price ? Math.round(data.price as number) : null,
      currency: data.currency_id ?? 'CLP',
      imageUrl: pic,
    };
  } catch { return null; }
}

async function fetchZara(url: string, id: string): Promise<Partial_ | null> {
  const CHILE_STORE = '11729';
  const colorId = url.match(/[?&]v1=(\d+)/)?.[1];
  try {
    const endpoint = `https://www.zara.com/itxrest/2/catalog/store/${CHILE_STORE}/product/${id}/detail`;
    const { data } = await apiHttp.get(endpoint, {
      headers: { Referer: 'https://www.zara.com/', Origin: 'https://www.zara.com' },
    });
    type XMedia = { path?: string; url?: string };
    type Color = { id: string | number; xmedia: XMedia[]; price?: number; prices?: Record<string,unknown> };
    const colors = (data.colors ?? data.detail?.colors ?? []) as Color[];
    const color = colors.find((c: Color) => String(c.id) === colorId) ?? colors[0];
    const imgPath = color?.xmedia?.[0]?.path ?? color?.xmedia?.[0]?.url ?? null;
    const imageUrl = imgPath
      ? imgPath.startsWith('http') ? imgPath : `https://static.zara.net/photos/${imgPath}`
      : null;

    // Price: CLP is not divided by 100; apply heuristic
    const rawPrice = color?.price ?? (data.price as number | undefined) ?? (data.detail?.price as number | undefined) ?? null;
    let price: number | null = null;
    if (rawPrice != null && rawPrice !== 0) {
      const asNum = Number(rawPrice);
      const divided = Math.round(asNum / 100);
      // If dividing gives < 500, price is likely already in CLP
      price = divided >= 500 ? divided : Math.round(asNum);
    }
    // Also try prices object
    if (!price && color?.prices) {
      const prices = color.prices as Record<string,unknown>;
      const amount = (prices.amount ?? prices.originalAmount) as Record<string,unknown> | undefined;
      if (amount?.value) price = Math.round(Number(amount.value));
    }

    return {
      title:    String(data.name ?? '').trim(),
      price,
      currency: 'CLP',
      imageUrl,
    };
  } catch { return null; }
}

/** Falabella – intenta múltiples endpoints de API */
async function fetchFalabellaApi(_url: string, id: string): Promise<Partial_ | null> {
  const cdnImage = `https://falabella.scene7.com/is/image/Falabella/${id}/?$producto575x575$`;

  const endpoints = [
    `https://www.falabella.com.cl/falabella-cl/api/page/products/${id}`,
    `https://www.falabella.com.cl/falabella-cl/api/page/product-detail/${id}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const { data } = await apiHttp.get(endpoint, {
        headers: { Referer: 'https://www.falabella.com.cl/', Origin: 'https://www.falabella.com.cl' },
      });

      type PriceEntry = { type: string; price: string | number };
      type Sku = { prices?: PriceEntry[]; images?: Array<Record<string,string>> };
      type ProductLike = { displayName?: string; name?: string; skus?: Sku[]; medias?: Array<Record<string,string>> };

      const product: ProductLike | null =
        data?.data?.product ?? data?.product
        ?? deepFind<ProductLike>(data, ['displayName', 'skus'])
        ?? deepFind<ProductLike>(data, ['displayName', 'prices']);

      if (product) {
        const title = cleanTitle(String(product.displayName ?? product.name ?? ''));
        if (title.length < 3) continue;
        const skus = product.skus ?? [];
        const priceTypes = ['internetPrice','offerPrice','normalPrice'];
        const prices = skus[0]?.prices ?? [];
        const priceObj = prices.find(p => priceTypes.includes(p.type)) ?? prices[0];
        const price = parsePrice(String(priceObj?.price ?? ''));
        const skuImgs = (skus[0]?.images ?? []).flatMap(i => [i.xxlarge, i.xlarge, i.large, i.url]);
        const mediaImgs = (product.medias ?? []).map(m => m.xxlarge ?? m.url);
        const imageUrl = firstValid([...skuImgs, ...mediaImgs, cdnImage], 'https://www.falabella.com.cl') ?? cdnImage;
        return { title, price, currency: 'CLP', imageUrl };
      }
    } catch { /* try next endpoint */ }
  }

  // Devuelve solo la imagen CDN como señal para que Puppeteer complete el título/precio
  return { title: null as never, price: null, currency: 'CLP', imageUrl: cdnImage };
}

/** Sodimac / Easy – misma estructura (grupo Falabella) */
async function fetchSodimacFamily(url: string, id: string, store: 'sodimac' | 'easy'): Promise<Partial_ | null> {
  const base = store === 'sodimac' ? 'https://www.sodimac.cl' : 'https://www.easy.cl';
  const prefix = store === 'sodimac' ? 'sodimac-cl' : 'easy-cl';

  const endpoints = [
    `${base}/${prefix}/api/page/products/${id}`,
    `${base}/${prefix}/api/page/product-detail/${id}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const { data } = await apiHttp.get(endpoint, { headers: { Referer: base + '/' } });

      type PEntry = { type: string; price: string | number };
      type SkuL = { prices?: PEntry[]; images?: Array<Record<string,string>> };
      type ProdL = { displayName?: string; name?: string; skus?: SkuL[]; medias?: Array<Record<string,string>> };

      const product: ProdL | null =
        data?.data?.product ?? data?.product
        ?? deepFind<ProdL>(data, ['displayName', 'skus'])
        ?? deepFind<ProdL>(data, ['displayName', 'prices']);

      if (product) {
        const title = cleanTitle(String(product.displayName ?? product.name ?? ''));
        if (title.length < 3) continue;
        const skus = product.skus ?? [];
        const priceTypes = ['internetPrice','offerPrice','normalPrice'];
        const prices = skus[0]?.prices ?? [];
        const priceObj = prices.find(p => priceTypes.includes(p.type)) ?? prices[0];
        const price = parsePrice(String(priceObj?.price ?? ''));
        const skuImgs = (skus[0]?.images ?? []).flatMap(i => [i.xxlarge, i.xlarge, i.large, i.url]);
        const mediaImgs = (product.medias ?? []).map(m => m.xxlarge ?? m.url);
        const imageUrl = firstValid([...skuImgs, ...mediaImgs], base) ?? null;
        return { title, price, currency: 'CLP', imageUrl };
      }
    } catch { /* try next */ }
  }

  // fallback: try fetching the page HTML for __NEXT_DATA__
  try {
    const res = await http.get(url, { headers: { Referer: base + '/' } });
    const $ = cheerio.load(res.data as string);
    return extractNextData($, base) ?? extractJsonLd($, base) ?? extractOpenGraph($, base);
  } catch { return null; }
}

/** VTEX API – Jumbo and other VTEX-based stores */
async function fetchVtex(url: string, sku: string | null, domain: string): Promise<Partial_ | null> {
  if (!sku) return null;
  try {
    const apiUrl = `https://${domain}/api/catalog_system/pub/products/search?fq=skuId:${sku}&sc=1`;
    const { data } = await apiHttp.get(apiUrl, { headers: { Referer: `https://${domain}/` } });
    if (!Array.isArray(data) || data.length === 0) return null;
    const product = data[0] as Record<string,unknown>;
    const title = cleanTitle(String(product.productName ?? product.name ?? ''));
    if (title.length < 3) return null;
    const items = (product.items as Record<string,unknown>[] ?? []);
    const item = items[0] ?? {};
    const sellers = (item.sellers as Record<string,unknown>[] ?? []);
    const offer = (sellers[0]?.commertialOffer ?? {}) as Record<string,unknown>;
    const price = offer.Price ? Math.round(offer.Price as number) : null;
    const images = (item.images as Record<string,string>[] ?? []);
    const imageUrl = firstValid(
      images.map((i: Record<string,string>) => i.imageUrl ?? i.imageText),
      url
    );
    return { title, price, currency: 'CLP', imageUrl };
  } catch { return null; }
}

/** Tottus – Falabella Group API */
async function fetchTottus(url: string, id: string | null): Promise<Partial_ | null> {
  if (!id) return null;
  const endpoints = [
    `https://www.tottus.cl/tottus-cl/api/page/products/${id}`,
    `https://www.tottus.cl/tottus-cl/api/page/product-detail/${id}`,
  ];
  for (const endpoint of endpoints) {
    try {
      const { data } = await apiHttp.get(endpoint, { headers: { Referer: 'https://www.tottus.cl/' } });
      type PEntry = { type: string; price: string | number };
      type ProdL = { displayName?: string; name?: string; skus?: Array<{prices?: PEntry[]; images?: Array<Record<string,string>>}>; medias?: Array<Record<string,string>> };
      const product: ProdL | null =
        data?.data?.product ?? data?.product
        ?? deepFind<ProdL>(data, ['displayName', 'skus']);
      if (product) {
        const title = cleanTitle(String(product.displayName ?? product.name ?? ''));
        if (title.length < 3) continue;
        const skus = product.skus ?? [];
        const priceTypes = ['internetPrice','offerPrice','normalPrice'];
        const prices = skus[0]?.prices ?? [];
        const priceObj = prices.find(p => priceTypes.includes(p.type)) ?? prices[0];
        const price = parsePrice(String(priceObj?.price ?? ''));
        const imgs = (skus[0]?.images ?? []).flatMap(i => [i.xxlarge, i.xlarge, i.url]);
        const mediaImgs = (product.medias ?? []).map(m => m.xxlarge ?? m.url);
        const imageUrl = firstValid([...imgs, ...mediaImgs], 'https://www.tottus.cl') ?? null;
        return { title, price, currency: 'CLP', imageUrl };
      }
    } catch { /* next */ }
  }
  return null;
}

// ─── PUPPETEER FALLBACK ───────────────────────────────────────────────────────
let _browser: import('puppeteer').Browser | null = null;

async function getBrowser() {
  if (_browser?.connected) return _browser;
  const { default: puppeteer } = await import('puppeteer');
  _browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox','--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--lang=es-CL',
      '--window-size=1440,900',
    ],
  });
  return _browser;
}

const WAIT_SELECTORS: Partial<Record<StoreId, string[]>> = {
  falabella:    ['[class*="copy10"]','[class*="internetPrice"]','h1','[class*="product-name"]'],
  paris:        ['[class*="offerPrice"]','[class*="product-price"]','.price-sales','h1'],
  ripley:       ['[class*="best-price"]','[class*="ProductPrice"]','.product-price','h1'],
  zara:         ['[class*="money-amount__main"]','[class*="price__amount"]','h1'],
  mercadolibre: ['.ui-pdp-price__second-line .andes-money-amount__fraction','h1'],
  sodimac:      ['[class*="price"]','[class*="Price"]','h1'],
  easy:         ['[class*="price"]','[class*="Price"]','h1'],
  pcfactory:    ['[class*="price"]','.precio','h1'],
  froens:       ['.woocommerce-Price-amount','h1'],
  lippi:        ['.woocommerce-Price-amount','h1'],
  ikea:         ['[class*="pip-price"]','h1'],
  lider:        ['[class*="price"]','[class*="Price"]','h1','[data-testid*="price"]'],
  jumbo:        ['[class*="price"]','h1','.valtech'],
  tottus:       ['[class*="internetPrice"]','[class*="price"]','h1'],
  tricot:       ['.woocommerce-Price-amount','h1'],
  abc:          ['.price','[class*="price"]','h1'],
  wildlama:     ['.product__price','[class*="price"]','h1'],
  gnomo:        ['.woocommerce-Price-amount','h1'],
  aliexpress:   ['[class*="price"]','h1'],
  hm:           ['[class*="price"]','h1'],
  adidas:       ['[class*="gl-price"]','[class*="price"]','h1'],
  on:           ['.product__price','[class*="price"]','h1'],
};

async function scrapeWithPuppeteer(url: string, store: StoreId, fallbackImage?: string | null): Promise<Partial_ | null> {
  if (process.env['PUPPETEER_SKIP'] === 'true') {
    console.log('  Puppeteer skipped (serverless mode)');
    return null;
  }
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // Anti-detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      (window as unknown as Record<string,unknown>).chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    });
    await page.setUserAgent(BROWSER_UA);
    await page.setViewport({ width: 1440, height: 900 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-CL,es;q=0.9' });

    // Block heavy resources
    await page.setRequestInterception(true);
    page.on('request', r => {
      const t = r.resourceType();
      if (['font','media','stylesheet'].includes(t)) { r.abort(); return; }
      r.continue();
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Wait for price or h1
    const sels = WAIT_SELECTORS[store] ?? ['h1'];
    for (const sel of sels) {
      try { await page.waitForSelector(sel, { timeout: 7_000 }); break; } catch { /* next */ }
    }

    // Scroll + resolve lazy images
    await page.evaluate(async () => {
      window.scrollBy(0, 600);
      document.querySelectorAll<HTMLImageElement>('img[data-src],img[data-original],img[data-zoom],img[data-lazy]')
        .forEach(img => {
          const s = img.getAttribute('data-zoom')
                 ?? img.getAttribute('data-src')
                 ?? img.getAttribute('data-original')
                 ?? img.getAttribute('data-lazy');
          if (s && !s.startsWith('data:')) img.src = s;
        });
      await new Promise<void>(r => setTimeout(r, 1_500));
    });

    const html = await page.content();
    const $ = cheerio.load(html);
    const base = new URL(url).origin;

    let result = extractNextData($, base, fallbackImage)
              ?? extractJsonLd($, base)
              ?? extractOpenGraph($, base);

    // Supplement with DOM if needed
    if (result) {
      result = supplementFromDom($, base, result);
    }

    return result;
  } finally {
    await page.close().catch(() => {});
  }
}

// ─── PARIS PRICE SUPPLEMENT ───────────────────────────────────────────────────
async function tryParisSupplementPrice(sku: string): Promise<number | null> {
  const endpoints = [
    `https://www.paris.cl/paris-cl/api/page/products/${sku}`,
    `https://api.paris.cl/v1/products/${sku}`,
  ];
  for (const endpoint of endpoints) {
    try {
      const { data } = await apiHttp.get(endpoint, { headers: { Referer: 'https://www.paris.cl/' } });
      const priceTypes = ['internetPrice','offerPrice','normalPrice','listPrice'];

      // Fixed: navigate to the product object and its skus/prices
      const product =
        data?.data?.product ?? data?.product
        ?? deepFind<Record<string,unknown>>(data, ['skus', 'prices'])
        ?? deepFind<Record<string,unknown>>(data, ['displayName', 'skus']);

      if (product) {
        const skus = (product.skus as Record<string,unknown>[] | undefined) ?? [];
        const prices = ((skus[0]?.prices ?? []) as Record<string,unknown>[]);
        const p = prices.find((x: Record<string,unknown>) => priceTypes.includes(String(x?.type))) ?? prices[0];
        const val = p?.price ?? p?.value;
        if (val) return parsePrice(String(val));
        // Also check direct price fields on product
        const rawP = product.offerPrice ?? product.normalPrice ?? product.internetPrice ?? product.price;
        if (rawP) return parsePrice(String(rawP));
      }
    } catch { /* next */ }
  }
  return null;
}

// ─── BUILD RESULT ─────────────────────────────────────────────────────────────
function buildResult(partial: Partial_, store: StoreId, url: string): ProductResult {
  const raw = {
    title:     (partial.title ?? '').trim().slice(0, 300),
    price:     partial.price ?? null,
    currency:  partial.currency ?? 'CLP',
    imageUrl:  partial.imageUrl ?? null,
    store,
    sourceUrl: url,
  };
  const parsed = ProductSchema.safeParse(raw);
  return parsed.success ? parsed.data : { ...raw, title: raw.title || 'Producto', store };
}

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────
export async function extractProductFromUrl(rawUrl: string): Promise<ProductResult> {
  if (!rawUrl?.trim()) throw new Error('URL vacía');
  const url = rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl;
  try { new URL(url); } catch { throw new Error('URL inválida'); }

  const store = detectStore(url);
  const productId = extractProductId(url, store);
  const base = new URL(url).origin;

  console.log(`\n[${store}] ${url}`);

  let partial: Partial_ | null = null;

  // ── STEP 1: Store-specific public APIs (no scraping) ─────────────────────
  if (store === 'mercadolibre' && productId) {
    partial = await fetchMercadoLibre(url, productId);
    if (isUsable(partial)) { console.log('  ML API:', partial.title); return buildResult(partial, store, url); }
  }

  if (store === 'zara' && productId) {
    partial = await fetchZara(url, productId);
    if (isUsable(partial)) { console.log('  Zara API:', partial.title); return buildResult(partial, store, url); }
  }

  if (store === 'falabella' && productId) {
    partial = await fetchFalabellaApi(url, productId);
    if (isUsable(partial)) { console.log('  Falabella API:', partial.title); return buildResult(partial, store, url); }
    // Fall through to Puppeteer faster for Falabella
    console.log('  Falabella API blocked, going to Puppeteer');
  }

  if ((store === 'sodimac' || store === 'easy') && productId) {
    partial = await fetchSodimacFamily(url, productId, store);
    if (isUsable(partial)) { console.log('  Sodimac/Easy API:', partial.title); return buildResult(partial, store, url); }
    // Fall through to Puppeteer faster
    console.log('  Sodimac/Easy API blocked, going to Puppeteer');
  }

  if (store === 'jumbo') {
    partial = await fetchVtex(url, productId, 'www.jumbo.cl');
    if (isUsable(partial)) { console.log('  Jumbo VTEX API:', partial.title); return buildResult(partial, store, url); }
  }

  if (store === 'tottus') {
    partial = await fetchTottus(url, productId);
    if (isUsable(partial)) { console.log('  Tottus API:', partial.title); return buildResult(partial, store, url); }
  }

  // ── STEP 2: Fetch HTML + metadata cascade ────────────────────────────────
  let html: string | null = null;
  let httpError: string | null = null;

  // For stores known to block API, skip HTML fetch and go straight to Puppeteer
  const puppeteerFirst: StoreId[] = ['falabella', 'sodimac', 'adidas'];
  if (!puppeteerFirst.includes(store)) {
    try {
      const res = await http.get(url, { headers: { Referer: base + '/' } });
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      html = res.data as string;
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 404) throw new Error('Producto no encontrado (404)');
        httpError = err.response?.status === 403 ? 'blocked' : err.message;
      }
    }
  } else {
    httpError = 'puppeteer-first';
  }

  if (html) {
    const $ = cheerio.load(html);
    const cdnFallback = store === 'falabella' && productId
      ? `https://falabella.scene7.com/is/image/Falabella/${productId}/?$producto575x575$`
      : null;

    partial = extractNextData($, base, cdnFallback)
           ?? extractJsonLd($, base)
           ?? extractOpenGraph($, base);

    if (isUsable(partial)) {
      // Supplement missing price/image from DOM
      partial = supplementFromDom($, base, partial);

      // Try Paris API for price if still missing
      if (!partial.price && store === 'paris' && productId) {
        const parisPrice = await tryParisSupplementPrice(productId);
        if (parisPrice) partial = { ...partial, price: parisPrice };
      }

      // Try Tottus API for price if still missing
      if (!partial.price && store === 'tottus' && productId) {
        const totResult = await fetchTottus(url, productId);
        if (totResult?.price) partial = { ...partial, price: totResult.price };
      }

      console.log('  HTML metadata:', partial.title);
      return buildResult(partial, store, url);
    }
  }

  // ── STEP 3: Puppeteer fallback (JS-rendered / blocked) ───────────────────
  console.log(`  Puppeteer fallback (${httpError ?? 'datos incompletos'})`);
  const cdnFallback = store === 'falabella' && productId
    ? `https://falabella.scene7.com/is/image/Falabella/${productId}/?$producto575x575$`
    : null;

  partial = await scrapeWithPuppeteer(url, store, cdnFallback);

  if (!isUsable(partial)) {
    throw new Error(
      'No se pudo encontrar información del producto. ' +
      'Verifica que el enlace apunte a un producto específico, no a una categoría o búsqueda.'
    );
  }

  console.log('  Puppeteer:', partial.title);
  return buildResult(partial, store, url);
}
