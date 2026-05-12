export type StoreId =
  | 'falabella' | 'paris' | 'ripley' | 'zara'
  | 'mercadolibre' | 'lippi' | 'ikea'
  | 'sodimac' | 'easy' | 'pcfactory' | 'froens'
  | 'lider' | 'jumbo' | 'tottus' | 'tricot' | 'abc'
  | 'wildlama' | 'gnomo' | 'aliexpress' | 'hm' | 'adidas' | 'on'
  | 'unknown';

const STORE_PATTERNS: Array<{ pattern: RegExp; id: StoreId }> = [
  { pattern: /falabella\.com/i,      id: 'falabella' },
  { pattern: /paris\.cl/i,           id: 'paris' },
  { pattern: /ripley\.cl/i,          id: 'ripley' },
  { pattern: /zara\.com/i,           id: 'zara' },
  { pattern: /mercadolibre\./i,      id: 'mercadolibre' },
  { pattern: /lippi\.cl/i,           id: 'lippi' },
  { pattern: /ikea\.com/i,           id: 'ikea' },
  { pattern: /sodimac\.cl/i,         id: 'sodimac' },
  { pattern: /easy\.cl/i,            id: 'easy' },
  { pattern: /pcfactory\.cl/i,       id: 'pcfactory' },
  { pattern: /froens\.cl/i,          id: 'froens' },
  { pattern: /lider\.cl/i,           id: 'lider' },
  { pattern: /jumbo\.cl/i,           id: 'jumbo' },
  { pattern: /tottus\.cl/i,          id: 'tottus' },
  { pattern: /tricot\.cl/i,          id: 'tricot' },
  { pattern: /abc\.cl/i,             id: 'abc' },
  { pattern: /wildlama\.cl/i,         id: 'wildlama' },
  { pattern: /gnomo\.cl/i,           id: 'gnomo' },
  { pattern: /aliexpress\.com/i,     id: 'aliexpress' },
  { pattern: /hym\.cl/i,             id: 'hm' },
  { pattern: /\bhm\.com/i,           id: 'hm' },
  { pattern: /adidas\.(cl|com)/i,    id: 'adidas' },
  { pattern: /\bon\.cl/i,            id: 'on' },
  { pattern: /on-running\./i,        id: 'on' },
];

export function detectStore(url: string): StoreId {
  for (const { pattern, id } of STORE_PATTERNS) {
    if (pattern.test(url)) return id;
  }
  return 'unknown';
}

/** Extrae ID numérico/string de producto según patrones conocidos */
export function extractProductId(url: string, store: StoreId): string | null {
  switch (store) {
    case 'falabella':
      return url.match(/\/product\/(\d+)\//)?.[1] ?? null;

    case 'paris':
      return url.match(/-(\d{6,})\.html/)?.[1]
          ?? url.match(/\/product\/(\d+)/)?.[1]
          ?? null;

    case 'ripley':
      return url.match(/-(\d+)p(?:\?|\/|$)/)?.[1]
          ?? url.match(/-(\d+)p$/)?.[1]
          ?? null;

    case 'zara':
      return url.match(/-p(\d+)\.html/)?.[1] ?? null;

    case 'mercadolibre': {
      const prod = url.match(/\/p\/(MLC\d+)/i)?.[1];
      const item = url.match(/\/(MLC\d+)/i)?.[1];
      return prod ?? item ?? null;
    }

    case 'sodimac':
      return url.match(/\/product\/([A-Z0-9]+)\//i)?.[1]
          ?? url.match(/\/producto\/([A-Z0-9]+)\//i)?.[1]
          ?? null;

    case 'easy':
      return url.match(/\/product\/([A-Z0-9]+)\//i)?.[1]
          ?? url.match(/\/producto\/([A-Z0-9]+)\//i)?.[1]
          ?? null;

    case 'pcfactory':
      return url.match(/[?&]producto=(\d+)/)?.[1]
          ?? url.match(/\/producto\/(\d+)/)?.[1]
          ?? url.match(/-(\d{4,})\/?(?:\?|$)/)?.[1]
          ?? null;

    case 'froens':
      return url.match(/[?&]p=(\d+)/)?.[1] ?? null;

    case 'lider':
      return url.match(/\/product\/sku\/(\d+)/)?.[1]
          ?? url.match(/\/(\d{7,})\/[^/]+\/?$/)?.[1]
          ?? null;

    case 'jumbo': {
      const jMatch = url.match(/[/-](\d{5,})(?:\/p)?(?:\?|$|\/)/)?.[1];
      if (jMatch) return jMatch;
      // Last numeric segment
      const segs = url.replace(/\?.*$/, '').split('/').filter(Boolean);
      const last = segs[segs.length - 1];
      return /^\d{5,}$/.test(last) ? last : null;
    }

    case 'tottus':
      return url.match(/-(\d{6,})\.html/)?.[1]
          ?? url.match(/\/p\/(\d+)/)?.[1]
          ?? null;

    case 'aliexpress':
      return url.match(/\/item\/(\d+)/)?.[1] ?? null;

    // For the rest, rely on full HTML extraction
    default:
      return null;
  }
}
