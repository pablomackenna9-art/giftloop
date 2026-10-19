// Multi-store catalog, purchase requests, campaigns — GiftLoop Christmas

// ── TYPES ─────────────────────────────────────────────────────────────────────

export type Store = {
  id: string;
  name: string;
  legalName: string;
  logoEmoji: string;
  contactName: string;
  contactEmail: string;
  website: string;
  deliveryZones: string[];
  deliveryConditions: string;
  returnsPolicy: string;
  responseTime: string;
  status: 'active' | 'paused';
};

export type ProductVariant = {
  id: string;
  sku?: string;
  label: string;
  price?: number;
  stock?: number;
};

export type StoreProduct = {
  id: string;
  storeId: string;
  sku: string;
  brand: string;
  name: string;
  description: string;
  images: string[];
  category: string;
  subcategory?: string;
  minAge?: number;
  maxAge?: number;
  safetyWarnings?: string[];
  interests: string[];
  price: number;
  currency: 'CLP';
  prevPrice?: number;
  stock: number | 'unlimited' | 'unknown';
  variants?: ProductVariant[];
  url?: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'paused';
};

export type RequestStatus =
  | 'draft' | 'scheduled' | 'sent' | 'in_review'
  | 'proposal_ready' | 'changes_requested' | 'pending_payment'
  | 'paid' | 'in_preparation' | 'dispatched' | 'delivered'
  | 'rejected' | 'cancelled' | 'proposal_expired';

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  draft: 'Borrador',
  scheduled: 'Programada para envío',
  sent: 'Enviada a tienda',
  in_review: 'En revisión por tienda',
  proposal_ready: 'Propuesta disponible',
  changes_requested: 'Cambios solicitados',
  pending_payment: 'Pendiente de pago',
  paid: 'Pagada ✓',
  in_preparation: 'En preparación',
  dispatched: 'Despachada',
  delivered: 'Entregada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  proposal_expired: 'Propuesta vencida',
};

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  draft: '#8A7D90',
  scheduled: '#C9A227',
  sent: '#2D6A4F',
  in_review: '#2D6A4F',
  proposal_ready: '#C0392B',
  changes_requested: '#C9A227',
  pending_payment: '#C9A227',
  paid: '#557A65',
  in_preparation: '#557A65',
  dispatched: '#2D6A4F',
  delivered: '#557A65',
  rejected: '#C0392B',
  cancelled: '#8A7D90',
  proposal_expired: '#8A7D90',
};

export type RequestItem = {
  productId: string;
  productName: string;
  variantId?: string;
  variantLabel?: string;
  qty: number;
  knownPrice: number;
  priceDate: string;
  image?: string;
};

export type ProposalItem = {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  available: boolean;
  unavailableReason?: string;
};

export type StoreProposal = {
  confirmedItems: ProposalItem[];
  rejectedItems: ProposalItem[];
  shipping: number;
  subtotal: number;
  total: number;
  deliveryRange: string;
  paymentDeadline: string;
  paymentLink: string;
  proposalExpiry: string;
  respondedAt: string;
  respondedBy: string;
  trackingCode?: string;
  trackingUrl?: string;
};

export type StatusEvent = {
  status: RequestStatus;
  by: 'adult' | 'store' | 'admin' | 'system';
  at: string;
  note?: string;
};

export type PurchaseRequest = {
  id: string;
  childId: string;
  childName: string;
  storeId: string;
  items: RequestItem[];
  status: RequestStatus;
  createdAt: string;
  scheduledSendAt?: string;
  sentAt?: string;
  proposal?: StoreProposal;
  history: StatusEvent[];
};

export type CampaignLocation = 'adult_panel_featured' | 'adult_explore' | 'adult_brand_banner';

export type Campaign = {
  id: string;
  name: string;
  storeId: string;
  products: string[];
  locations: CampaignLocation[];
  categories: string[];
  startDate: string;
  endDate: string;
  priority: number;
  status: 'draft' | 'scheduled' | 'active' | 'ended';
  commercialAmount: number;
  stats: {
    impressions: number;
    clicks: number;
    selected: number;
    requestsSent: number;
    paymentConfirmed: number;
  };
};

// ── DEMO STORES ───────────────────────────────────────────────────────────────

export const DEMO_STORES: Store[] = [
  {
    id: 'store-juguetemax',
    name: 'JugueteMax',
    legalName: 'Juguetes y Más SpA',
    logoEmoji: '🧸',
    contactName: 'Rodrigo Vega',
    contactEmail: 'ventas@juguetemax.cl',
    website: 'juguetemax.cl',
    deliveryZones: ['Región Metropolitana', 'Valparaíso', 'Biobío', 'Todo Chile (courier)'],
    deliveryConditions: 'Despacho gratis sobre $49.990. Retiro en tienda sin costo.',
    returnsPolicy: 'Cambios y devoluciones hasta 30 días desde la compra con boleta.',
    responseTime: '24 horas hábiles',
    status: 'active',
  },
  {
    id: 'store-lego',
    name: 'LEGO Store Chile',
    legalName: 'Bloques y Construcción Ltda.',
    logoEmoji: '🧱',
    contactName: 'Carolina Fuentes',
    contactEmail: 'hola@legochile.cl',
    website: 'legochile.cl',
    deliveryZones: ['Región Metropolitana', 'Todo Chile (Starken)'],
    deliveryConditions: 'Despacho a domicilio $3.990 RM, $5.990 regiones. Gratis sobre $69.990.',
    returnsPolicy: 'Cambios en 15 días, producto sin abrir. Devoluciones por defecto de fábrica.',
    responseTime: '48 horas hábiles',
    status: 'active',
  },
  {
    id: 'store-explora',
    name: 'Exploradores',
    legalName: 'Exploradores Educativos SA',
    logoEmoji: '🔬',
    contactName: 'Daniela Méndez',
    contactEmail: 'pedidos@exploradores.cl',
    website: 'exploradores.cl',
    deliveryZones: ['Todo Chile'],
    deliveryConditions: 'Despacho $4.990 a todo Chile. Gratis sobre $59.990.',
    returnsPolicy: 'Devolución hasta 20 días con empaque original.',
    responseTime: '24 horas hábiles',
    status: 'active',
  },
];

// ── DEMO PRODUCT CATALOG ───────────────────────────────────────────────────────

export const STORE_CATALOG: StoreProduct[] = [
  // JugueteMax
  {
    id: 'sp-jm-01', storeId: 'store-juguetemax', sku: 'JM-LEGO-CITY-001',
    brand: 'LEGO', name: 'Set LEGO City Policía', description: 'Set de construcción con comisaría, patrulla y 4 figuras. 240 piezas.',
    images: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=300&h=300&fit=crop&auto=format'],
    category: 'construccion', subcategory: 'LEGO', minAge: 6, maxAge: 12,
    interests: ['construccion'],
    price: 24990, currency: 'CLP', prevPrice: 29990, stock: 15,
    updatedAt: '2026-10-10', status: 'published',
  },
  {
    id: 'sp-jm-02', storeId: 'store-juguetemax', sku: 'JM-HASBRO-TREX-002',
    brand: 'Hasbro', name: 'Dinosaurio T-Rex articulado', description: 'Figura de T-Rex con articulaciones y rugido de sonido. 35 cm de largo.',
    images: ['https://images.unsplash.com/photo-1602526429747-ac387a91d43b?w=300&h=300&fit=crop&auto=format'],
    category: 'dinosaurios', subcategory: 'Figuras', minAge: 4, maxAge: 10,
    safetyWarnings: ['Piezas pequeñas para mayores de 3 años'],
    interests: ['dinosaurios', 'animales'],
    price: 18990, currency: 'CLP', stock: 8,
    updatedAt: '2026-10-12', status: 'published',
  },
  {
    id: 'sp-jm-03', storeId: 'store-juguetemax', sku: 'JM-ADI-FTBL-003',
    brand: 'Adidas', name: 'Pelota de fútbol oficial N°4', description: 'Pelota de fútbol cuero sintético, costura reforzada.',
    images: ['https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=300&h=300&fit=crop&auto=format'],
    category: 'deportes', minAge: 3,
    interests: ['deportes'],
    price: 12990, currency: 'CLP', stock: 25,
    variants: [
      { id: 'v1', label: 'Talla 3', price: 10990, stock: 10 },
      { id: 'v2', label: 'Talla 4', price: 12990, stock: 10 },
      { id: 'v3', label: 'Talla 5', price: 14990, stock: 5 },
    ],
    updatedAt: '2026-10-11', status: 'published',
  },
  {
    id: 'sp-jm-04', storeId: 'store-juguetemax', sku: 'JM-FC-PINTURAS-004',
    brand: 'Faber-Castell', name: 'Set de pinturas y lienzos 12pcs', description: 'Kit completo con 6 pinceles, 12 tubos acrílicos y 2 lienzos.',
    images: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&h=300&fit=crop&auto=format'],
    category: 'arte', minAge: 5,
    interests: ['arte'],
    price: 15990, currency: 'CLP', stock: 12,
    updatedAt: '2026-10-09', status: 'published',
  },
  {
    id: 'sp-jm-05', storeId: 'store-juguetemax', sku: 'JM-HAS-JENGA-005',
    brand: 'Hasbro', name: 'Jenga Gigante de madera', description: 'Jenga de madera maciza, piezas 3x más grandes que el original.',
    images: ['https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=300&h=300&fit=crop&auto=format'],
    category: 'juegos', minAge: 6,
    interests: ['juegos'],
    price: 21990, currency: 'CLP', stock: 7,
    updatedAt: '2026-10-13', status: 'published',
  },
  {
    id: 'sp-jm-06', storeId: 'store-juguetemax', sku: 'JM-ST-ACRYL-006',
    brand: 'Staedtler', name: 'Set acuarelas premium 36 colores', description: '36 colores en caja metálica, con pincel incluido y bloc A4.',
    images: ['https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=300&h=300&fit=crop&auto=format'],
    category: 'arte', minAge: 6,
    interests: ['arte'],
    price: 11990, currency: 'CLP', stock: 20,
    updatedAt: '2026-10-14', status: 'published',
  },

  // LEGO Store
  {
    id: 'sp-lg-01', storeId: 'store-lego', sku: 'LG-STEGO-001',
    brand: 'LEGO', name: 'LEGO Dinos Stegosaurus', description: 'Construye un Stegosaurus articulado. 163 piezas. Serie Icons.',
    images: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=300&h=300&fit=crop&auto=format'],
    category: 'construccion', subcategory: 'LEGO Dinos', minAge: 7, maxAge: 14,
    interests: ['construccion', 'dinosaurios'],
    price: 27990, currency: 'CLP', stock: 5,
    updatedAt: '2026-10-10', status: 'published',
  },
  {
    id: 'sp-lg-02', storeId: 'store-lego', sku: 'LG-BRIDGE-002',
    brand: 'LEGO', name: 'LEGO Technic Puente STEM', description: 'Set STEM con mecanismos de grúa. 412 piezas. Incluye instrucciones digitales.',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop&auto=format'],
    category: 'construccion', subcategory: 'LEGO Technic', minAge: 8, maxAge: 14,
    interests: ['construccion', 'ciencia'],
    price: 34990, currency: 'CLP', stock: 3,
    updatedAt: '2026-10-08', status: 'published',
  },
  {
    id: 'sp-lg-03', storeId: 'store-lego', sku: 'LG-CITY2-003',
    brand: 'LEGO', name: 'LEGO City Bomberos', description: 'Estación de bomberos con camión, helicóptero y 5 figuras. 380 piezas.',
    images: ['https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=300&h=300&fit=crop&auto=format'],
    category: 'construccion', subcategory: 'LEGO City', minAge: 7, maxAge: 12,
    interests: ['construccion'],
    price: 44990, currency: 'CLP', prevPrice: 49990, stock: 4,
    updatedAt: '2026-10-12', status: 'published',
  },

  // Exploradores
  {
    id: 'sp-ex-01', storeId: 'store-explora', sku: 'EX-EXCAV-001',
    brand: 'National Geographic', name: 'Kit dinosaurios excavación', description: 'Excava y descubre 3 réplicas de fósiles. Incluye cincel y guantes.',
    images: ['https://images.unsplash.com/photo-1632784785887-1d6b2528cd15?w=300&h=300&fit=crop&auto=format'],
    category: 'dinosaurios', subcategory: 'Kits de excavación', minAge: 6, maxAge: 12,
    interests: ['dinosaurios', 'ciencia'],
    price: 19990, currency: 'CLP', stock: 10,
    updatedAt: '2026-10-11', status: 'published',
  },
  {
    id: 'sp-ex-02', storeId: 'store-explora', sku: 'EX-ENCICLODINO-002',
    brand: 'Planeta', name: 'Enciclopedia de Dinosaurios Ilustrada', description: 'Más de 300 páginas, 200 dinosaurios ilustrados con datos científicos actualizados.',
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=300&fit=crop&auto=format'],
    category: 'libros', subcategory: 'Enciclopedias', minAge: 5,
    interests: ['dinosaurios', 'libros'],
    price: 14990, currency: 'CLP', stock: 18,
    updatedAt: '2026-10-13', status: 'published',
  },
  {
    id: 'sp-ex-03', storeId: 'store-explora', sku: 'EX-VELOCI-003',
    brand: 'Mattel', name: 'Figura Velociraptor XL 45cm', description: 'Figura Velociraptor articulada de 45cm con texturas realistas y mandíbula articulada.',
    images: ['https://images.unsplash.com/photo-1604076913837-52ab5629fde9?w=300&h=300&fit=crop&auto=format'],
    category: 'dinosaurios', subcategory: 'Figuras XL', minAge: 4, maxAge: 10,
    interests: ['dinosaurios', 'animales'],
    price: 16990, currency: 'CLP', stock: 6,
    updatedAt: '2026-10-10', status: 'published',
  },
  {
    id: 'sp-ex-04', storeId: 'store-explora', sku: 'EX-QUIM-004',
    brand: 'Science4You', name: 'Kit Química para Jóvenes Científicos', description: 'Laboratorio de química con 50 experimentos seguros para niños. Incluye bata y gafas.',
    images: ['https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=300&h=300&fit=crop&auto=format'],
    category: 'ciencia', subcategory: 'Laboratorio', minAge: 8, maxAge: 14,
    safetyWarnings: ['Usar con supervisión adulta'],
    interests: ['ciencia'],
    price: 23990, currency: 'CLP', stock: 8,
    updatedAt: '2026-10-12', status: 'published',
  },
];

// ── DEMO PURCHASE REQUESTS ─────────────────────────────────────────────────────

export const DEMO_REQUESTS: PurchaseRequest[] = [
  {
    id: 'req-001',
    childId: 'demo-child',
    childName: 'Martín',
    storeId: 'store-juguetemax',
    items: [
      { productId: 'sp-jm-01', productName: 'Set LEGO City Policía', qty: 1, knownPrice: 24990, priceDate: '2026-10-14', image: 'https://images.unsplash.com/photo-1559060017-445fb9b0007c?w=300&h=300&fit=crop' },
      { productId: 'sp-jm-04', productName: 'Set de pinturas y lienzos 12pcs', qty: 1, knownPrice: 15990, priceDate: '2026-10-14', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&h=300&fit=crop' },
    ],
    status: 'proposal_ready',
    createdAt: '2026-10-14T09:00:00',
    scheduledSendAt: '2026-10-14T20:00:00',
    sentAt: '2026-10-14T20:00:00',
    proposal: {
      confirmedItems: [
        { productId: 'sp-jm-01', productName: 'Set LEGO City Policía', qty: 1, unitPrice: 24990, available: true },
        { productId: 'sp-jm-04', productName: 'Set de pinturas y lienzos 12pcs', qty: 1, unitPrice: 15990, available: true },
      ],
      rejectedItems: [],
      shipping: 0,
      subtotal: 40980,
      total: 40980,
      deliveryRange: '18 al 21 de diciembre',
      paymentDeadline: '10 de diciembre',
      paymentLink: 'https://juguetemax.cl/pago/demo-001',
      proposalExpiry: '2026-11-20T23:59:00',
      respondedAt: '2026-10-15T10:30:00',
      respondedBy: 'Rodrigo Vega',
    },
    history: [
      { status: 'draft', by: 'adult', at: '2026-10-14T09:00:00' },
      { status: 'scheduled', by: 'adult', at: '2026-10-14T09:10:00' },
      { status: 'sent', by: 'system', at: '2026-10-14T20:00:00', note: 'Lote diario 20:00' },
      { status: 'in_review', by: 'store', at: '2026-10-14T21:30:00' },
      { status: 'proposal_ready', by: 'store', at: '2026-10-15T10:30:00' },
    ],
  },
  {
    id: 'req-002',
    childId: 'demo-child',
    childName: 'Martín',
    storeId: 'store-lego',
    items: [
      { productId: 'sp-lg-01', productName: 'LEGO Dinos Stegosaurus', qty: 1, knownPrice: 27990, priceDate: '2026-10-14', image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=300&h=300&fit=crop' },
    ],
    status: 'in_review',
    createdAt: '2026-10-14T09:05:00',
    scheduledSendAt: '2026-10-14T20:00:00',
    sentAt: '2026-10-14T20:00:00',
    history: [
      { status: 'draft', by: 'adult', at: '2026-10-14T09:05:00' },
      { status: 'scheduled', by: 'adult', at: '2026-10-14T09:15:00' },
      { status: 'sent', by: 'system', at: '2026-10-14T20:00:00' },
      { status: 'in_review', by: 'store', at: '2026-10-15T08:00:00' },
    ],
  },
  {
    id: 'req-003',
    childId: 'demo-child',
    childName: 'Martín',
    storeId: 'store-explora',
    items: [
      { productId: 'sp-ex-01', productName: 'Kit dinosaurios excavación', qty: 1, knownPrice: 19990, priceDate: '2026-10-15', image: 'https://images.unsplash.com/photo-1632784785887-1d6b2528cd15?w=300&h=300&fit=crop' },
      { productId: 'sp-ex-02', productName: 'Enciclopedia de Dinosaurios', qty: 1, knownPrice: 14990, priceDate: '2026-10-15', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=300&fit=crop' },
    ],
    status: 'draft',
    createdAt: '2026-10-15T11:00:00',
    history: [
      { status: 'draft', by: 'adult', at: '2026-10-15T11:00:00' },
    ],
  },
];

// ── DEMO CAMPAIGNS ─────────────────────────────────────────────────────────────

export const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-001',
    name: 'Navidad JugueteMax 2026',
    storeId: 'store-juguetemax',
    products: ['sp-jm-01', 'sp-jm-02', 'sp-jm-05'],
    locations: ['adult_panel_featured', 'adult_explore'],
    categories: ['construccion', 'dinosaurios', 'juegos'],
    startDate: '2026-12-01',
    endDate: '2026-12-24',
    priority: 1,
    status: 'active',
    commercialAmount: 350000,
    stats: { impressions: 0, clicks: 0, selected: 0, requestsSent: 0, paymentConfirmed: 0 },
  },
  {
    id: 'camp-002',
    name: 'Banner LEGO Temporada',
    storeId: 'store-lego',
    products: ['sp-lg-01', 'sp-lg-03'],
    locations: ['adult_brand_banner'],
    categories: ['construccion'],
    startDate: '2026-11-15',
    endDate: '2026-12-31',
    priority: 2,
    status: 'active',
    commercialAmount: 500000,
    stats: { impressions: 1240, clicks: 87, selected: 23, requestsSent: 8, paymentConfirmed: 3 },
  },
];

// ── LOCALSTORAGE HELPERS ───────────────────────────────────────────────────────

export function loadStores(): Store[] {
  try { return JSON.parse(localStorage.getItem('xmas_stores') ?? 'null') ?? DEMO_STORES; } catch { return DEMO_STORES; }
}
export function saveStores(s: Store[]) {
  localStorage.setItem('xmas_stores', JSON.stringify(s));
}

export function loadProducts(): StoreProduct[] {
  try { return JSON.parse(localStorage.getItem('xmas_products') ?? 'null') ?? STORE_CATALOG; } catch { return STORE_CATALOG; }
}
export function saveProducts(p: StoreProduct[]) {
  localStorage.setItem('xmas_products', JSON.stringify(p));
}

export function loadRequests(): PurchaseRequest[] {
  try { return JSON.parse(localStorage.getItem('xmas_requests') ?? 'null') ?? DEMO_REQUESTS; } catch { return DEMO_REQUESTS; }
}
export function saveRequests(r: PurchaseRequest[]) {
  localStorage.setItem('xmas_requests', JSON.stringify(r));
}

export function loadCampaigns(): Campaign[] {
  try { return JSON.parse(localStorage.getItem('xmas_campaigns') ?? 'null') ?? DEMO_CAMPAIGNS; } catch { return DEMO_CAMPAIGNS; }
}
export function saveCampaigns(c: Campaign[]) {
  localStorage.setItem('xmas_campaigns', JSON.stringify(c));
}

export function getStoreName(storeId: string, stores: Store[]) {
  return stores.find(s => s.id === storeId)?.name ?? storeId;
}
