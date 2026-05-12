import type { User, Product, Event, FeedItem, Conversation, Brand, WalletContribution, GroupFund } from './types';

// ─── CURRENT USER ───────────────────────────────────────────────────────────
export const ME: User = {
  id: 'me',
  name: 'Pablo',
  lastName: 'Mackenna',
  avatar: 'https://i.pravatar.cc/150?img=52',
  bio: 'Amante de la tecnología, el vino y los viajes 🍷✈️💻',
  birthday: '08-15',
  following: false,
  followersCount: 120,
  friendsCount: 50,
  listsCount: 3,
};

// ─── FRIENDS (150) ──────────────────────────────────────────────────────────
const NAMES = [
  ['Sebastián', 'García'], ['Valentina', 'López'], ['Camila', 'Martínez'],
  ['Joaquín', 'Fernández'], ['Isidora', 'González'], ['Matías', 'Rojas'],
  ['Florencia', 'Díaz'], ['Nicolás', 'Muñoz'], ['Javiera', 'Pérez'],
  ['Tomás', 'Torres'], ['Amanda', 'Flores'], ['Ignacio', 'Ramírez'],
  ['Constanza', 'Castro'], ['Felipe', 'Vargas'], ['Sofía', 'Morales'],
  ['Alejandro', 'Ortiz'], ['Daniela', 'Silva'], ['Diego', 'Reyes'],
  ['Antonia', 'Ramos'], ['Rodrigo', 'Gómez'], ['Pilar', 'Herrera'],
  ['Andrés', 'Medina'], ['Catalina', 'Ruiz'], ['Cristóbal', 'Navarro'],
  ['Renata', 'Ríos'], ['Francisco', 'Gutiérrez'], ['Francisca', 'Molina'],
  ['Emilio', 'Arias'], ['Gabriela', 'Fuentes'], ['Martín', 'Vega'],
  ['Fernanda', 'Cortés'], ['Pablo', 'Romero'], ['Agustina', 'Figueroa'],
  ['Carlos', 'Contreras'], ['Trinidad', 'Espinoza'], ['Eduardo', 'Mora'],
  ['Bárbara', 'Alvarado'], ['Ricardo', 'Pizarro'], ['Lucía', 'Soto'],
  ['Roberto', 'Santander'], ['Paulina', 'Jara'], ['Gabriel', 'Lagos'],
  ['Tamara', 'Iturra'], ['Patricio', 'Oñate'], ['Pía', 'Fuenzalida'],
  ['Hernán', 'Bravo'], ['Marcela', 'Salinas'], ['Andrés', 'Acuña'],
  ['Lorena', 'Sepúlveda'], ['Hugo', 'Villalobos'],
  ['Isabel', 'Cárdenas'], ['Fernando', 'Escobar'], ['Vanessa', 'Mena'],
  ['Gustavo', 'Poblete'], ['Laura', 'Uribe'], ['Jorge', 'Quezada'],
  ['Verónica', 'Peña'], ['Alonso', 'Correa'], ['Macarena', 'Leiva'],
  ['Bruno', 'Herrera'], ['María José', 'Montoya'], ['Esteban', 'Carrasco'],
  ['Rocío', 'Araya'], ['Claudio', 'Valenzuela'], ['Paula', 'Fariña'],
  ['Mauricio', 'Ponce'], ['Carolina', 'Hinojosa'], ['Víctor', 'Sandoval'],
  ['Soledad', 'Miranda'], ['Leonardo', 'Bustamante'], ['Ximena', 'Orellana'],
  ['Javier', 'Godoy'], ['Andrea', 'Cerda'], ['Marco', 'Olguín'],
  ['Natalia', 'Zamora'], ['Luis', 'Vera'], ['Patricia', 'Tapia'],
  ['Sergio', 'Moya'], ['Alejandra', 'Cifuentes'], ['Álvaro', 'Arenas'],
  ['Cecilia', 'Henríquez'], ['Daniel', 'Espejo'], ['Beatriz', 'Troncoso'],
  ['Fabián', 'Garrido'], ['Karina', 'Maturana'], ['Cristián', 'Lara'],
  ['Sandra', 'Núñez'], ['Maximiliano', 'Ibarra'], ['Claudia', 'Arriagada'],
  ['Marcelo', 'Ferreira'], ['Gloria', 'Palacios'], ['Héctor', 'Riquelme'],
  ['Mónica', 'Carrillo'], ['Omar', 'Jiménez'], ['Irene', 'Durán'],
  ['René', 'Astudillo'], ['Verónica', 'Barrera'], ['Cristina', 'Benítez'],
  ['Manuel', 'Cabrera'], ['Ana María', 'Cornejo'], ['Rubén', 'Dávila'],
  ['Elisa', 'Espinosa'], ['Felipe', 'Gajardo'], ['Gracia', 'Huerta'],
  ['Iván', 'Inzunza'], ['Julia', 'Jorquera'], ['Kevin', 'Klenner'],
  ['Loreto', 'Lazcano'], ['Miguel', 'Mellado'], ['Nadia', 'Neira'],
  ['Octavio', 'Ojeda'], ['Priscila', 'Parra'], ['Quentin', 'Quiroga'],
  ['Rebeca', 'Roca'], ['Samuel', 'Salas'], ['Tatiana', 'Tagle'],
  ['Ulises', 'Ugarte'], ['Virginia', 'Vilches'], ['Walter', 'Walton'],
  ['Ximena', 'Ximénez'], ['Yolanda', 'Yáñez'], ['Zaida', 'Zapata'],
  ['Abel', 'Aburto'], ['Berta', 'Bazán'], ['César', 'Céspedes'],
  ['Diana', 'Del Río'], ['Ernesto', 'Encina'], ['Fresia', 'Figueroa'],
  ['Gonzalo', 'Gallardo'], ['Hilda', 'Henríquez'], ['Inés', 'Igualt'],
  ['Jocelyn', 'Jaramillo'], ['Karla', 'Kast'], ['Liliana', 'Lillo'],
  ['Mario', 'Mansilla'], ['Nora', 'Navarrete'], ['Osvaldo', 'Orrego'],
  ['Paulette', 'Palominos'], ['Quintín', 'Quijada'], ['Rosario', 'Riquelme'],
  ['Salvador', 'Salvo'], ['Teresa', 'Toro'], ['Ursula', 'Urrutia'],
];

const BIRTHDAYS = [
  '04-07', '04-10', '04-15', '04-18', '04-22', '04-28', '05-02',
  '05-10', '05-20', '05-30', '06-05', '06-15', '06-25', '07-04',
  '07-14', '07-24', '08-03', '08-13', '08-23', '09-01', '09-11',
  '09-21', '10-01', '10-11', '10-21', '11-01', '11-11', '11-21',
  '12-01', '12-11', '12-25', '01-05', '01-15', '01-25', '02-04',
  '02-14', '02-24', '03-06', '03-16', '03-26',
];

export const FRIENDS: User[] = NAMES.map(([name, lastName], i) => ({
  id: `friend_${i + 1}`,
  name,
  lastName,
  avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
  bio: [
    'Amante de los viajes ✈️', 'Foodie y chef amateur 🍕', 'Runner de fin de semana 🏃',
    'Cinéfilo empedernido 🎬', 'Amante de la naturaleza 🌿', 'Gamer y tech lover 🎮',
    'Yogui y meditador 🧘', 'Fotógrafo aficionado 📷', 'Lector voraz 📚',
    'Músico y compositor 🎸',
  ][i % 10],
  birthday: BIRTHDAYS[i % BIRTHDAYS.length],
  following: i < 30,
  followersCount: Math.floor(Math.random() * 500) + 50,
  friendsCount: Math.floor(Math.random() * 100) + 10,
  listsCount: Math.floor(Math.random() * 5) + 1,
}));

// ─── PRODUCTS (shared pool) ──────────────────────────────────────────────────
export const SAMSUNG_PRODUCTS: Product[] = [
  { id: 'sam1', name: 'Galaxy S24 Ultra 512GB', brand: 'Samsung', price: 1299990, image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop', url: 'https://www.samsung.com/cl/smartphones/galaxy-s24-ultra/', liked: false, category: 'Celulares' },
  { id: 'sam2', name: 'Galaxy S24+ 256GB', brand: 'Samsung', price: 999990, image: 'https://images.unsplash.com/photo-1582993964426-4ff2fefbfe35?w=400&h=400&fit=crop', url: 'https://www.samsung.com/cl/', liked: false, category: 'Celulares' },
  { id: 'sam3', name: 'Galaxy Z Fold5 256GB', brand: 'Samsung', price: 1899990, image: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400&h=400&fit=crop', url: 'https://www.samsung.com/cl/', liked: false, category: 'Celulares' },
  { id: 'sam4', name: 'Galaxy Z Flip5 256GB', brand: 'Samsung', price: 999990, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop', url: 'https://www.samsung.com/cl/', liked: false, category: 'Celulares' },
  { id: 'sam5', name: 'Galaxy Tab S9 Ultra', brand: 'Samsung', price: 1499990, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop', url: 'https://www.samsung.com/cl/', liked: false, category: 'Tablets' },
  { id: 'sam6', name: 'Galaxy Watch6 Classic 47mm', brand: 'Samsung', price: 449990, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', url: 'https://www.samsung.com/cl/', liked: false, category: 'Wearables' },
  { id: 'sam7', name: 'Galaxy Buds2 Pro', brand: 'Samsung', price: 179990, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop', url: 'https://www.samsung.com/cl/', liked: false, category: 'Audio' },
  { id: 'sam8', name: 'Neo QLED 65" 4K QN90C', brand: 'Samsung', price: 1299990, image: 'https://images.unsplash.com/photo-1571415060716-baff5f717c37?w=400&h=400&fit=crop', url: 'https://www.samsung.com/cl/', liked: false, category: 'TVs' },
  { id: 'sam9', name: 'The Frame 55" QLED', brand: 'Samsung', price: 799990, image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop', url: 'https://www.samsung.com/cl/', liked: false, category: 'TVs' },
  { id: 'sam10', name: 'Soundbar Q990C', brand: 'Samsung', price: 599990, image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop', url: 'https://www.samsung.com/cl/', liked: false, category: 'Audio' },
  { id: 'sam11', name: 'Galaxy A55 5G 256GB', brand: 'Samsung', price: 549990, image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop', url: 'https://www.samsung.com/cl/', liked: false, category: 'Celulares' },
  { id: 'sam12', name: 'Refrigerador French Door', brand: 'Samsung', price: 1199990, image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=400&fit=crop', url: 'https://www.samsung.com/cl/', liked: false, category: 'Electrohogar' },
];

export const APPLE_PRODUCTS: Product[] = [
  { id: 'app1', name: 'iPhone 15 Pro Max 256GB', brand: 'Apple', price: 1599990, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop', url: 'https://www.apple.com/cl/', liked: false, category: 'iPhone' },
  { id: 'app2', name: 'iPhone 15 Pro 128GB', brand: 'Apple', price: 1299990, image: 'https://images.unsplash.com/photo-1694698230819-4c2929e8bc2f?w=400&h=400&fit=crop', url: 'https://www.apple.com/cl/', liked: false, category: 'iPhone' },
  { id: 'app3', name: 'MacBook Pro 14" M3 Pro', brand: 'Apple', price: 2799990, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop', url: 'https://www.apple.com/cl/', liked: false, category: 'Mac' },
  { id: 'app4', name: 'MacBook Air 15" M2', brand: 'Apple', price: 1699990, image: 'https://images.unsplash.com/photo-1611186871525-c3c8ccb74a0b?w=400&h=400&fit=crop', url: 'https://www.apple.com/cl/', liked: false, category: 'Mac' },
  { id: 'app5', name: 'iPad Pro 12.9" M2 256GB', brand: 'Apple', price: 1499990, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop', url: 'https://www.apple.com/cl/', liked: false, category: 'iPad' },
  { id: 'app6', name: 'Apple Watch Ultra 2', brand: 'Apple', price: 999990, image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&h=400&fit=crop', url: 'https://www.apple.com/cl/', liked: false, category: 'Watch' },
  { id: 'app7', name: 'AirPods Pro 2da Gen', brand: 'Apple', price: 299990, image: 'https://images.unsplash.com/photo-1588423771073-b8903fead85c?w=400&h=400&fit=crop', url: 'https://www.apple.com/cl/', liked: false, category: 'Audio' },
  { id: 'app8', name: 'Apple TV 4K 3ra Gen', brand: 'Apple', price: 199990, image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop', url: 'https://www.apple.com/cl/', liked: false, category: 'TV & Hogar' },
  { id: 'app9', name: 'HomePod 2da Gen', brand: 'Apple', price: 299990, image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop', url: 'https://www.apple.com/cl/', liked: false, category: 'TV & Hogar' },
  { id: 'app10', name: 'iPhone 15 128GB', brand: 'Apple', price: 999990, image: 'https://images.unsplash.com/photo-1695048066931-94fc0ef7abf0?w=400&h=400&fit=crop', url: 'https://www.apple.com/cl/', liked: false, category: 'iPhone' },
];

export const SONY_PRODUCTS: Product[] = [
  { id: 'son1', name: 'PlayStation 5 Slim', brand: 'Sony', price: 699990, image: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&h=400&fit=crop', url: 'https://www.playstation.com/cl/', liked: false, category: 'Gaming' },
  { id: 'son2', name: 'PlayStation 5 Digital', brand: 'Sony', price: 549990, image: 'https://images.unsplash.com/photo-1585184394271-4c0a47dc59c9?w=400&h=400&fit=crop', url: 'https://www.playstation.com/cl/', liked: false, category: 'Gaming' },
  { id: 'son3', name: 'WH-1000XM5 Auriculares', brand: 'Sony', price: 349990, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', url: 'https://www.sony.cl/', liked: false, category: 'Audio' },
  { id: 'son4', name: 'Alpha 7 IV Mirrorless', brand: 'Sony', price: 2499990, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop', url: 'https://www.sony.cl/', liked: false, category: 'Cámaras' },
  { id: 'son5', name: 'Bravia XR OLED 55"', brand: 'Sony', price: 1899990, image: 'https://images.unsplash.com/photo-1571415060716-baff5f717c37?w=400&h=400&fit=crop', url: 'https://www.sony.cl/', liked: false, category: 'TVs' },
  { id: 'son6', name: 'LinkBuds S True Wireless', brand: 'Sony', price: 149990, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop', url: 'https://www.sony.cl/', liked: false, category: 'Audio' },
  { id: 'son7', name: 'DualSense Edge Controller', brand: 'Sony', price: 199990, image: 'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=400&h=400&fit=crop', url: 'https://www.playstation.com/cl/', liked: false, category: 'Gaming' },
  { id: 'son8', name: 'ZV-E10 Vlog Camera', brand: 'Sony', price: 699990, image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=400&fit=crop', url: 'https://www.sony.cl/', liked: false, category: 'Cámaras' },
];

export const IKEA_PRODUCTS: Product[] = [
  { id: 'ike1', name: 'Sofá SÖDERHAMN 3 plazas', brand: 'IKEA', price: 649990, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop', url: 'https://www.ikea.com/cl/', liked: false, category: 'Sofás' },
  { id: 'ike2', name: 'Mesa LISABO 140cm', brand: 'IKEA', price: 299990, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop', url: 'https://www.ikea.com/cl/', liked: false, category: 'Mesas' },
  { id: 'ike3', name: 'Silla MARKUS Escritorio', brand: 'IKEA', price: 249990, image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=400&h=400&fit=crop', url: 'https://www.ikea.com/cl/', liked: false, category: 'Sillas' },
  { id: 'ike4', name: 'Estantería KALLAX 2x4', brand: 'IKEA', price: 149990, image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=400&fit=crop', url: 'https://www.ikea.com/cl/', liked: false, category: 'Almacenaje' },
  { id: 'ike5', name: 'Cama HEMNES 140x200', brand: 'IKEA', price: 399990, image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop', url: 'https://www.ikea.com/cl/', liked: false, category: 'Dormitorio' },
  { id: 'ike6', name: 'Lámpara HEKTAR Pie', brand: 'IKEA', price: 79990, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', url: 'https://www.ikea.com/cl/', liked: false, category: 'Iluminación' },
  { id: 'ike7', name: 'Set vajilla IKEA 365+ 24pzs', brand: 'IKEA', price: 59990, image: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=400&fit=crop', url: 'https://www.ikea.com/cl/', liked: false, category: 'Cocina' },
  { id: 'ike8', name: 'Alfombra STOENSE 200x300', brand: 'IKEA', price: 179990, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop', url: 'https://www.ikea.com/cl/', liked: false, category: 'Decoración' },
];

export const LIPPI_PRODUCTS: Product[] = [
  { id: 'lip1', name: 'Parka Trekking Mujer', brand: 'Lippi', price: 229990, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop', url: 'https://www.lippi.cl/', liked: false, category: 'Mujer' },
  { id: 'lip2', name: 'Chaleco Polar Hombre', brand: 'Lippi', price: 99990, image: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=400&h=400&fit=crop', url: 'https://www.lippi.cl/', liked: false, category: 'Hombre' },
  { id: 'lip3', name: 'Pantalón Softshell Unisex', brand: 'Lippi', price: 129990, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop', url: 'https://www.lippi.cl/', liked: false, category: 'Hombre' },
  { id: 'lip4', name: 'Polera Térmica Mujer', brand: 'Lippi', price: 49990, image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop', url: 'https://www.lippi.cl/', liked: false, category: 'Mujer' },
  { id: 'lip5', name: 'Gorro Beanie Lana', brand: 'Lippi', price: 29990, image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop', url: 'https://www.lippi.cl/', liked: false, category: 'Accesorios' },
  { id: 'lip6', name: 'Mochila Trekking 40L', brand: 'Lippi', price: 159990, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', url: 'https://www.lippi.cl/', liked: false, category: 'Accesorios' },
  { id: 'lip7', name: 'Zapatilla Trail Running', brand: 'Lippi', price: 119990, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', url: 'https://www.lippi.cl/', liked: false, category: 'Calzado' },
];

export const FALABELLA_PRODUCTS: Product[] = [
  { id: 'fal1', name: 'TV Samsung 65" 4K Neo QLED', brand: 'Falabella', price: 1199990, image: 'https://images.unsplash.com/photo-1571415060716-baff5f717c37?w=400&h=400&fit=crop', url: 'https://www.falabella.com.cl/', liked: false, category: 'Tecnología' },
  { id: 'fal2', name: 'Zapatilla Nike Air Max 270', brand: 'Falabella', price: 119990, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', url: 'https://www.falabella.com.cl/', liked: false, category: 'Calzado' },
  { id: 'fal3', name: 'Perfume Chanel N°5 100ml', brand: 'Falabella', price: 129990, image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&h=400&fit=crop', url: 'https://www.falabella.com.cl/', liked: false, category: 'Belleza' },
  { id: 'fal4', name: 'Sofá Seccional Oslo 3C', brand: 'Falabella', price: 849990, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop', url: 'https://www.falabella.com.cl/', liked: false, category: 'Hogar' },
  { id: 'fal5', name: 'Notebook Lenovo IdeaPad', brand: 'Falabella', price: 549990, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop', url: 'https://www.falabella.com.cl/', liked: false, category: 'Tecnología' },
  { id: 'fal6', name: 'Vestido Zara Floral', brand: 'Falabella', price: 59990, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop', url: 'https://www.falabella.com.cl/', liked: false, category: 'Ropa Mujer' },
  { id: 'fal7', name: 'Set Cocina Tefal 10 piezas', brand: 'Falabella', price: 189990, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop', url: 'https://www.falabella.com.cl/', liked: false, category: 'Cocina' },
  { id: 'fal8', name: 'Bicicleta Trek FX2 Disc', brand: 'Falabella', price: 699990, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop', url: 'https://www.falabella.com.cl/', liked: false, category: 'Deportes' },
];

// ─── BRANDS ─────────────────────────────────────────────────────────────────
export const BRANDS: Brand[] = [
  {
    id: 'samsung',
    name: 'Samsung',
    category: 'tecnologia',
    logo: '📱',
    coverImage: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&h=300&fit=crop',
    description: 'Tecnología que inspira. Celulares, tablets, TV y más.',
    filters: ['Celulares', 'Tablets', 'TVs', 'Audio', 'Wearables', 'Electrohogar'],
    products: SAMSUNG_PRODUCTS,
    color: 'from-blue-600 to-blue-800',
  },
  {
    id: 'apple',
    name: 'Apple',
    category: 'tecnologia',
    logo: '🍎',
    coverImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=300&fit=crop',
    description: 'Think different. iPhone, Mac, iPad, Watch y más.',
    filters: ['iPhone', 'Mac', 'iPad', 'Watch', 'Audio', 'TV & Hogar'],
    products: APPLE_PRODUCTS,
    color: 'from-gray-700 to-gray-900',
  },
  {
    id: 'sony',
    name: 'Sony',
    category: 'tecnologia',
    logo: '🎮',
    coverImage: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&h=300&fit=crop',
    description: 'PlayStation, cámaras, audio y televisores de última generación.',
    filters: ['Gaming', 'Audio', 'Cámaras', 'TVs'],
    products: SONY_PRODUCTS,
    color: 'from-black to-gray-800',
  },
  {
    id: 'ikea',
    name: 'IKEA',
    category: 'hogar',
    logo: '🛋️',
    coverImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=300&fit=crop',
    description: 'Diseño escandinavo para tu hogar. Muebles, decoración y más.',
    filters: ['Sofás', 'Mesas', 'Sillas', 'Dormitorio', 'Cocina', 'Almacenaje', 'Iluminación', 'Decoración'],
    products: IKEA_PRODUCTS,
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 'lippi',
    name: 'Lippi',
    category: 'outdoor',
    logo: '🏔️',
    coverImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=300&fit=crop',
    description: 'Equipamiento outdoor chileno para aventureros.',
    filters: ['Hombre', 'Mujer', 'Calzado', 'Accesorios'],
    products: LIPPI_PRODUCTS,
    color: 'from-green-600 to-green-800',
  },
  {
    id: 'falabella',
    name: 'Falabella',
    category: 'grandes_tiendas',
    logo: '🏬',
    coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=300&fit=crop',
    description: 'Tu tienda favorita. Tecnología, moda, hogar y deportes.',
    filters: ['Tecnología', 'Calzado', 'Ropa Mujer', 'Hogar', 'Cocina', 'Deportes', 'Belleza'],
    products: FALABELLA_PRODUCTS,
    color: 'from-red-500 to-red-700',
  },
  {
    id: 'paris',
    name: 'Paris',
    category: 'grandes_tiendas',
    logo: '🛍️',
    coverImage: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=300&fit=crop',
    description: 'Moda, tecnología y hogar al mejor precio.',
    filters: ['Ropa Mujer', 'Ropa Hombre', 'Tecnología', 'Hogar', 'Belleza'],
    products: FALABELLA_PRODUCTS.map(p => ({ ...p, id: 'p' + p.id, brand: 'Paris' })),
    color: 'from-pink-500 to-pink-700',
  },
  {
    id: 'ripley',
    name: 'Ripley',
    category: 'grandes_tiendas',
    logo: '🏪',
    coverImage: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&h=300&fit=crop',
    description: 'Lo mejor en moda, tecnología y más.',
    filters: ['Ropa', 'Tecnología', 'Juguetes', 'Hogar', 'Deportes'],
    products: FALABELLA_PRODUCTS.map(p => ({ ...p, id: 'r' + p.id, brand: 'Ripley' })),
    color: 'from-purple-600 to-purple-800',
  },
];

// ─── EVENTS ─────────────────────────────────────────────────────────────────
export const EVENTS: Event[] = [
  {
    id: 'ev1',
    type: 'baby_shower',
    title: 'Baby Shower de Valentina',
    date: '2026-04-20',
    location: 'Las Condes, Santiago',
    host: FRIENDS[1],
    description: '¡Valentina y Marco esperan a su primer bebé! Únete a celebrar este momento tan especial.',
    emoji: '👶',
    wishlist: [
      { id: 'bab1', name: 'Coche Bugaboo Fox 5', brand: 'Bugaboo', price: 1299990, image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop', url: 'https://www.bugaboo.com/', liked: false, category: 'Bebé' },
      { id: 'bab2', name: 'Set de Cuna IKEA SUNDVIK', brand: 'IKEA', price: 399990, image: 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=400&h=400&fit=crop', url: 'https://www.ikea.com/cl/', liked: false, category: 'Bebé' },
      { id: 'bab3', name: 'Monitor Bebé Motorola', brand: 'Motorola', price: 149990, image: 'https://images.unsplash.com/photo-1584118624012-df056829fbd0?w=400&h=400&fit=crop', url: 'https://www.motorola.com/', liked: false, category: 'Bebé' },
    ],
    attendees: FRIENDS.slice(0, 20),
  },
  {
    id: 'ev2',
    type: 'wedding',
    title: 'Matrimonio Camila & Joaquín',
    date: '2026-05-15',
    location: 'Viña del Mar, Valparaíso',
    host: FRIENDS[2],
    description: 'Camila y Joaquín se unen en matrimonio. ¡Acompáñanos en este día tan especial!',
    emoji: '💍',
    wishlist: [
      { id: 'wed1', name: 'Cafetera De\'Longhi Dedica', brand: 'De\'Longhi', price: 349990, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop', url: 'https://www.delonghi.com/', liked: false, category: 'Cocina' },
      { id: 'wed2', name: 'Set Vajilla Villeroy & Boch', brand: 'Villeroy & Boch', price: 289990, image: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=400&fit=crop', url: 'https://www.villeroy-boch.com/', liked: false, category: 'Cocina' },
      { id: 'wed3', name: 'Aspiradora Roomba i7+', brand: 'iRobot', price: 599990, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop', url: 'https://www.irobot.com/', liked: false, category: 'Hogar' },
    ],
    attendees: FRIENDS.slice(5, 35),
  },
  {
    id: 'ev3',
    type: 'graduation',
    title: 'Graduación de Isidora',
    date: '2026-04-30',
    location: 'UC Campus San Joaquín, Santiago',
    host: FRIENDS[4],
    description: 'Isidora se titula de Ingeniería Civil! Vengamos a celebrar este gran logro.',
    emoji: '🎓',
    wishlist: [
      { id: 'gra1', name: 'MacBook Air M2 13"', brand: 'Apple', price: 1299990, image: 'https://images.unsplash.com/photo-1611186871525-c3c8ccb74a0b?w=400&h=400&fit=crop', url: 'https://www.apple.com/cl/', liked: false, category: 'Tecnología' },
      { id: 'gra2', name: 'Mochila Samsonite Guard-IT', brand: 'Samsonite', price: 89990, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', url: 'https://www.samsonite.cl/', liked: false, category: 'Accesorios' },
    ],
    attendees: FRIENDS.slice(10, 30),
  },
];

// ─── FEED ITEMS ──────────────────────────────────────────────────────────────
export const FEED_ITEMS: FeedItem[] = [
  { id: 'f1', user: FRIENDS[0], action: 'added', product: SAMSUNG_PRODUCTS[0], timestamp: 'hace 5 min' },
  { id: 'f2', user: FRIENDS[1], action: 'liked', product: APPLE_PRODUCTS[2], timestamp: 'hace 12 min' },
  { id: 'f3', user: FRIENDS[3], action: 'created_list', listName: 'Lista Cumpleaños 2026', timestamp: 'hace 30 min' },
  { id: 'f4', user: FRIENDS[4], action: 'added', product: SONY_PRODUCTS[0], timestamp: 'hace 1 hora' },
  { id: 'f5', user: FRIENDS[5], action: 'added', product: LIPPI_PRODUCTS[0], timestamp: 'hace 2 horas' },
  { id: 'f6', user: FRIENDS[6], action: 'liked', product: IKEA_PRODUCTS[0], timestamp: 'hace 3 horas' },
  { id: 'f7', user: FRIENDS[7], action: 'added', product: APPLE_PRODUCTS[6], timestamp: 'hace 4 horas' },
  { id: 'f8', user: FRIENDS[9], action: 'created_list', listName: 'Lista Matrimonio', timestamp: 'hace 5 horas' },
  { id: 'f9', user: FRIENDS[10], action: 'added', product: FALABELLA_PRODUCTS[1], timestamp: 'hace 6 horas' },
  { id: 'f10', user: FRIENDS[12], action: 'liked', product: SAMSUNG_PRODUCTS[7], timestamp: 'hace 8 horas' },
];

// ─── WALLET CONTRIBUTIONS ────────────────────────────────────────────────────
export const WALLET_CONTRIBUTIONS: WalletContribution[] = [
  { user: FRIENDS[0], amount: 50000, date: '05 Abr 2026', giftName: 'Fondo Gift PS5' },
  { user: FRIENDS[2], amount: 30000, date: '03 Abr 2026', giftName: 'Fondo Gift PS5' },
  { user: FRIENDS[5], amount: 25000, date: '01 Abr 2026', giftName: 'Fondo MacBook' },
  { user: FRIENDS[8], amount: 50000, date: '28 Mar 2026', giftName: 'Fondo MacBook' },
  { user: FRIENDS[11], amount: 20000, date: '25 Mar 2026', giftName: 'Fondo Gift PS5' },
  { user: FRIENDS[14], amount: 35000, date: '20 Mar 2026', giftName: 'Fondo MacBook' },
  { user: FRIENDS[17], amount: 15000, date: '15 Mar 2026', giftName: 'Fondo Gift PS5' },
  { user: FRIENDS[20], amount: 40000, date: '10 Mar 2026', giftName: 'Fondo MacBook' },
  { user: FRIENDS[23], amount: 25000, date: '05 Mar 2026', giftName: 'Fondo Gift PS5' },
  { user: FRIENDS[26], amount: 55000, date: '01 Mar 2026', giftName: 'Fondo MacBook' },
];

// ─── MY WISHLISTS ─────────────────────────────────────────────────────────────
export const MY_WISHES: Product[] = [
  { ...APPLE_PRODUCTS[0], liked: true },
  { ...SAMSUNG_PRODUCTS[5], liked: true },
  { ...SONY_PRODUCTS[2], liked: true },
  { ...LIPPI_PRODUCTS[5], liked: true },
  { ...IKEA_PRODUCTS[2], liked: true },
];

export const MY_LISTS = [
  { id: 'list1', name: 'Cumpleaños', emoji: '🎂', products: [APPLE_PRODUCTS[6], SAMSUNG_PRODUCTS[6], SONY_PRODUCTS[5]] },
  { id: 'list2', name: 'Asado', emoji: '🥩', products: [FALABELLA_PRODUCTS[6], IKEA_PRODUCTS[6]] },
  { id: 'list3', name: 'Navidad', emoji: '🎄', products: [APPLE_PRODUCTS[2], SAMSUNG_PRODUCTS[7], SONY_PRODUCTS[4]] },
];

export const MY_GROUP_FUNDS: GroupFund[] = [
  {
    id: 'gf1',
    name: 'Fondo para mi PS5',
    product: SONY_PRODUCTS[0],
    targetAmount: 699990,
    currentAmount: 175000,
    contributors: [
      { user: FRIENDS[0], amount: 50000, date: '05 Abr 2026' },
      { user: FRIENDS[2], amount: 30000, date: '03 Abr 2026' },
      { user: FRIENDS[5], amount: 25000, date: '01 Abr 2026' },
      { user: FRIENDS[8], amount: 50000, date: '28 Mar 2026' },
      { user: FRIENDS[11], amount: 20000, date: '25 Mar 2026' },
    ],
    isOwner: true,
  },
  {
    id: 'gf2',
    name: 'Fondo MacBook Pro',
    product: APPLE_PRODUCTS[2],
    targetAmount: 2799990,
    currentAmount: 850000,
    contributors: [
      { user: FRIENDS[14], amount: 100000, date: '20 Mar 2026' },
      { user: FRIENDS[17], amount: 150000, date: '15 Mar 2026' },
      { user: FRIENDS[20], amount: 200000, date: '10 Mar 2026' },
      { user: FRIENDS[23], amount: 200000, date: '05 Mar 2026' },
      { user: FRIENDS[26], amount: 200000, date: '01 Mar 2026' },
    ],
    isOwner: true,
  },
];

// ─── CONVERSATIONS ───────────────────────────────────────────────────────────
export const CONVERSATIONS: Conversation[] = [
  {
    id: 'conv1',
    user: FRIENDS[0],
    unread: 2,
    messages: [
      { id: 'm1', fromId: FRIENDS[0].id, content: '¡Oye! Viste el Galaxy S24 Ultra? Está increíble 🔥', timestamp: '10:32' },
      { id: 'm2', fromId: 'me', content: 'Sí! Lo tengo en mi wishlist ya jajaja', timestamp: '10:33' },
      { id: 'm3', fromId: FRIENDS[0].id, content: 'Para tu cumple te lo regalamos entre varios?', timestamp: '10:35' },
      { id: 'm4', fromId: FRIENDS[0].id, content: 'Podemos usar el fondo grupal de GiftLoop 😏', timestamp: '10:35' },
    ],
  },
  {
    id: 'conv2',
    user: FRIENDS[1],
    unread: 0,
    messages: [
      { id: 'm5', fromId: 'me', content: '¡Felicitaciones por el bebé! 🎉👶', timestamp: '09:00' },
      { id: 'm6', fromId: FRIENDS[1].id, content: 'Gracias Pablo!! Ya agregué cosas al wishlist jaja', timestamp: '09:05' },
      { id: 'm7', fromId: 'me', content: 'Ya aporté algo para el baby shower 😊', timestamp: '09:10' },
    ],
  },
  {
    id: 'conv3',
    user: FRIENDS[3],
    unread: 1,
    messages: [
      { id: 'm8', fromId: FRIENDS[3].id, content: 'Oye, cuál es el link de esa parka de Lippi?', timestamp: 'Ayer' },
      { id: 'm9', fromId: 'me', content: 'Te mando!', timestamp: 'Ayer' },
      { id: 'm10', fromId: FRIENDS[3].id, content: 'Gracias! La agregué a mi lista de Invierno ❄️', timestamp: 'Ayer' },
    ],
  },
  {
    id: 'conv4',
    user: FRIENDS[5],
    unread: 0,
    messages: [
      { id: 'm11', fromId: FRIENDS[5].id, content: 'Vas al asado del sábado?', timestamp: 'Lun' },
      { id: 'm12', fromId: 'me', content: 'Claro que sí! 🥩🔥', timestamp: 'Lun' },
    ],
  },
];

// ─── BANNER DATA (rotating) ───────────────────────────────────────────────────
export const HOME_BANNERS = [
  {
    id: 'b1',
    brand: 'North Face',
    title: 'Colección Otoño 2026',
    subtitle: 'Zapatillas Outdoor',
    image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&h=250&fit=crop',
    color: 'from-slate-800 to-slate-600',
    brandId: 'lippi',
  },
  {
    id: 'b2',
    brand: 'Samsung',
    title: 'Galaxy Ecosystem',
    subtitle: 'Lo último en tech',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=250&fit=crop',
    color: 'from-blue-800 to-blue-600',
    brandId: 'samsung',
  },
  {
    id: 'b3',
    brand: 'IKEA',
    title: 'Diseño Sueco',
    subtitle: 'Hogar inteligente',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=250&fit=crop',
    color: 'from-yellow-600 to-yellow-400',
    brandId: 'ikea',
  },
  {
    id: 'b4',
    brand: 'Apple',
    title: 'iPhone 15 Pro',
    subtitle: 'Titanio. Think Different.',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=250&fit=crop',
    color: 'from-gray-800 to-gray-600',
    brandId: 'apple',
  },
];

export const DISCOVER_BANNERS = [
  { id: 'db1', brand: 'Samsung', title: 'Galaxy S24 Ultra', subtitle: 'Hasta 35% off en seleccionados', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=900&h=350&fit=crop', color: 'from-blue-900 to-blue-600', brandId: 'samsung' },
  { id: 'db2', brand: 'Lippi', title: 'Nueva Colección Otoño', subtitle: 'Equipamiento para tus aventuras', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&h=350&fit=crop', color: 'from-green-900 to-green-600', brandId: 'lippi' },
  { id: 'db3', brand: 'IKEA', title: 'Renueva tu hogar', subtitle: 'Diseño escandinavo al mejor precio', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&h=350&fit=crop', color: 'from-yellow-700 to-yellow-500', brandId: 'ikea' },
  { id: 'db4', brand: 'Apple', title: 'MacBook Pro M3', subtitle: 'El chip más potente jamás creado', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&h=350&fit=crop', color: 'from-gray-900 to-gray-700', brandId: 'apple' },
];
