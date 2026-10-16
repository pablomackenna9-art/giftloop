// Design spec data constants for the redesign

export type Friend = {
  id: string; name: string; username: string; avatar: string;
  cover?: string; bio?: string; daysUntil: number; birthday: string;
  location?: string; friendCount?: number;
  likes?: string[]; avoid?: string;
  sizeclothes?: string; sizeshoes?: string; colors?: string;
};

export type Wish = {
  id: string; name: string; price: number; store: string | null;
  note?: string; image: string; kind: 'product' | 'experience';
  status: 'free' | 'reserved_me' | 'bought_me' | 'reserved_other' | 'group';
  groupPct?: number;
};

export type GroupMember = {
  id: string; name: string; avatar: string;
  status: 'paid' | 'pending' | 'invited' | 'organizer';
};

// Unsplash image helpers
const PH = (id: string, w = 400, h = 400) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;

export const CAMILA: Friend = {
  id: 'camila', name: 'Camila Rojas', username: 'camirojas',
  avatar: PH('1494790108377-be9c29b29330', 100, 100),
  cover: PH('1506905925346-21bda4d32df4', 390, 190),
  bio: 'Diseñadora, cafetera y fan de subir cerros los sábados.',
  daysUntil: 6, birthday: '10-22',
  location: 'Providencia', friendCount: 148,
  likes: ['Montaña', 'Café de especialidad', 'Vinilos', 'Cerámica', 'Novelas chilenas', 'Plantas'],
  avoid: 'velas aromáticas, chocolates',
  sizeclothes: 'M', sizeshoes: '38', colors: 'Tierra',
};

export const FRIENDS_LIST: Friend[] = [
  CAMILA,
  { id: 'tomas', name: 'Tomás', username: 'tomasv', avatar: PH('1507003211169-0a1dd7228f2d', 100, 100), daysUntil: 12, birthday: '10-28' },
  { id: 'vale', name: 'Vale', username: 'vale', avatar: PH('1438761681033-6461ffad8d80', 100, 100), daysUntil: 19, birthday: '11-04' },
  { id: 'joaquin', name: 'Joaquín', username: 'joaco', avatar: PH('1472099645785-5658abf4ff4e', 100, 100), daysUntil: 30, birthday: '11-15' },
  { id: 'fernanda', name: 'Fernanda', username: 'fer', avatar: PH('1544005313-94ddf0286df2', 100, 100), daysUntil: 32, birthday: '11-17' },
  { id: 'ignacio', name: 'Ignacio', username: 'nacho', avatar: PH('1500648767791-00dcc994a43e', 100, 100), daysUntil: 60, birthday: '12-15' },
];

export const CAMILA_WISHES: Wish[] = [
  { id: 'w1', name: 'Audífonos inalámbricos con cancelación de ruido', price: 349990, store: 'Falabella', note: 'Negros. Son para trabajar tranquila en el café.', image: PH('1505740420928-5e560c06d30e', 400, 380), kind: 'product', status: 'group', groupPct: 60 },
  { id: 'w2', name: 'Cámara instantánea + 2 packs de película', price: 89990, store: 'Ripley', note: 'Con película extra si se puede.', image: PH('1526170375885-4d8ecf77b99f', 400, 170), kind: 'product', status: 'reserved_other' },
  { id: 'w3', name: 'Zapatillas urbanas rojas', price: 109990, store: 'Nike.cl', note: 'Talla 38. Rojas, no blancas.', image: PH('1542291026-7eec264c27ff', 400, 170), kind: 'product', status: 'free' },
  { id: 'w4', name: 'Perfume floral 50 ml', price: 64990, store: 'Paris', note: 'Algo fresco, nada muy dulce.', image: PH('1541643600914-78b084683702', 400, 170), kind: 'product', status: 'free' },
  { id: 'w5', name: 'Día de trekking guiado en el Cajón del Maipo', price: 45000, store: null, note: 'Cualquier sábado de noviembre. ¡Vamos juntos!', image: PH('1464822759023-fed622ff2c3b', 400, 170), kind: 'experience', status: 'free' },
  { id: 'w6', name: 'Pack de 3 novelas chilenas', price: 19990, store: 'Buscalibre', note: 'Le encanta Alejandro Zambra.', image: PH('1512820790803-83ca734da794', 400, 170), kind: 'product', status: 'free' },
];

export const GROUP_MEMBERS: GroupMember[] = [
  { id: 'tomas', name: 'Tomás', avatar: PH('1507003211169-0a1dd7228f2d', 42, 42), status: 'organizer' },
  { id: 'vale', name: 'Valentina', avatar: PH('1438761681033-6461ffad8d80', 42, 42), status: 'paid' },
  { id: 'fernanda', name: 'Fernanda', avatar: PH('1544005313-94ddf0286df2', 42, 42), status: 'paid' },
  { id: 'ignacio', name: 'Ignacio', avatar: PH('1500648767791-00dcc994a43e', 42, 42), status: 'pending' },
  { id: 'sofia', name: 'Tú', avatar: PH('1494790108377-be9c29b29330', 42, 42), status: 'invited' },
];

export const EXPLORE_CATALOG = [
  { id: 'e1', name: 'Kit de café de especialidad', price: 32990, store: 'Mercado Libre', image: PH('1495474472287-4d71bcdd2085', 300, 160) },
  { id: 'e2', name: 'Monstera en macetero', price: 24990, store: 'Plantitas.cl', image: PH('1416879595882-3373a0480b5b', 300, 160) },
  { id: 'e3', name: 'Lentes de sol polarizados', price: 59990, store: 'Ripley', image: PH('1511499767150-a7a1371514e5', 300, 160) },
  { id: 'e4', name: 'Pack de novelas', price: 19990, store: 'Buscalibre', image: PH('1512820790803-83ca734da794', 300, 160) },
  { id: 'e5', name: 'Chaqueta impermeable', price: 89990, store: 'Decathlon', image: PH('1539109136881-3be0616acf4b', 300, 160) },
  { id: 'e6', name: 'Auriculares bluetooth', price: 49990, store: 'Falabella', image: PH('1505740420928-5e560c06d30e', 300, 160) },
  { id: 'e7', name: 'Taller de cerámica', price: 35000, store: null, image: PH('1565193566173-7a0ee3dbe261', 300, 160) },
  { id: 'e8', name: 'Set de pinturas acuarela', price: 28990, store: 'Sodimac', image: PH('1513364776144-702e23f2a5a8', 300, 160) },
];

export const MY_LISTS = [
  { id: 'cumple30', name: 'Cumple 30', cover: PH('1530103862676-de8c9debad1d', 148, 178), visibility: 'link' as const, count: 4 },
  { id: 'navidad', name: 'Navidad', cover: PH('1512389142860-9c449e58a543', 148, 178), visibility: 'friends' as const, count: 6 },
  { id: 'casanueva', name: 'Casa nueva', cover: PH('1556909114-f6e7ad7d3136', 148, 178), visibility: 'private' as const, count: 3 },
];

export const MY_WISHES = [
  { id: 'mw1', name: 'Cámara analógica Olympus', price: 159990, store: 'Mercado Libre', image: PH('1526170375885-4d8ecf77b99f', 64, 64), list: 'Cumple 30', kind: 'product' as const },
  { id: 'mw2', name: 'Clase de cerámica en Barrio Italia', price: 35000, store: null, image: PH('1565193566173-7a0ee3dbe261', 64, 64), list: 'Cumple 30', kind: 'experience' as const },
  { id: 'mw3', name: 'Libro Nona Fernández', price: 14990, store: 'Buscalibre', image: PH('1512820790803-83ca734da794', 64, 64), list: 'Navidad', kind: 'product' as const },
];

export const ACTIVITY_PAYMENTS = [
  { id: 'p1', title: 'Aporte a regalo grupal · Camila', subtitle: 'Mercado Pago · demo', status: 'ok' as const, amount: 40000 },
  { id: 'p2', title: 'Aporte a regalo grupal · Vale', subtitle: 'Tarjeta · demo', status: 'pending' as const, amount: 20000 },
  { id: 'p3', title: 'Intento anterior · Vale', subtitle: 'Tarjeta · demo', status: 'fail' as const, amount: 20000 },
];

export const MESSAGES = [
  { id: 'group_camila', name: 'Regalo Camila · privado', last: 'Tomás: ¡Ya aportaron 3! Falta poco 🎉', time: '10:42', unread: 2, isGroup: true, image: PH('1505740420928-5e560c06d30e', 52, 52) },
  { id: 'camila', name: 'Camila Rojas', last: 'Gracias por el mensaje 😊', time: 'Ayer', unread: 0, avatar: PH('1494790108377-be9c29b29330', 52, 52) },
  { id: 'tomas', name: 'Tomás', last: '¿Qué vas a regalar?', time: 'Mar', unread: 1, avatar: PH('1507003211169-0a1dd7228f2d', 52, 52) },
];

export const FRIEND_REQUESTS = [
  { id: 'fr1', name: 'Martina López', username: 'martinal', avatar: PH('1487412720507-e7ab37603c6f', 44, 44), mutual: 3 },
  { id: 'fr2', name: 'Diego Soto', username: 'diegosoto', avatar: PH('1539571696357-aaad8f8a5d3f', 44, 44), mutual: 1 },
];

export const SUGGESTED_FRIENDS = [
  { id: 'sf1', name: 'Pilar Muñoz', username: 'pilarm', avatar: PH('1488426756544-f01ad0be432c', 44, 44), mutual: 5 },
  { id: 'sf2', name: 'Matías Torres', username: 'matiast', avatar: PH('1500648767791-00dcc994a43e', 44, 44), mutual: 2 },
  { id: 'sf3', name: 'Javiera Pérez', username: 'javi', avatar: PH('1494790108377-be9c29b29330', 44, 44), mutual: 4 },
];
