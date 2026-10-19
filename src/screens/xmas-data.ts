import { readUserData, writeUserData, storageKey } from '../lib/user-storage';
// Christmas section shared types and data

export type ChildProfile = {
  id: string;
  name: string;
  age: number;
  country: string;
  santaName: string;
  parentMessage?: string;
  interests: string[];
  exclusions: string[];
  maxGiftPrice: number;
  adultBudget: number;
  setupDone: boolean;
  letterSent: boolean;
  letterSentAt?: string;
};

export type XmasWish = {
  id: string;
  childId: string;
  productId?: string;
  name: string;
  price?: number;
  image?: string;
  store?: string;
  category?: string;
  isFavorite: boolean;
  isFree: boolean;
  freeText?: string;
  adultStatus: 'none' | 'selected' | 'reserved' | 'bought';
  reservedBy?: string;
};

export const INTERESTS = [
  { id: 'construccion', label: 'Construcción', emoji: '🧱' },
  { id: 'arte', label: 'Arte y manualidades', emoji: '🎨' },
  { id: 'ciencia', label: 'Ciencia', emoji: '🔬' },
  { id: 'dinosaurios', label: 'Dinosaurios', emoji: '🦕' },
  { id: 'animales', label: 'Animales', emoji: '🐾' },
  { id: 'deportes', label: 'Deportes', emoji: '⚽' },
  { id: 'libros', label: 'Libros', emoji: '📚' },
  { id: 'musica', label: 'Música', emoji: '🎵' },
  { id: 'vehiculos', label: 'Vehículos', emoji: '🚗' },
  { id: 'munecas', label: 'Muñecos y figuras', emoji: '🪆' },
  { id: 'juegos', label: 'Juegos de mesa', emoji: '🎲' },
  { id: 'tecnologia', label: 'Tecnología', emoji: '🎮' },
];

export const EXCLUSIONS = [
  { id: 'exc_tech', label: 'Tecnología y videojuegos' },
  { id: 'exc_small', label: 'Juguetes con piezas pequeñas' },
  { id: 'exc_battery', label: 'Pilas y baterías incluidas' },
  { id: 'exc_screen', label: 'Pantallas y dispositivos' },
];

export const XMAS_CATALOG: Array<{
  id: string; name: string; price: number; image: string;
  category: string; minAge: number; store: string;
}> = [
  { id: 'x1', name: 'Set LEGO City Policía', price: 24990, image: 'https://images.unsplash.com/photo-1559060017-445fb9b0007c?w=300&h=300&fit=crop', category: 'construccion', minAge: 6, store: 'Lego' },
  { id: 'x2', name: 'Dinosaurio T-Rex articulado', price: 18990, image: 'https://images.unsplash.com/photo-1565364887194-71fba5a5a89d?w=300&h=300&fit=crop', category: 'dinosaurios', minAge: 4, store: 'Hasbro' },
  { id: 'x3', name: 'Pelota de fútbol oficial', price: 12990, image: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=300&h=300&fit=crop', category: 'deportes', minAge: 3, store: 'Adidas' },
  { id: 'x4', name: 'Set de pinturas y lienzos', price: 15990, image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&h=300&fit=crop', category: 'arte', minAge: 5, store: 'Faber-Castell' },
  { id: 'x5', name: 'Kit dinosaurios excavación', price: 19990, image: 'https://images.unsplash.com/photo-1632784785887-1d6b2528cd15?w=300&h=300&fit=crop', category: 'dinosaurios', minAge: 6, store: 'National Geographic' },
  { id: 'x6', name: 'LEGO Dinos Stegosaurus', price: 27990, image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=300&h=300&fit=crop', category: 'construccion', minAge: 7, store: 'Lego' },
  { id: 'x7', name: 'Juego de mesa Jenga gigante', price: 21990, image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=300&h=300&fit=crop', category: 'juegos', minAge: 6, store: 'Hasbro' },
  { id: 'x8', name: 'Libro dinosaurios enciclopedia', price: 14990, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=300&fit=crop', category: 'libros', minAge: 5, store: 'Planeta' },
  { id: 'x9', name: 'Cancha portátil de fútbol', price: 29990, image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&h=300&fit=crop', category: 'deportes', minAge: 5, store: 'Nike' },
  { id: 'x10', name: 'Set constructor puente STEM', price: 22990, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop', category: 'construccion', minAge: 7, store: 'STEM Kids' },
  { id: 'x11', name: 'Figura Velociraptor XL', price: 16990, image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=300&h=300&fit=crop', category: 'dinosaurios', minAge: 4, store: 'Mattel' },
  { id: 'x12', name: 'Set acuarelas premium 36 colores', price: 11990, image: 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=300&h=300&fit=crop', category: 'arte', minAge: 6, store: 'Staedtler' },
];

// localStorage helpers (primary reads; Supabase syncs in background)
export function loadChildren(): ChildProfile[] {
  return readUserData('xmas_children', []);
}
export function saveChildren(c: ChildProfile[]) {
  writeUserData('xmas_children', c);
  writeUserData('pending_children', c);
  // Background sync to Supabase
  const userId = storageKey('').split(':')[1];
  if (userId) {
    import('../lib/xmas-db').then(({ dbSaveChildren }) => dbSaveChildren(userId, c)).catch(() => window.dispatchEvent(new Event('giftloop-sync-error')));
  }
}
export function loadWishes(childId: string): XmasWish[] {
  return readUserData(`xmas_wishes_${childId}`, []);
}
export function saveWishes(childId: string, w: XmasWish[]) {
  writeUserData(`xmas_wishes_${childId}`, w);
  writeUserData(`pending_wishes_${childId}`, w);
  // Background sync to Supabase
  const userId = storageKey('').split(':')[1];
  import('../lib/xmas-db').then(({ dbSaveAllWishes }) => dbSaveAllWishes(userId, childId, w))
    .catch(() => window.dispatchEvent(new Event('giftloop-sync-error')));
}

export const XMAS_RED = '#C0392B';
export const XMAS_GREEN = '#2D6A4F';
export const XMAS_GOLD = '#C9A227';
export const XMAS_LIGHT = '#FFF8F0';
export const XMAS_LIGHT_VAL = '#FFF8F0';

export function fmtCLP(n: number) {
  return `$${n.toLocaleString('es-CL')}`;
}
