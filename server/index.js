import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());

// ─── BROWSER SINGLETON ────────────────────────────────────────────────────────
let browser = null;
async function getBrowser() {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage', '--lang=es-CL,es',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1440,900',
      ],
    });
  }
  return browser;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8"',
  'Sec-Ch-Ua-Mobile': '?0', 'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none', 'Upgrade-Insecure-Requests': '1',
};

const API_HEADERS = {
  'User-Agent': HEADERS['User-Agent'],
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'es-CL,es;q=0.9',
  'Referer': 'https://www.falabella.com.cl/',
};

function cleanPrice(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).replace(/\s/g, '').replace(/[^\d.,]/g, '');
  if (!s) return null;
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return parseInt(s.replace(/\./g, ''), 10);
  if (/^\d{1,3}(,\d{3})+$/.test(s)) return parseInt(s.replace(/,/g, ''), 10);
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : Math.round(n);
}

function toAbs(src, base) {
  if (!src) return null;
  if (src.startsWith('data:') || src.includes('1x1') || src.includes('blank')) return null;
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  try { return new URL(src, base).href; } catch { return null; }
}

// Recursively find first object with given keys inside a deep JSON tree
function deepFind(obj, keys, maxDepth = 8) {
  if (!obj || typeof obj !== 'object' || maxDepth === 0) return null;
  if (keys.every(k => k in obj)) return obj;
  for (const v of Object.values(obj)) {
    const found = deepFind(v, keys, maxDepth - 1);
    if (found) return found;
  }
  return null;
}

// Best image from array of candidates (skip placeholders)
function bestImage(arr, base) {
  for (const c of (arr || [])) {
    const u = toAbs(c, base);
    if (u) return u;
  }
  return null;
}

// ─── 1. MERCADOLIBRE PUBLIC API ───────────────────────────────────────────────
async function tryMercadoLibreAPI(url) {
  const prodMatch = url.match(/\/p\/(MLC\d+)/i);
  const itemMatch = url.match(/\/(MLC\d+)/i);
  const id = (prodMatch || itemMatch)?.[1];
  if (!id) return null;
  try {
    if (prodMatch) {
      const { data } = await axios.get(`https://api.mercadolibre.com/products/${id}`, { timeout: 8000 });
      const pic = data.pictures?.[0]?.url?.replace(/\d+x\d+/, '600x600');
      return {
        name: data.name,
        price: null,
        image: pic || null,
        description: data.short_description?.content?.slice(0, 400) || '',
        brand: data.attributes?.find(a => a.id === 'BRAND')?.value_name || '',
      };
    }
    const { data } = await axios.get(`https://api.mercadolibre.com/items/${id}`, { timeout: 8000 });
    const pic = data.pictures?.[0]?.url?.replace(/\d+x\d+/, '600x600');
    return {
      name: data.title,
      price: data.price ? Math.round(data.price) : null,
      image: pic || null,
      description: '',
      brand: data.attributes?.find(a => a.id === 'BRAND')?.value_name || '',
    };
  } catch { return null; }
}

// ─── 2. FALABELLA ──────────────────────────────────────────────────────────────
// Extract product ID from URL like /product/881888400/Name/881888400
function falabellaExtractId(url) {
  const m = url.match(/\/product\/(\d+)\//);
  return m?.[1] || null;
}

async function tryFalabellaAPI(url) {
  const id = falabellaExtractId(url);
  if (!id) return null;

  // Strategy A: Scene7 CDN image (always works if we have the ID)
  const cdnImage = `https://falabella.scene7.com/is/image/Falabella/${id}/?$producto575x575$`;

  // Strategy B: Try Falabella internal product API
  try {
    const apiUrl = `https://www.falabella.com.cl/falabella-cl/api/page/products/${id}`;
    const { data } = await axios.get(apiUrl, {
      timeout: 8000,
      headers: { ...API_HEADERS, Referer: 'https://www.falabella.com.cl/' },
    });

    // Find product in response
    const product = data?.data?.product || data?.product || deepFind(data, ['displayName', 'skus']);
    if (product) {
      const name = product.displayName || product.name;
      const skus = product.skus || [];
      const prices = skus[0]?.prices || product.prices || [];
      const priceObj = prices.find(p => ['internetPrice', 'offerPrice', 'normalPrice'].includes(p.type)) || prices[0];
      const price = cleanPrice(priceObj?.price);
      const imgCandidates = [
        ...(skus[0]?.images || []).flatMap(i => [i.xxlarge, i.xlarge, i.large, i.url]),
        ...(product.medias || []).map(m => m.xxlarge || m.url),
        cdnImage,
      ];
      return { name, price, image: bestImage(imgCandidates, url) || cdnImage, description: product.longDescription?.slice(0, 400) || '', brand: 'Falabella' };
    }
  } catch { /**/ }

  // Return just the CDN image (will be merged later with scraped name/price)
  return { _cdnImage: cdnImage, _id: id };
}

// ─── 3. PARIS ────────────────────────────────────────────────────────────────
// URL: /detalle-product/{slug}-{sku}.html  OR  /tienda/product/{sku}/{slug}
function parisExtractId(url) {
  return url.match(/-(\d{6,})\./)?.[1] || url.match(/\/product\/(\d+)/)?.[1] || null;
}

async function tryParisAPI(url) {
  const id = parisExtractId(url);
  if (!id) return null;
  try {
    const apiUrl = `https://www.paris.cl/tienda/api/page/products/${id}`;
    const { data } = await axios.get(apiUrl, {
      timeout: 8000,
      headers: { ...API_HEADERS, Referer: 'https://www.paris.cl/' },
    });
    const product = data?.data?.product || data?.product || deepFind(data, ['name', 'prices']);
    if (product?.name) {
      const price = cleanPrice(product.prices?.offerPrice || product.prices?.normalPrice || product.price);
      const img = product.images?.[0]?.url || product.medias?.[0]?.url || null;
      return { name: product.name, price, image: img, description: product.description?.slice(0, 400) || '', brand: 'Paris' };
    }
  } catch { /**/ }
  return null;
}

// ─── 4. RIPLEY ───────────────────────────────────────────────────────────────
// URL: https://simple.ripley.cl/{slug}-{id}p
function ripleyExtractId(url) {
  return url.match(/-(\d+)p(?:\?|$|\/)/)?.[1] || url.match(/-(\d+)p$/)?.[1] || null;
}

async function tryRipleyAPI(url) {
  const id = ripleyExtractId(url);
  if (!id) return null;
  try {
    // Ripley's internal API
    const apiUrl = `https://simple.ripley.cl/api/products/pdp/${id}`;
    const { data } = await axios.get(apiUrl, {
      timeout: 8000,
      headers: { ...API_HEADERS, Referer: 'https://simple.ripley.cl/' },
    });
    const product = data?.product || data?.data || deepFind(data, ['displayName', 'prices']);
    if (product?.displayName || product?.name) {
      const name = product.displayName || product.name;
      const price = cleanPrice(product.prices?.offerPrice || product.prices?.normalPrice || product.normalPrice);
      const img = product.images?.[0]?.url || product.medias?.[0]?.url || null;
      return { name, price, image: img, description: product.description?.slice(0, 400) || '', brand: 'Ripley' };
    }
  } catch { /**/ }
  return null;
}

// ─── 5. ZARA ────────────────────────────────────────────────────────────────
// URL: /cl/es/{name}-p{productId}.html?v1={colorId}
function zaraExtractId(url) {
  return url.match(/-p(\d+)\.html/)?.[1] || null;
}

async function tryZaraAPI(url) {
  const productId = zaraExtractId(url);
  if (!productId) return null;

  const colorId = url.match(/[?&]v1=(\d+)/)?.[1];
  const CHILE_STORE = '11729';

  try {
    const apiUrl = `https://www.zara.com/itxrest/2/catalog/store/${CHILE_STORE}/product/${productId}/detail`;
    const { data } = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': HEADERS['User-Agent'],
        'Accept': 'application/json',
        'Accept-Language': 'es-CL,es;q=0.9',
        'Referer': 'https://www.zara.com/',
        'Origin': 'https://www.zara.com',
      },
    });

    const name = data.name;
    // Price in Zara API is in cents (CLP doesn't have decimals but API uses integers)
    const price = data.price ? Math.round(data.price / 100) : null;

    // Find color (prefer the one from ?v1= param)
    const colors = data.colors || [];
    const activeColor = colors.find(c => String(c.id) === String(colorId)) || colors[0];
    const xmedia = activeColor?.xmedia || [];
    const imgPath = xmedia[0]?.path || xmedia[0]?.url || null;
    const image = imgPath ? (imgPath.startsWith('http') ? imgPath : `https://static.zara.net/photos/${imgPath}/w/563/${imgPath.split('/').pop()}`) : null;

    return { name, price, image, description: data.description?.slice(0, 400) || '', brand: 'Zara' };
  } catch { /**/ }
  return null;
}

// ─── PARSE __NEXT_DATA__ ────────────────────────────────────────────────────
function extractNextData($, base, hint) {
  try {
    const raw = $('#__NEXT_DATA__').html();
    if (!raw) return null;
    const json = JSON.parse(raw);
    const pp = json?.props?.pageProps;

    // Try known paths first
    const candidates = [
      pp?.product, pp?.initialData?.product, pp?.productData?.product,
      pp?.data?.product, pp?.pageData?.product, pp?.serverData?.product,
      pp?.initialData?.data?.product,
    ].filter(Boolean);

    for (const product of candidates) {
      const name = product.displayName || product.name;
      if (!name || name.length < 3) continue;

      const skus = product.skus || product.variants || [];
      const prices = skus[0]?.prices || product.prices || [];
      let price = null;
      for (const p of prices) {
        if (['internetPrice', 'offerPrice', 'normalPrice', 'eventPrice'].includes(p.type)) {
          price = cleanPrice(p.price); break;
        }
      }
      if (!price) price = cleanPrice(product.price || product.minOfferPrice || product.offerPrice || product.normalPrice);

      const imgCandidates = [
        ...(skus[0]?.images || []).flatMap(i => [i.xxlarge, i.xlarge, i.large, i.url]).filter(Boolean),
        ...(product.medias || []).map(m => m.xxlarge || m.xlarge || m.url).filter(Boolean),
        product.image, ...(product.images || []),
      ];

      // Falabella: if we have the CDN image from API step, prefer it
      if (hint?._cdnImage) imgCandidates.unshift(hint._cdnImage);

      const image = bestImage(imgCandidates, base);
      const brand = product.brand?.name || product.brand || '';
      const desc = (product.longDescription || product.description || '').slice(0, 400);
      return { name, price, image, description: desc, brand };
    }

    // Deep recursive search for product-like object
    const product = deepFind(json, ['displayName', 'skus']) || deepFind(json, ['displayName', 'prices']) || deepFind(json, ['name', 'prices', 'images']);
    if (product) {
      const name = product.displayName || product.name;
      if (name && name.length > 3) {
        const skus = product.skus || [];
        const prices = (skus[0]?.prices || product.prices || []);
        const priceObj = prices.find(p => ['internetPrice', 'offerPrice', 'normalPrice'].includes(p?.type)) || prices[0];
        const price = cleanPrice(priceObj?.price || product.price);
        const imgRaw = skus[0]?.images?.[0]?.xxlarge || skus[0]?.images?.[0]?.url || product.images?.[0]?.url || product.image;
        const image = toAbs(imgRaw, base) || hint?._cdnImage || null;
        return { name, price, image, description: '', brand: '' };
      }
    }

    // Last resort: regex on raw JSON
    const nameMatch = raw.match(/"displayName"\s*:\s*"([^"]{5,})"/) || raw.match(/"name"\s*:\s*"([^"]{5,})"/);
    const priceMatch = raw.match(/"internetPrice"\s*:\s*"?([\d.]+)"?/) || raw.match(/"offerPrice"\s*:\s*"?([\d.]+)"?/) || raw.match(/"normalPrice"\s*:\s*"?([\d.]+)"?/);
    const imgMatch = raw.match(/"xxlarge"\s*:\s*"(https?:\/\/[^"]+)"/) || raw.match(/"url"\s*:\s*"(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
    if (nameMatch) {
      return {
        name: nameMatch[1],
        price: priceMatch ? cleanPrice(priceMatch[1]) : null,
        image: imgMatch?.[1] || hint?._cdnImage || null,
        description: '', brand: '',
      };
    }
  } catch { /**/ }
  return null;
}

// ─── PARSE JSON-LD ───────────────────────────────────────────────────────────
function extractJsonLd($, base) {
  for (const el of $('script[type="application/ld+json"]').toArray()) {
    try {
      let d = JSON.parse($(el).html());
      if (Array.isArray(d)) d = d.find(x => x['@type'] === 'Product') || d[0];
      if (d?.['@type'] === 'Product' || (d?.name && d?.offers)) {
        const offer = Array.isArray(d.offers) ? d.offers[0] : d.offers;
        const imgs = [].concat(d.image || []);
        return {
          name: d.name,
          price: offer?.price ? cleanPrice(String(offer.price)) : null,
          image: bestImage(imgs, base),
          description: typeof d.description === 'string' ? d.description.slice(0, 400) : '',
          brand: typeof d.brand === 'string' ? d.brand : (d.brand?.name || ''),
        };
      }
    } catch { /**/ }
  }
  return null;
}

// ─── PARSE OPEN GRAPH ────────────────────────────────────────────────────────
function extractOG($, base) {
  const og = (...props) => {
    for (const p of props) {
      const v = $(`meta[property="${p}"]`).attr('content') || $(`meta[name="${p}"]`).attr('content');
      if (v?.trim()) return v.trim();
    }
    return null;
  };
  const name = og('og:title', 'twitter:title') || $('h1').first().text().trim();
  const image = toAbs(og('og:image', 'twitter:image'), base);
  const description = og('og:description', 'twitter:description') || '';
  const price = cleanPrice(og('og:price:amount', 'product:price:amount'));
  return name && name.length > 3 ? { name, price, image, description, brand: '' } : null;
}

// ─── SITE-SPECIFIC DOM SELECTORS ─────────────────────────────────────────────
function extractDOM($, base, url) {
  // Falabella
  if (url.includes('falabella.com')) {
    const name = $('[class*="product-title"], [class*="ProductTitle"], h1').first().text().trim();
    const price = cleanPrice(
      $('[data-internet-price]').attr('data-internet-price') ||
      $('[class*="copy10"]').first().text() ||
      $('[class*="internet-price"]').first().text() ||
      $('[class*="offerPrice"]').first().text()
    );
    // Try all image attributes
    const imgEl = $('[class*="gallery"] img, [id*="gallery"] img, [class*="product-image"] img').first();
    const img = toAbs(imgEl.attr('data-zoom') || imgEl.attr('data-src') || imgEl.attr('src'), base);
    return name ? { name, price, image: img, description: '', brand: 'Falabella' } : null;
  }

  // Paris
  if (url.includes('paris.cl')) {
    const name = $('h1, [class*="product-name"], [class*="ProductName"]').first().text().trim();
    const price = cleanPrice(
      $('[class*="offerPrice"], [class*="offer-price"], .price-sales').first().text() ||
      $('[class*="price"]').first().text()
    );
    const imgEl = $('[class*="main-image"] img, [class*="product-image"] img, [class*="gallery"] img').first();
    const img = toAbs(imgEl.attr('data-zoom') || imgEl.attr('data-src') || imgEl.attr('src'), base);
    return name ? { name, price, image: img, description: '', brand: 'Paris' } : null;
  }

  // Ripley
  if (url.includes('ripley.cl')) {
    const name = $('h1, [class*="ProductTitle"], [class*="product-title"]').first().text().trim();
    const price = cleanPrice(
      $('[class*="best-price"], [class*="ProductPrice"], [class*="offer-price"]').first().text() ||
      $('[class*="price"]').first().text()
    );
    const imgEl = $('[class*="Gallery"] img, [class*="product-image"] img, img[class*="product"]').first();
    const img = toAbs(imgEl.attr('data-zoom') || imgEl.attr('data-src') || imgEl.attr('data-original') || imgEl.attr('src'), base);
    return name ? { name, price, image: img, description: '', brand: 'Ripley' } : null;
  }

  // Zara
  if (url.includes('zara.com')) {
    const name = $('h1, [class*="product-detail-info"] h1').first().text().trim();
    const price = cleanPrice($('[class*="money-amount__main"], [class*="price__amount"]').first().text());
    const imgEl = $('[class*="product-detail-images"] img, [class*="media-image"] img').first();
    const img = toAbs(imgEl.attr('src') || imgEl.attr('data-src'), base);
    return name ? { name, price, image: img, description: '', brand: 'Zara' } : null;
  }

  // Lippi
  if (url.includes('lippi.cl')) {
    const name = $('h1.product_title').text().trim();
    const price = cleanPrice($('ins .woocommerce-Price-amount bdi').text() || $('.woocommerce-Price-amount bdi').first().text());
    const img = toAbs($('.woocommerce-product-gallery__image a').attr('href') || $('.woocommerce-product-gallery__image img').attr('src'), base);
    return name ? { name, price, image: img, description: $('.woocommerce-product-details__short-description').text().trim().slice(0, 400), brand: 'Lippi' } : null;
  }

  // IKEA
  if (url.includes('ikea.com')) {
    const name = $('[class*="pip-product-summary__name"], h1').first().text().trim();
    const price = cleanPrice($('[class*="pip-price__integer"]').first().text());
    const img = toAbs($('[class*="pip-product-images"] img').first().attr('src'), base);
    return name ? { name, price, image: img, description: '', brand: 'IKEA' } : null;
  }

  return null;
}

// ─── PARSE HTML: cascade through all extractors ───────────────────────────────
function parseHTML(html, url, hint = null) {
  const $ = cheerio.load(html);
  const base = (() => { try { return new URL(url).origin; } catch { return ''; } })();

  const fromNext = extractNextData($, base, hint);
  if (isGood(fromNext)) return merge(fromNext, hint);

  const fromLd = extractJsonLd($, base);
  if (isGood(fromLd)) return merge(fromLd, hint);

  const fromDom = extractDOM($, base, url);
  if (isGood(fromDom)) return merge(fromDom, hint);

  const fromOG = extractOG($, base);
  if (isGood(fromOG)) return merge(fromOG, hint);

  return null;
}

function isGood(d) { return d?.name && d.name.trim().length > 3; }

// Merge scraped data with API hint (fill in missing image/price from CDN hint)
function merge(data, hint) {
  if (!hint) return data;
  return {
    ...data,
    image: data.image || hint?._cdnImage || null,
    price: data.price ?? (hint?.price || null),
  };
}

// ─── SCRAPE WITH AXIOS ────────────────────────────────────────────────────────
async function scrapeAxios(url, hint = null) {
  const res = await axios.get(url, {
    timeout: 12000,
    headers: { ...HEADERS, Referer: (() => { try { return new URL(url).origin; } catch { return ''; } })() },
    maxRedirects: 5, decompress: true,
  });
  if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
  return parseHTML(res.data, url, hint);
}

// ─── SCRAPE WITH PUPPETEER ────────────────────────────────────────────────────
// Site-specific wait selectors
const WAIT_SELECTORS = {
  'falabella.com': ['[class*="copy10"]', '[class*="offerPrice"]', '[class*="product-title"]', 'h1'],
  'paris.cl':      ['[class*="offerPrice"]', '.price-sales', 'h1'],
  'ripley.cl':     ['[class*="best-price"]', '[class*="ProductPrice"]', 'h1'],
  'zara.com':      ['[class*="money-amount__main"]', '[class*="price__amount"]', 'h1'],
};

function getWaitSelectors(url) {
  for (const [domain, sels] of Object.entries(WAIT_SELECTORS)) {
    if (url.includes(domain)) return sels;
  }
  return ['h1'];
}

async function scrapePuppeteer(url, hint = null) {
  console.log('🤖 Puppeteer →', url);
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    // Remove automation signals
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {}, app: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['es-CL', 'es', 'en-US', 'en'] });
      Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
    });

    await page.setUserAgent(HEADERS['User-Agent']);
    await page.setViewport({ width: 1440, height: 900 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-CL,es;q=0.9' });

    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', req => {
      const type = req.resourceType();
      if (['font', 'media', 'websocket'].includes(type)) req.abort();
      else req.continue();
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });

    // Wait for price/title element site-specifically
    const waitSels = getWaitSelectors(url);
    for (const sel of waitSels) {
      try {
        await page.waitForSelector(sel, { timeout: 8000 });
        break;
      } catch { /**/ }
    }

    // Scroll to trigger lazy-loading of images
    await page.evaluate(() => {
      window.scrollBy(0, 600);
      return new Promise(r => setTimeout(r, 1500));
    });

    // Replace lazy-loaded images: data-src → src
    await page.evaluate(() => {
      document.querySelectorAll('img[data-src], img[data-original], img[data-zoom]').forEach(img => {
        const src = img.getAttribute('data-zoom') || img.getAttribute('data-src') || img.getAttribute('data-original');
        if (src && !src.startsWith('data:')) img.src = src;
      });
    });

    await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));

    const html = await page.content();
    return parseHTML(html, url, hint);
  } finally {
    await page.close().catch(() => {});
  }
}

// ─── MAIN ROUTE ───────────────────────────────────────────────────────────────
app.get('/scrape', async (req, res) => {
  let url = String(req.query.url || '').trim();
  if (!url) return res.status(400).json({ error: 'URL requerida' });
  if (!url.startsWith('http')) url = 'https://' + url;

  console.log('\n🔍', url);
  let hint = null;

  try {
    // ── Site-specific fast-path APIs ──────────────────────────────────────────
    if (url.includes('mercadolibre')) {
      const d = await tryMercadoLibreAPI(url);
      if (d?.name) { console.log('✅ ML API:', d.name); return res.json({ ...d, url }); }
    }

    if (url.includes('zara.com')) {
      const d = await tryZaraAPI(url);
      if (d?.name) { console.log('✅ Zara API:', d.name); return res.json({ ...d, url }); }
      // fallthrough to puppeteer
    }

    if (url.includes('falabella.com')) {
      hint = await tryFalabellaAPI(url);
      if (hint?.name) { console.log('✅ Falabella API:', hint.name); return res.json({ ...hint, url }); }
      // hint may have {_cdnImage, _id} — used as fallback image
    }

    if (url.includes('paris.cl')) {
      const d = await tryParisAPI(url);
      if (d?.name) { console.log('✅ Paris API:', d.name); return res.json({ ...d, url }); }
    }

    if (url.includes('ripley.cl')) {
      const d = await tryRipleyAPI(url);
      if (d?.name) { console.log('✅ Ripley API:', d.name); return res.json({ ...d, url }); }
    }

    // ── Axios (fast, no browser) ──────────────────────────────────────────────
    let data = null;
    try {
      data = await scrapeAxios(url, hint);
      if (data?.name) console.log('✅ Axios:', data.name);
    } catch (e) {
      console.log('⚠️  Axios:', e.message);
    }

    // ── Puppeteer fallback ────────────────────────────────────────────────────
    if (!isGood(data)) {
      data = await scrapePuppeteer(url, hint);
    }

    if (!isGood(data)) {
      return res.status(422).json({
        error: 'No se pudo extraer información del producto. Asegúrate de pegar la URL de la página del producto específico (no de búsquedas o categorías).',
      });
    }

    console.log('✅', data.name, '| precio:', data.price, '| img:', !!data.image);
    return res.json({ ...data, url });

  } catch (err) {
    console.error('❌', err.message);
    return res.status(500).json({ error: `Error al analizar el producto: ${err.message}` });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));

// ─── START ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 GiftLoop Scraper → http://localhost:${PORT}`);
  console.log('   Soporta: MercadoLibre · Falabella · Paris · Ripley · Zara · Lippi · IKEA\n');
});
server.on('error', e => {
  if (e.code === 'EADDRINUSE') { console.log('⚠️  Puerto ocupado.'); process.exit(0); }
  else { console.error(e); process.exit(1); }
});
process.on('SIGINT', () => { if (browser) browser.close(); server.close(); process.exit(0); });
process.on('SIGTERM', () => { if (browser) browser.close(); server.close(); process.exit(0); });
