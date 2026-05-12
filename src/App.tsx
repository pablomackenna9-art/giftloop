import { useState, useRef, useEffect, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
function simpleHash(s: string): string {
  let h = 0;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return String(Math.abs(h));
}

export type AppUser = {
  id: string; name: string; username: string;
  email: string; passwordHash: string;
  avatar: string; bio: string;
};

function mapSupabaseUser(
  user: SupabaseUser,
  profile?: { name?: string; username?: string; avatar?: string; bio?: string } | null
): AppUser {
  const email = user.email ?? '';
  const meta = user.user_metadata ?? {};
  const name = profile?.name ?? String(meta['name'] ?? email.split('@')[0]);
  const username = profile?.username ?? String(meta['username'] ?? email.split('@')[0].toLowerCase().replace(/\s/g, '_'));
  const avatar = profile?.avatar
    ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=7C3AED&textColor=ffffff`;
  return {
    id: user.id,
    name,
    username,
    email,
    passwordHash: '', // handled by Supabase
    avatar,
    bio: profile?.bio ?? '',
  };
}

function getStoredUsers(): AppUser[] {
  try { return JSON.parse(localStorage.getItem('gl_users') ?? '[]'); } catch { return []; }
}
function saveStoredUsers(u: AppUser[]) { localStorage.setItem('gl_users', JSON.stringify(u)); }
function getStoredCurrent(): AppUser | null {
  try { return JSON.parse(localStorage.getItem('gl_current') ?? 'null'); } catch { return null; }
}
function setStoredCurrent(u: AppUser | null) {
  if (u) localStorage.setItem('gl_current', JSON.stringify(u));
  else localStorage.removeItem('gl_current');
}

// ─── ERROR BOUNDARY (prevents blank screen on runtime errors) ─────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('GiftLoop error:', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="font-bold text-gray-800 text-lg mb-2">Algo salió mal</h2>
          <p className="text-sm text-gray-500 mb-5 max-w-xs">{(this.state.error as Error).message}</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm">
            Recargar app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import {
  Home, Search, MessageCircle, User, Gift, Heart, ShoppingBag,
  ChevronLeft, ChevronRight, Bell, Send, Star, Users,
  MapPin, Calendar, Plus, Edit3, Check, X, ArrowLeft,
  DollarSign, CreditCard, Eye, EyeOff, ExternalLink,
  Cake, Package, Sparkles, TrendingUp, Phone, Menu,
} from 'lucide-react';
import {
  ME, FRIENDS, EVENTS, FEED_ITEMS, CONVERSATIONS, BRANDS,
  WALLET_CONTRIBUTIONS, MY_WISHES, MY_LISTS, MY_GROUP_FUNDS,
  HOME_BANNERS, DISCOVER_BANNERS, SAMSUNG_PRODUCTS,
} from './data';
import type {
  Screen, User as UserType, Product, Event, Brand,
  Conversation, Message, GroupFund,
} from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;

// Today's date for birthday comparison
const today = new Date();
const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

function getBirthdayLabel(birthday: string) {
  const [m, d] = birthday.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
}

function isTodayBirthday(birthday: string) {
  return birthday === todayMD;
}

// Sort friends by birthday proximity to today
function sortByBirthdayProximity(friends: UserType[]) {
  const [tm, td] = todayMD.split('-').map(Number);
  const todayDays = tm * 31 + td;
  return [...friends].sort((a, b) => {
    const [am, ad] = a.birthday.split('-').map(Number);
    const [bm, bd] = b.birthday.split('-').map(Number);
    let da = am * 31 + ad - todayDays;
    let db = bm * 31 + bd - todayDays;
    if (da < 0) da += 12 * 31;
    if (db < 0) db += 12 * 31;
    return da - db;
  });
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
function Avatar({ src, size = 40, online = false }: { src: string; size?: number; online?: boolean }) {
  return (
    <div className="relative inline-block">
      <img
        src={src}
        alt="avatar"
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-white shadow"
      />
      {online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />}
    </div>
  );
}

function ProductCard({
  product, onLike, onBuy, onAddToList, isOwner = false,
}: {
  product: Product;
  onLike: (p: Product) => void;
  onBuy: (p: Product) => void;
  onAddToList?: (p: Product) => void;
  isOwner?: boolean;
}) {
  const [liked, setLiked] = useState(product.liked);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="relative">
        <img src={product.image} alt={product.name} className="w-full h-40 object-cover" />
        <button
          onClick={() => { setLiked(!liked); onLike({ ...product, liked: !liked }); }}
          className={`absolute top-2 right-2 p-1.5 rounded-full shadow ${liked ? 'bg-red-500 text-white' : 'bg-white text-gray-400'}`}
        >
          <Heart size={16} fill={liked ? 'white' : 'none'} />
        </button>
      </div>
      <div className="p-3">
        <p className="text-xs text-purple-600 font-medium">{product.brand}</p>
        <p className="text-sm font-semibold text-gray-800 leading-tight">{product.name}</p>
        <p className="text-base font-bold text-gray-900 mt-1">{fmt(product.price)}</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onBuy(product)}
            className="flex-1 bg-purple-600 text-white text-xs py-1.5 rounded-lg font-medium flex items-center justify-center gap-1"
          >
            <ExternalLink size={12} /> Comprar
          </button>
          {onAddToList && !isOwner && (
            <button
              onClick={() => onAddToList(product)}
              className="flex-1 border border-purple-200 text-purple-600 text-xs py-1.5 rounded-lg font-medium"
            >
              + Mi lista
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BackButton({ onBack, label = 'Volver' }: { onBack: () => void; label?: string }) {
  return (
    <button onClick={onBack} className="flex items-center gap-1 text-purple-600 font-medium mb-4">
      <ArrowLeft size={18} /> {label}
    </button>
  );
}

// ─── MODAL: ADD TO LIST ──────────────────────────────────────────────────────
function AddToListModal({ product, myLists, onSelect, onClose }: {
  product: Product;
  myLists: { id: string; name: string; emoji: string }[];
  onSelect: (listId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Agregar a lista</h3>
        <p className="text-sm text-gray-500 mb-4">{product.name}</p>
        <button onClick={() => onSelect('wishes')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 mb-2">
          <span className="text-2xl">⭐</span>
          <span className="font-medium text-gray-800">Mis Deseos</span>
        </button>
        {myLists.map(list => (
          <button key={list.id} onClick={() => onSelect(list.id)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 mb-2">
            <span className="text-2xl">{list.emoji}</span>
            <span className="font-medium text-gray-800">{list.name}</span>
          </button>
        ))}
        <button onClick={onClose} className="w-full mt-2 text-gray-500 text-sm py-2">Cancelar</button>
      </div>
    </div>
  );
}

// ─── HOME SCREEN ─────────────────────────────────────────────────────────────
function HomeScreen({ onNavigate, following, onFollow }: {
  onNavigate: (screen: Screen, data?: unknown) => void;
  following: Set<string>;
  onFollow: (id: string) => void;
}) {
  const [subView, setSubView] = useState<'feed' | 'wallet_review' | 'wallet_withdraw' | 'birthdays_all' | 'event_detail' | 'friend_profile' | 'brand_store'>('feed');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<UserType | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [addToListProduct, setAddToListProduct] = useState<Product | null>(null);
  const [myWishes, setMyWishes] = useState<Product[]>(MY_WISHES);
  const [toast, setToast] = useState('');

  const sortedFriends = sortByBirthdayProximity(FRIENDS);
  const todayBirthdays = sortedFriends.filter(f => isTodayBirthday(f.birthday));
  const upcomingBirthdays = sortedFriends.filter(f => !isTodayBirthday(f.birthday)).slice(0, 8);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleLike = (product: Product) => {
    setLikedItems(prev => {
      const next = new Set(prev);
      if (next.has(product.id)) next.delete(product.id); else next.add(product.id);
      return next;
    });
    setAddToListProduct(product);
  };

  const handleAddToList = (listId: string) => {
    if (listId === 'wishes' && addToListProduct) {
      setMyWishes(prev => prev.find(p => p.id === addToListProduct.id) ? prev : [...prev, { ...addToListProduct, liked: true }]);
      showToast('Agregado a Mis Deseos ⭐');
    } else {
      showToast('Agregado a la lista ✓');
    }
    setAddToListProduct(null);
  };

  const handleBuy = (product: Product) => {
    window.open(product.url, '_blank');
  };

  const brand = selectedBrand ? BRANDS.find(b => b.id === selectedBrand) : null;
  const activeBrand = brand;

  // Brand Store sub-view
  if (subView === 'brand_store' && activeBrand) {
    return <BrandStore brand={activeBrand} onBack={() => { setSubView('feed'); setSelectedBrand(null); }} onLike={() => showToast('Agregado a favoritos ⭐')} />;
  }

  // Friend profile sub-view
  if (subView === 'friend_profile' && selectedFriend) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <BackButton onBack={() => { setSubView('feed'); setSelectedFriend(null); }} />
        <FriendProfileView
          friend={selectedFriend}
          isFollowing={following.has(selectedFriend.id)}
          onFollow={() => onFollow(selectedFriend.id)}
          onMessage={() => onNavigate('messages')}
          onBuy={handleBuy}
          onLike={handleLike}
        />
      </div>
    );
  }

  // Event detail sub-view
  if (subView === 'event_detail' && selectedEvent) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <BackButton onBack={() => { setSubView('feed'); setSelectedEvent(null); }} />
        <EventDetailView event={selectedEvent} onBuy={handleBuy} onLike={handleLike} />
      </div>
    );
  }

  // All birthdays
  if (subView === 'birthdays_all') {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <BackButton onBack={() => setSubView('feed')} />
        <h2 className="text-xl font-bold text-gray-800 mb-4">Cumpleaños de Amigos 🎂</h2>
        <div className="space-y-3">
          {sortedFriends.map(f => (
            <button key={f.id} onClick={() => { setSelectedFriend(f); setSubView('friend_profile'); }}
              className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-left">
              <Avatar src={f.avatar} size={48} />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{f.name} {f.lastName}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Cake size={13} />
                  {isTodayBirthday(f.birthday) ? <span className="text-pink-500 font-medium">¡Hoy! 🎉</span> : getBirthdayLabel(f.birthday)}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Wallet views
  if (subView === 'wallet_review') {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <BackButton onBack={() => setSubView('feed')} label="Mi Saldo" />
        <h2 className="text-xl font-bold text-gray-800 mb-1">Aportes Recibidos</h2>
        <p className="text-sm text-gray-500 mb-4">Total recibido: <strong className="text-purple-600">$345.000</strong></p>
        <div className="space-y-3">
          {WALLET_CONTRIBUTIONS.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <Avatar src={c.user.avatar} size={44} />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{c.user.name} {c.user.lastName}</p>
                <p className="text-xs text-gray-500">{c.giftName} · {c.date}</p>
              </div>
              <p className="font-bold text-green-600">+{fmt(c.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subView === 'wallet_withdraw') {
    return (
      <div className="p-4 max-w-md mx-auto">
        <BackButton onBack={() => setSubView('feed')} label="Mi Saldo" />
        <h2 className="text-xl font-bold text-gray-800 mb-4">Retirar Fondos</h2>
        {withdrawStep === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
              <DollarSign size={28} className="text-purple-600" />
            </div>
            <p className="text-center text-gray-500 mb-2">Saldo disponible</p>
            <p className="text-center text-3xl font-bold text-gray-800 mb-6">$345.000</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banco destino</label>
            <select className="w-full border border-gray-200 rounded-xl p-3 mb-4 text-sm">
              <option>Banco Estado</option><option>Santander</option><option>BCI</option>
              <option>Falabella</option><option>Banco Chile</option>
            </select>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° de cuenta</label>
            <input type="text" placeholder="000-000-0000" className="w-full border border-gray-200 rounded-xl p-3 mb-4 text-sm" />
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto a retirar</label>
            <input type="number" placeholder="$" className="w-full border border-gray-200 rounded-xl p-3 mb-6 text-sm" />
            <button onClick={() => setWithdrawStep(2)} className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold">
              Continuar
            </button>
          </div>
        )}
        {withdrawStep === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <Check size={28} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">¡Retiro en proceso!</h3>
            <p className="text-gray-500 mb-6 text-sm">Tu transferencia será procesada en 1-2 días hábiles.</p>
            <button onClick={() => { setWithdrawStep(1); setSubView('feed'); }}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold">
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── MAIN FEED ─────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-6 max-w-6xl mx-auto px-4">
      {/* LEFT COLUMN */}
      <div className="hidden lg:block w-72 flex-shrink-0 sticky top-20 h-fit">
        {/* Saldo */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-5 text-white mb-4">
          <p className="text-purple-200 text-sm font-medium mb-1">Mi Saldo GiftLoop</p>
          <p className="text-3xl font-bold mb-4">$345.000</p>
          <div className="flex gap-2">
            <button onClick={() => setSubView('wallet_review')} className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm py-2 rounded-xl font-medium transition">
              Revisar
            </button>
            <button onClick={() => setSubView('wallet_withdraw')} className="flex-1 bg-white text-purple-700 text-sm py-2 rounded-xl font-semibold transition">
              Retirar
            </button>
          </div>
        </div>
        {/* Left Banners */}
        {HOME_BANNERS.slice(0, 2).map(b => (
          <button key={b.id} onClick={() => { setSelectedBrand(b.brandId); setSubView('brand_store'); }}
            className={`w-full bg-gradient-to-br ${b.color} rounded-2xl p-4 text-white mb-3 text-left overflow-hidden relative`}>
            <p className="text-xs text-white/70 font-medium">{b.brand}</p>
            <p className="font-bold text-sm">{b.title}</p>
            <p className="text-xs text-white/80">{b.subtitle}</p>
            <p className="text-xs text-white/60 mt-2 underline">Ver colección →</p>
          </button>
        ))}
      </div>

      {/* CENTER FEED */}
      <div className="flex-1 min-w-0">
        {/* Mobile Saldo */}
        <div className="lg:hidden bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-4 text-white mb-4">
          <p className="text-purple-200 text-sm">Mi Saldo</p>
          <p className="text-2xl font-bold mb-3">$345.000</p>
          <div className="flex gap-2">
            <button onClick={() => setSubView('wallet_review')} className="flex-1 bg-white/20 text-white text-sm py-2 rounded-xl">Revisar</button>
            <button onClick={() => setSubView('wallet_withdraw')} className="flex-1 bg-white text-purple-700 text-sm py-2 rounded-xl font-semibold">Retirar</button>
          </div>
        </div>

        {/* Birthdays */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Cake size={18} className="text-pink-500" /> Cumpleaños</h3>
            <button onClick={() => setSubView('birthdays_all')} className="text-xs text-purple-600 font-medium">Ver todo</button>
          </div>
          {todayBirthdays.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-bold text-pink-600 uppercase tracking-wide mb-2">🎂 Hoy</p>
              {todayBirthdays.map(f => (
                <button key={f.id} onClick={() => { setSelectedFriend(f); setSubView('friend_profile'); }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-pink-50 text-left">
                  <div className="relative"><Avatar src={f.avatar} size={44} />
                    <span className="absolute -bottom-1 -right-1 text-sm">🎂</span></div>
                  <div><p className="font-semibold text-gray-800 text-sm">{f.name} {f.lastName}</p>
                    <p className="text-xs text-pink-500">¡Hoy cumple años!</p></div>
                </button>
              ))}
            </div>
          )}
          <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Próximos</p>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {upcomingBirthdays.map(f => (
              <button key={f.id} onClick={() => { setSelectedFriend(f); setSubView('friend_profile'); }}
                className="flex-shrink-0 text-center flex flex-col items-center gap-1">
                <div className="relative"><Avatar src={f.avatar} size={52} />
                  <span className="absolute -top-1 -right-1 text-xs">🎂</span></div>
                <p className="text-xs font-medium text-gray-700 w-14 truncate">{f.name}</p>
                <p className="text-xs text-purple-600 font-semibold">{getBirthdayLabel(f.birthday)}</p>
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* Events */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-indigo-800 mb-3 flex items-center gap-2"><Calendar size={18} /> Invitaciones</h3>
          <div className="space-y-2">
            {EVENTS.filter(ev => {
              const evDate = new Date(ev.date);
              const now = new Date();
              const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return evDate >= sevenDaysAgo;
            }).map(ev => (
              <button key={ev.id} onClick={() => { setSelectedEvent(ev); setSubView('event_detail'); }}
                className="w-full bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm text-left hover:shadow-md transition">
                <span className="text-2xl">{ev.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{ev.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={11} /> {new Date(ev.date).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
                    <span className="mx-1">·</span><MapPin size={11} /> {ev.location.split(',')[0]}
                  </p>
                </div>
                <ChevronRight size={16} className="text-indigo-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {FEED_ITEMS.map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => { setSelectedFriend(item.user); setSubView('friend_profile'); }}>
                  <Avatar src={item.user.avatar} size={44} />
                </button>
                <div className="flex-1">
                  <button onClick={() => { setSelectedFriend(item.user); setSubView('friend_profile'); }}
                    className="font-semibold text-gray-800 hover:text-purple-600 text-sm">{item.user.name} {item.user.lastName}</button>
                  <p className="text-xs text-gray-500">
                    {item.action === 'added' ? '✨ Agregó un deseo' : item.action === 'liked' ? '❤️ Le gustó un producto' : `📋 Creó la lista "${item.listName}"`}
                    {' · '}{item.timestamp}
                  </p>
                </div>
                <button onClick={() => onFollow(item.user.id)}
                  className={`text-xs px-3 py-1 rounded-full font-medium border transition ${following.has(item.user.id) ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-purple-600 text-white border-purple-600'}`}>
                  {following.has(item.user.id) ? 'Siguiendo' : 'Seguir'}
                </button>
              </div>
              {item.product && (
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-48 object-cover" />
                  <div className="p-3">
                    <p className="text-xs text-purple-600 font-medium">{item.product.brand}</p>
                    <p className="font-semibold text-gray-800">{item.product.name}</p>
                    <p className="text-lg font-bold text-gray-900">{fmt(item.product.price)}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleLike(item.product!)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition border ${likedItems.has(item.product.id) ? 'bg-red-50 text-red-500 border-red-200' : 'border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500'}`}>
                        <Heart size={15} fill={likedItems.has(item.product.id) ? 'currentColor' : 'none'} /> Lo Quiero
                      </button>
                      <button onClick={() => handleBuy(item.product!)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium">
                        <ExternalLink size={15} /> Comprar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="hidden lg:block w-72 flex-shrink-0 sticky top-20 h-fit space-y-3">
        {HOME_BANNERS.slice(2, 4).map(b => (
          <button key={b.id} onClick={() => { setSelectedBrand(b.brandId); setSubView('brand_store'); }}
            className={`w-full bg-gradient-to-br ${b.color} rounded-2xl p-4 text-white text-left`}>
            <p className="text-xs text-white/70">{b.brand}</p>
            <p className="font-bold text-sm">{b.title}</p>
            <p className="text-xs text-white/80">{b.subtitle}</p>
            <p className="text-xs text-white/60 mt-2 underline">Ver colección →</p>
          </button>
        ))}

        {/* Suggested friends */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="font-bold text-gray-800 text-sm mb-3">Personas que quizás conoces</p>
          {FRIENDS.slice(30, 35).map(f => (
            <div key={f.id} className="flex items-center gap-2 mb-3">
              <button onClick={() => { setSelectedFriend(f); setSubView('friend_profile'); }}>
                <Avatar src={f.avatar} size={36} />
              </button>
              <button onClick={() => { setSelectedFriend(f); setSubView('friend_profile'); }} className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-gray-800 truncate">{f.name} {f.lastName}</p>
                <p className="text-xs text-gray-400">Amigo de amigos</p>
              </button>
              <button onClick={() => onFollow(f.id)}
                className={`text-xs px-2 py-1 rounded-full font-medium transition ${following.has(f.id) ? 'bg-gray-100 text-gray-500' : 'text-purple-600 font-semibold'}`}>
                {following.has(f.id) ? '✓' : 'Seguir'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm z-50 shadow-lg">
          {toast}
        </div>
      )}

      {/* Add to list modal */}
      {addToListProduct && (
        <AddToListModal
          product={addToListProduct}
          myLists={MY_LISTS}
          onSelect={handleAddToList}
          onClose={() => setAddToListProduct(null)}
        />
      )}
    </div>
  );
}

// ─── FRIEND PROFILE VIEW ─────────────────────────────────────────────────────
function FriendProfileView({ friend, isFollowing, onFollow, onMessage, onBuy, onLike }: {
  friend: UserType;
  isFollowing: boolean;
  onFollow: () => void;
  onMessage: () => void;
  onBuy: (p: Product) => void;
  onLike: (p: Product) => void;
}) {
  const [tab, setTab] = useState<'wishes' | 'funds'>('wishes');
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributingFund, setContributingFund] = useState<GroupFund | null>(null);
  const [contributed, setContributed] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  // Mock wishes/funds for the friend
  const friendWishes = SAMSUNG_PRODUCTS.slice(0, 6).map((p, i) => ({ ...p, id: `fw${friend.id}_${i}` }));
  const friendFunds: GroupFund[] = MY_GROUP_FUNDS.slice(0, 2).map((f, i) => ({
    ...f, id: `ff${friend.id}_${i}`, isOwner: false,
  }));

  // Contribute modal
  if (contributingFund) {
    const pct = Math.round((contributingFund.currentAmount / contributingFund.targetAmount) * 100);
    return (
      <div>
        <button onClick={() => setContributingFund(null)} className="flex items-center gap-1 text-purple-600 mb-4 text-sm font-medium">
          <ArrowLeft size={16} /> Volver al perfil
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <img src={contributingFund.product.image} alt={contributingFund.product.name} className="w-full h-44 object-cover" />
          <div className="p-4">
            <p className="font-bold text-gray-800">{contributingFund.name}</p>
            <p className="text-xs text-gray-500 mb-3">{contributingFund.product.name}</p>
            <div className="h-2.5 bg-gray-100 rounded-full mb-1">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mb-4">
              <span>{fmt(contributingFund.currentAmount)} recaudados</span>
              <span>Meta {fmt(contributingFund.targetAmount)}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-2">¿Cuánto quieres aportar?</p>
            <div className="flex gap-2 mb-3 flex-wrap">
              {[5000, 10000, 20000, 50000].map(a => (
                <button key={a} onClick={() => setContributeAmount(String(a))}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition ${contributeAmount === String(a) ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600'}`}>
                  {fmt(a)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-500">$</span>
              <input value={contributeAmount} onChange={e => setContributeAmount(e.target.value.replace(/\D/g,''))}
                placeholder="Otro monto"
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
            </div>
            <button
              onClick={() => {
                if (!contributeAmount) return;
                setContributed(prev => new Set([...prev, contributingFund.id]));
                showToast(`¡Aporte de ${fmt(Number(contributeAmount))} enviado! 🎁`);
                setContributingFund(null); setContributeAmount('');
              }}
              disabled={!contributeAmount}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
              <Heart size={16} fill="white" /> Aportar {contributeAmount ? fmt(Number(contributeAmount)) : ''}
            </button>
          </div>
        </div>
        {toast && <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm z-50">{toast}</div>}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
          <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
            <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800">{friend.name} {friend.lastName}</h2>
          <p className="text-xs text-gray-400">@{friend.name.toLowerCase().replace(/\s/g,'_')}</p>
          {friend.bio && <p className="text-xs text-gray-500 mt-0.5">{friend.bio}</p>}
          <p className="text-xs text-purple-500 mt-0.5 flex items-center gap-1"><Cake size={11} /> {getBirthdayLabel(friend.birthday)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2 mb-3">
        {[
          [String(friend.friendsCount), 'Amigos'],
          [String(friend.followersCount), 'Seguidores'],
          [String(friend.listsCount), 'Listas'],
        ].map(([n, label]) => (
          <div key={label} className="flex-1 text-center bg-white rounded-xl py-2.5 shadow-sm border border-gray-100">
            <p className="font-bold text-gray-800 text-sm">{n}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-4">
        <button onClick={onFollow}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition ${isFollowing ? 'bg-gray-100 text-gray-700' : 'bg-purple-600 text-white'}`}>
          {isFollowing ? '✓ Siguiendo' : '+ Seguir'}
        </button>
        <button onClick={onMessage} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm flex items-center justify-center gap-1">
          <MessageCircle size={15} /> Mensaje
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button onClick={() => setTab('wishes')}
          className={`flex-1 py-2.5 text-sm font-semibold transition border-b-2 ${tab === 'wishes' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'}`}>
          ⊞ Deseos
        </button>
        <button onClick={() => setTab('funds')}
          className={`flex-1 py-2.5 text-sm font-semibold transition border-b-2 ${tab === 'funds' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'}`}>
          💰 Fondos
        </button>
      </div>

      {/* Wishes tab */}
      {tab === 'wishes' && (
        <div className="grid grid-cols-2 gap-3">
          {friendWishes.map(p => (
            <ProductCard key={p.id} product={p} onLike={onLike} onBuy={onBuy} />
          ))}
        </div>
      )}

      {/* Funds tab */}
      {tab === 'funds' && (
        <div className="space-y-3">
          {friendFunds.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No hay fondos activos</p>
          ) : (
            friendFunds.map(fund => {
              const pct = Math.round((fund.currentAmount / fund.targetAmount) * 100);
              return (
                <div key={fund.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <img src={fund.product.image} alt={fund.product.name} className="w-full h-32 object-cover" />
                  <div className="p-4">
                    <p className="font-bold text-gray-800 text-sm">{fund.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{fund.product.name}</p>
                    <div className="h-2.5 bg-gray-100 rounded-full mb-1">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mb-3">
                      <span>{fmt(fund.currentAmount)}</span><span>Meta {fmt(fund.targetAmount)}</span>
                    </div>
                    {contributed.has(fund.id) ? (
                      <div className="w-full bg-green-50 text-green-600 py-2 rounded-xl text-sm font-semibold text-center">✓ ¡Ya aportaste!</div>
                    ) : (
                      <button onClick={() => setContributingFund(fund)}
                        className="w-full bg-purple-600 text-white py-2 rounded-xl text-sm font-semibold">
                        💜 Aportar al fondo
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {toast && <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm z-50">{toast}</div>}
    </div>
  );
}

// ─── EVENT DETAIL VIEW ───────────────────────────────────────────────────────
function EventDetailView({ event, onBuy, onLike }: { event: Event; onBuy: (p: Product) => void; onLike: (p: Product) => void }) {
  return (
    <div>
      <div className={`bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-4`}>
        <span className="text-4xl mb-2 block">{event.emoji}</span>
        <h2 className="text-2xl font-bold">{event.title}</h2>
        <p className="text-indigo-200 text-sm mt-1">{event.description}</p>
        <div className="mt-3 space-y-1">
          <p className="text-sm flex items-center gap-2"><Calendar size={14} />
            {new Date(event.date).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-sm flex items-center gap-2"><MapPin size={14} /> {event.location}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <p className="font-bold text-gray-800 mb-2">Organizado por</p>
        <div className="flex items-center gap-3">
          <Avatar src={event.host.avatar} size={40} />
          <p className="font-medium text-gray-700">{event.host.name} {event.host.lastName}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <p className="font-bold text-gray-800 mb-1">Asistentes ({event.attendees.length})</p>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {event.attendees.slice(0, 10).map(a => (
            <div key={a.id} className="flex-shrink-0 text-center">
              <Avatar src={a.avatar} size={40} />
              <p className="text-xs text-gray-500 mt-1 w-10 truncate">{a.name}</p>
            </div>
          ))}
          {event.attendees.length > 10 && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">+{event.attendees.length - 10}</div>}
        </div>
      </div>

      {event.wishlist.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 mb-3">Lista de Regalos Sugeridos</h3>
          <div className="grid grid-cols-2 gap-3">
            {event.wishlist.map(p => (
              <ProductCard key={p.id} product={p} onLike={onLike} onBuy={onBuy} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BRAND STORE ─────────────────────────────────────────────────────────────
function BrandStore({ brand, onBack, onLike }: { brand: Brand; onBack: () => void; onLike: () => void }) {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const filters = ['Todos', ...brand.filters];
  const filtered = activeFilter === 'Todos' ? brand.products : brand.products.filter(p => p.category === activeFilter);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <BackButton onBack={onBack} />
      <div className={`bg-gradient-to-r ${brand.color} rounded-2xl p-6 text-white mb-4 relative overflow-hidden`}>
        <span className="text-4xl mb-2 block">{brand.logo}</span>
        <h2 className="text-2xl font-bold">{brand.name}</h2>
        <p className="text-white/80 text-sm mt-1">{brand.description}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${activeFilter === f ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map(p => (
          <ProductCard key={p.id} product={p}
            onLike={() => { showToast('Agregado a Mis Deseos ⭐'); onLike(); }}
            onBuy={p => window.open(p.url, '_blank')}
          />
        ))}
      </div>
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── DISCOVER SCREEN ──────────────────────────────────────────────────────────
function DiscoverScreen() {
  const [bannerIdx, setBannerIdx] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [search, setSearch] = useState('');
  const [aiResults, setAiResults] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const nextBanner = () => setBannerIdx(i => (i + 1) % DISCOVER_BANNERS.length);
  const prevBanner = () => setBannerIdx(i => (i - 1 + DISCOVER_BANNERS.length) % DISCOVER_BANNERS.length);

  const categories: { label: string; key: Brand['category']; emoji: string }[] = [
    { label: 'Grandes Tiendas', key: 'grandes_tiendas', emoji: '🏬' },
    { label: 'Tecnología', key: 'tecnologia', emoji: '📱' },
    { label: 'Hogar', key: 'hogar', emoji: '🛋️' },
    { label: 'Outdoor', key: 'outdoor', emoji: '🏔️' },
  ];

  const handleAI = () => {
    setLoadingAI(true);
    setTimeout(() => {
      setAiResults([
        '🍷 Set de Vinos Casillero del Diablo Premium — Tus amigos también lo tienen en wishlist',
        '💻 MacBook Air M2 — Tendencia en tu red esta semana',
        '🎮 PlayStation 5 Slim — 12 de tus amigos lo desean',
        '🏔️ Parka Lippi Trekking — Popular entre tus amigos outdoor',
        '📸 Sony Alpha 7 IV — Lo más buscado en Tecnología',
      ]);
      setLoadingAI(false);
    }, 1500);
  };

  const allProducts = BRANDS.flatMap(b => b.products);
  const searchResults = search.length > 2
    ? allProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : [];

  if (selectedBrand) {
    return <BrandStore brand={selectedBrand} onBack={() => setSelectedBrand(null)} onLike={() => showToast('Agregado a favoritos ⭐')} />;
  }

  const b = DISCOVER_BANNERS[bannerIdx];

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar productos, marcas, listas..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">Resultados</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {searchResults.map(p => (
              <ProductCard key={p.id} product={p}
                onLike={() => showToast('Agregado a favoritos ⭐')}
                onBuy={p => window.open(p.url, '_blank')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Carousel Banners */}
      <div className="relative rounded-2xl overflow-hidden mb-6 shadow-md">
        <div className={`bg-gradient-to-r ${b.color} relative h-48 flex items-end`}>
          <img src={b.image} alt={b.brand} className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="relative p-6 text-white">
            <p className="text-white/70 text-sm">{b.brand}</p>
            <h3 className="text-2xl font-bold">{b.title}</h3>
            <p className="text-white/80">{b.subtitle}</p>
            <button onClick={() => { const found = BRANDS.find(br => br.id === b.brandId); if (found) setSelectedBrand(found); }}
              className="mt-2 bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1.5 rounded-full transition">
              Ver colección →
            </button>
          </div>
        </div>
        <button onClick={prevBanner} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full p-1.5 shadow">
          <ChevronLeft size={18} className="text-gray-700" />
        </button>
        <button onClick={nextBanner} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full p-1.5 shadow">
          <ChevronRight size={18} className="text-gray-700" />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {DISCOVER_BANNERS.map((_, i) => (
            <button key={i} onClick={() => setBannerIdx(i)}
              className={`w-2 h-2 rounded-full transition ${i === bannerIdx ? 'bg-white' : 'bg-white/40'}`} />
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories.map(cat => (
        <div key={cat.key} className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">{cat.emoji} {cat.label}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BRANDS.filter(b => b.category === cat.key).map(brand => (
              <button key={brand.id} onClick={() => setSelectedBrand(brand)}
                className={`bg-gradient-to-br ${brand.color} rounded-2xl p-4 text-white text-left shadow-sm hover:shadow-md transition`}>
                <span className="text-3xl block mb-2">{brand.logo}</span>
                <p className="font-bold text-sm">{brand.name}</p>
                <p className="text-white/70 text-xs mt-1">{brand.products.length} productos</p>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* AI Recommendations */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} className="text-purple-600" />
          <h3 className="font-bold text-gray-800">Tendencias entre tus amigos</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Descubre qué están deseando las personas que sigues</p>
        {aiResults.length === 0 ? (
          <button onClick={handleAI} disabled={loadingAI}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
            {loadingAI ? <><span className="animate-spin">⟳</span> Analizando...</> : <><Search size={16} /> Buscar</>}
          </button>
        ) : (
          <div className="space-y-3">
            {aiResults.map((r, i) => (
              <div key={i} className="bg-white rounded-xl p-3 text-sm text-gray-700 shadow-sm">{r}</div>
            ))}
            <button onClick={() => setAiResults([])} className="text-xs text-purple-500 mt-2">Limpiar</button>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── SEARCH FRIENDS SCREEN ───────────────────────────────────────────────────
function SearchFriendsScreen({ onNavigate, following, onFollow }: {
  onNavigate: (screen: Screen) => void;
  following: Set<string>;
  onFollow: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<UserType | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<Set<string>>(new Set(FRIENDS.filter(f => f.following).map(f => f.id)));
  const [toast, setToast] = useState('');
  const [incomingRequests, setIncomingRequests] = useState<string[]>(
    // Simulate 2 incoming requests from random non-following friends
    FRIENDS.filter(f => !f.following).slice(0, 2).map(f => f.id)
  );

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const mutualFriends = (f: UserType) => {
    // Simulate mutual friends count based on friend's friendsCount
    return Math.floor(f.friendsCount * 0.15 + 1);
  };

  const sendRequest = (id: string) => {
    setPendingRequests(prev => new Set([...prev, id]));
    onFollow(id);
    showToast('Solicitud de amistad enviada ✓');
  };

  const acceptRequest = (id: string) => {
    setIncomingRequests(prev => prev.filter(r => r !== id));
    setFriends(prev => new Set([...prev, id]));
    onFollow(id);
    showToast('¡Ahora son amigos! 🎉');
  };

  const results = query.length > 1
    ? FRIENDS.filter(f => `${f.name} ${f.lastName}`.toLowerCase().includes(query.toLowerCase())).slice(0, 20)
    : FRIENDS.slice(0, 30);

  if (selectedFriend) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <BackButton onBack={() => setSelectedFriend(null)} />
        <FriendProfileView
          friend={selectedFriend}
          isFollowing={following.has(selectedFriend.id)}
          onFollow={() => onFollow(selectedFriend.id)}
          onMessage={() => onNavigate('messages')}
          onBuy={p => window.open(p.url, '_blank')}
          onLike={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>

      {/* Incoming friend requests */}
      {!query && incomingRequests.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Solicitudes recibidas</p>
          <div className="space-y-2">
            {incomingRequests.map(id => {
              const f = FRIENDS.find(fr => fr.id === id);
              if (!f) return null;
              return (
                <div key={id} className="bg-purple-50 border border-purple-100 rounded-2xl p-3 flex items-center gap-3">
                  <button onClick={() => setSelectedFriend(f)}><Avatar src={f.avatar} size={48} /></button>
                  <button onClick={() => setSelectedFriend(f)} className="flex-1 text-left">
                    <p className="font-semibold text-gray-800 text-sm">{f.name} {f.lastName}</p>
                    <p className="text-xs text-gray-500">{mutualFriends(f)} amigos en común</p>
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => acceptRequest(id)}
                      className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-xl font-semibold">
                      Aceptar
                    </button>
                    <button onClick={() => setIncomingRequests(prev => prev.filter(r => r !== id))}
                      className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1.5 rounded-xl font-semibold">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!query && <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Personas que quizás conoces</p>}
      <div className="space-y-2">
        {results.map(f => (
          <div key={f.id} className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
            <button onClick={() => setSelectedFriend(f)}>
              <Avatar src={f.avatar} size={48} />
            </button>
            <button onClick={() => setSelectedFriend(f)} className="flex-1 text-left min-w-0">
              <p className="font-semibold text-gray-800 text-sm">{f.name} {f.lastName}</p>
              <p className="text-xs text-gray-400">
                {friends.has(f.id)
                  ? '✓ Amigos'
                  : `${mutualFriends(f)} amigos en común`}
              </p>
            </button>
            {friends.has(f.id) ? (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-xl font-semibold">Amigos ✓</span>
            ) : pendingRequests.has(f.id) ? (
              <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-xl font-semibold">Pendiente</span>
            ) : (
              <button onClick={() => sendRequest(f.id)}
                className="bg-purple-600 text-white text-sm px-3 py-1.5 rounded-xl font-semibold transition">
                Seguir
              </button>
            )}
          </div>
        ))}
      </div>
      {toast && <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm z-50">{toast}</div>}
    </div>
  );
}

// ─── MESSAGING SCREEN ────────────────────────────────────────────────────────
function MessagingScreen({ forwardProduct }: { forwardProduct?: Product | null }) {
  const [convs, setConvs] = useState<Conversation[]>(CONVERSATIONS);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [text, setText] = useState('');
  const [showForward, setShowForward] = useState(!!forwardProduct);
  const [forwardSent, setForwardSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selected?.messages]);

  const addMsg = (convId: string, content: string) => {
    const newMsg: Message = { id: `m${Date.now()}`, fromId: 'me', content, timestamp: 'ahora' };
    setConvs(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, newMsg], unread: 0 } : c));
    if (selected?.id === convId) setSelected(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : null);
    return newMsg;
  };

  const send = () => {
    if (!text.trim() || !selected) return;
    const newMsg = addMsg(selected.id, text);
    setText('');
    // Simulate reply
    setTimeout(() => {
      const replies = ['😊', '¡Genial!', '🔥 Me parece buena idea', 'Sí, lo vi!', '¡Gracias por avisarme!'];
      const reply: Message = { id: `r${Date.now()}`, fromId: selected.user.id, content: replies[Math.floor(Math.random() * replies.length)], timestamp: 'ahora' };
      setConvs(prev => prev.map(c => c.id === selected.id ? { ...c, messages: [...c.messages, newMsg, reply] } : c));
      setSelected(prev => prev ? { ...prev, messages: [...prev.messages, newMsg, reply] } : null);
    }, 1200);
  };

  // Forward product modal (shown when forwardProduct is passed or user clicks forward)
  if (showForward && forwardProduct && !forwardSent) {
    return (
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setShowForward(false)} className="text-gray-500"><ArrowLeft size={20} /></button>
          <h2 className="text-lg font-bold text-gray-800">Reenviar a...</h2>
        </div>
        {/* Product preview */}
        <div className="bg-white rounded-2xl border border-gray-100 flex gap-3 p-3 mb-4 shadow-sm">
          <img src={forwardProduct.image} alt={forwardProduct.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-purple-600 font-medium">{forwardProduct.brand}</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{forwardProduct.name}</p>
            <p className="text-sm font-bold text-gray-900">{fmt(forwardProduct.price)}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Selecciona un contacto</p>
        <div className="space-y-2">
          {convs.map(conv => (
            <button key={conv.id} onClick={() => {
              addMsg(conv.id, `🎁 *${forwardProduct.name}* — ${fmt(forwardProduct.price)}\n${forwardProduct.url}`);
              setForwardSent(true);
              setTimeout(() => setForwardSent(false), 2000);
              setSelected(conv);
              setShowForward(false);
            }}
              className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-left hover:bg-purple-50 transition">
              <Avatar src={conv.user.avatar} size={44} />
              <p className="font-semibold text-gray-800">{conv.user.name} {conv.user.lastName}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (selected) {
    const conv = convs.find(c => c.id === selected.id) || selected;
    return (
      <div className="flex flex-col h-[calc(100vh-130px)] max-w-lg mx-auto">
        <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100 sticky top-0">
          <button onClick={() => setSelected(null)}><ArrowLeft size={20} className="text-gray-600" /></button>
          <Avatar src={conv.user.avatar} size={40} online />
          <div className="flex-1">
            <p className="font-semibold text-gray-800">{conv.user.name} {conv.user.lastName}</p>
            <p className="text-xs text-green-500">En línea</p>
          </div>
          {MY_WISHES.length > 0 && (
            <button onClick={() => setShowForward(true)} title="Compartir producto"
              className="text-gray-400 hover:text-purple-600 p-1 transition">
              <Gift size={18} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {conv.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.fromId === 'me' ? 'justify-end' : 'justify-start'}`}>
              {msg.fromId !== 'me' && <Avatar src={conv.user.avatar} size={28} />}
              <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm mx-2 ${msg.fromId === 'me' ? 'bg-purple-600 text-white' : 'bg-white text-gray-800 shadow-sm border border-gray-100'}`}>
                {msg.content.startsWith('🎁') ? (
                  <div>
                    <p className="font-semibold mb-1">📦 Producto compartido</p>
                    <p className="text-xs opacity-80 line-clamp-2">{msg.content.replace(/\n.*/, '')}</p>
                  </div>
                ) : msg.content}
                <p className={`text-xs mt-1 ${msg.fromId === 'me' ? 'text-purple-200' : 'text-gray-400'}`}>{msg.timestamp}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <button onClick={send} className="bg-purple-600 text-white p-2.5 rounded-2xl">
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Mensajes</h2>
      {forwardSent && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-2xl mb-4 text-center font-medium">
          ✓ Producto reenviado correctamente
        </div>
      )}
      <div className="space-y-2">
        {convs.map(conv => {
          const last = conv.messages[conv.messages.length - 1];
          return (
            <button key={conv.id} onClick={() => { setSelected(conv); setConvs(p => p.map(c => c.id === conv.id ? { ...c, unread: 0 } : c)); }}
              className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition">
              <div className="relative">
                <Avatar src={conv.user.avatar} size={52} online />
                {conv.unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full text-white text-xs flex items-center justify-center">{conv.unread}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{conv.user.name} {conv.user.lastName}</p>
                <p className={`text-sm truncate ${conv.unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                  {last.fromId === 'me' ? 'Tú: ' : ''}{last.content.startsWith('🎁') ? '🎁 Producto compartido' : last.content}
                </p>
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">{last.timestamp}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── ADD PRODUCT TAB ─────────────────────────────────────────────────────────
type ScrapedProduct = {
  title: string; price: number | null; currency: string;
  imageUrl: string | null; store: string; sourceUrl: string;
};

function AddProductTab({ lists, onSaved }: {
  lists: { id: string; name: string; emoji: string }[];
  onSaved: (p: Product, listId: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [scraped, setScraped] = useState<ScrapedProduct | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImg, setEditImg] = useState('');
  const [editNote, setEditNote] = useState('');
  const [imgError, setImgError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [destList, setDestList] = useState('wishes');
  const [isGroupFund, setIsGroupFund] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const SITES = ['Falabella', 'Paris', 'Ripley', 'Sodimac', 'Easy', 'MercadoLibre', 'PC Factory', 'Froens', 'Lippi', 'Zara', 'IKEA'];

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!scraped) return;
      const items = Array.from(e.clipboardData?.items ?? []);
      const img = items.find(i => i.type.startsWith('image/'));
      if (!img) return;
      const file = img.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { setEditImg(ev.target?.result as string); setImgError(false); };
      reader.readAsDataURL(file);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [scraped]);

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(''); setScraped(null); setImgError(false);
    const steps = ['Conectando al sitio...', 'Extrayendo información...', 'Procesando imagen...', 'Revisando precio...'];
    let i = 0; setLoadingStep(steps[0]);
    const interval = setInterval(() => { i = (i + 1) % steps.length; setLoadingStep(steps[i]); }, 1800);
    try {
      const apiBase = import.meta.env['VITE_API_URL'] ?? '';
      const res = await fetch(`${apiBase}/api/extract-product?url=${encodeURIComponent(url.trim())}`);
      const json = await res.json();
      clearInterval(interval);
      if (!json.ok) throw new Error(json.error || 'Error desconocido');
      const p: ScrapedProduct = json.data;
      setScraped(p);
      setEditName(p.title || '');
      setEditPrice(p.price != null ? String(p.price) : '');
      setEditImg(p.imageUrl || '');
      setEditNote('');
      // sugerir fondo si precio > 100k
      setIsGroupFund((p.price ?? 0) > 100_000);
    } catch (e: unknown) {
      clearInterval(interval);
      setError(e instanceof Error ? e.message : 'No se pudo analizar el producto.');
    } finally { setLoading(false); setLoadingStep(''); }
  };

  // ── Drag & drop handlers ──────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    // 1. Image file dropped
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => { setEditImg(ev.target?.result as string); setImgError(false); };
      reader.readAsDataURL(file);
      return;
    }
    // 2. URL text / link dragged from browser
    const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (text?.startsWith('http')) { setEditImg(text); setImgError(false); }
  };

  const save = () => {
    if (!scraped) return;
    const price = parseInt(editPrice.replace(/\D/g, ''), 10) || 0;
    let brand = scraped.store !== 'unknown' ? scraped.store : 'tienda';
    try { brand = new URL(scraped.sourceUrl).hostname.replace('www.', ''); } catch { /* ok */ }
    const product: Product = {
      id: 'user_' + Date.now(),
      name: editName || scraped.title,
      brand, price,
      image: editImg || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
      url: scraped.sourceUrl, liked: true, category: 'General',
      note: editNote.trim() || undefined,
      isGroupFund,
    };
    onSaved(product, destList);
    setScraped(null); setUrl(''); setEditName(''); setEditPrice(''); setEditImg(''); setEditNote(''); setIsGroupFund(false);
  };

  const priceNum = parseInt(editPrice || '0', 10);

  return (
    <div>
      {/* ── URL Input ── */}
      {!scraped && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
              <Sparkles size={16} className="text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-800">Agregar desde cualquier tienda</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Pega el link del producto y extraemos todo automáticamente</p>

          <div className="relative mb-3">
            <input value={url} onChange={e => { setUrl(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && analyze()}
              placeholder="https://falabella.cl/producto..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm pr-12 focus:outline-none focus:border-purple-400 transition" />
            {url && (
              <button onClick={() => setUrl('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex items-start gap-2">
              <X size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button onClick={analyze} disabled={loading || !url.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition shadow-sm shadow-purple-200">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {loadingStep}</>
              : <><Sparkles size={16} /> Analizar producto</>}
          </button>

          {loading && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="h-48 bg-gradient-to-r from-gray-100 to-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-1/3 mt-2" />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {SITES.map(s => (
              <span key={s} className="text-xs bg-gray-50 border border-gray-200 text-gray-500 px-2.5 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Product Preview ── */}
      {scraped && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mb-4">

          {/* Image with drag & drop */}
          <div ref={dropRef}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            className={`relative bg-gray-50 h-56 transition-all ${isDragging ? 'ring-4 ring-purple-400 ring-inset bg-purple-50' : ''}`}>
            {isDragging && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <Package size={36} className="text-purple-400 mb-2" />
                <p className="text-purple-600 font-semibold text-sm">Suelta la imagen aquí</p>
              </div>
            )}
            {editImg && !imgError ? (
              <img src={editImg} alt={editName} className="w-full h-full object-contain p-2" onError={() => setImgError(true)} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                <Package size={48} />
                <p className="text-xs mt-2">Sin imagen · arrastra una foto aquí</p>
              </div>
            )}
            {scraped.store && scraped.store !== 'unknown' && (
              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-purple-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm capitalize">
                {scraped.store}
              </span>
            )}
            <div className="absolute bottom-3 right-3 flex gap-2">
              {/* Drag hint */}
              <div className="flex flex-col items-end gap-1">
                <span className="bg-white/80 text-gray-500 text-xs px-2 py-1 rounded-lg">arrastra imagen</span>
                <span className="bg-white/80 text-gray-500 text-xs px-2 py-1 rounded-lg">o presiona Ctrl+V para pegar imagen</span>
              </div>
              <button onClick={() => {
                const newUrl = window.prompt('URL de imagen:', editImg || '');
                if (newUrl !== null) { setEditImg(newUrl); setImgError(false); }
              }} className="bg-white/90 backdrop-blur text-gray-600 text-xs px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                <Edit3 size={11} /> Cambiar URL
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Editable name */}
            <input value={editName} onChange={e => setEditName(e.target.value)}
              className="w-full font-semibold text-gray-800 text-sm mb-2 border-b border-transparent hover:border-purple-200 focus:border-purple-400 focus:outline-none transition py-0.5"
              placeholder="Nombre del producto" />

            {/* Editable price */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-gray-400 text-sm">$</span>
              <input value={editPrice} onChange={e => setEditPrice(e.target.value.replace(/\D/g, ''))}
                placeholder="Ingresa el precio"
                className="flex-1 text-2xl font-bold text-gray-900 border-b border-transparent hover:border-purple-200 focus:border-purple-400 focus:outline-none transition" />
              {editPrice && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{fmt(priceNum)}</span>
              )}
            </div>

            {/* Note / talla */}
            <div className="mb-3">
              <input value={editNote} onChange={e => setEditNote(e.target.value)}
                placeholder="💬 Talla, color, preferencia (opcional)..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-purple-400 transition" />
            </div>

            {/* Group fund toggle — sugerido automáticamente si precio > $100.000 */}
            <button onClick={() => setIsGroupFund(v => !v)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-4 transition text-left ${isGroupFund ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'}`}>
              <span className="text-2xl">{isGroupFund ? '🎁' : '💸'}</span>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${isGroupFund ? 'text-purple-700' : 'text-gray-700'}`}>
                  {isGroupFund ? 'Fondo grupal activado' : 'Convertir en fondo grupal'}
                </p>
                <p className="text-xs text-gray-500">Tus amigos pueden aportar para este regalo</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors ${isGroupFund ? 'bg-purple-500' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full mt-1 shadow transition-all ${isGroupFund ? 'ml-5' : 'ml-1'}`} />
              </div>
            </button>

            <a href={scraped.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-purple-500 flex items-center gap-1 hover:underline mb-4 truncate">
              <ExternalLink size={11} /> {scraped.sourceUrl.replace(/^https?:\/\//, '').slice(0, 60)}
            </a>

            {/* Destination list */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Guardar en:</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setDestList('wishes')}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition border ${destList === 'wishes' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                  ⭐ Mis Deseos
                </button>
                {lists.map(l => (
                  <button key={l.id} onClick={() => setDestList(l.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition border ${destList === l.id ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                    {l.emoji} {l.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={save}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm shadow-purple-200">
                <Heart size={16} fill="white" /> {isGroupFund ? 'Guardar como fondo' : 'Guardar en wishlist'}
              </button>
              <button onClick={() => { setScraped(null); setUrl(''); setError(''); }}
                className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 transition">
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROFILE SCREEN ──────────────────────────────────────────────────────────
function ProfileScreen({ onNavigate, currentUser, onLogout, onUserUpdate }: {
  onNavigate: (screen: Screen) => void;
  currentUser: AppUser & { avatar: string; name: string };
  onLogout: () => void;
  onUserUpdate: (u: AppUser) => void;
}) {
  type PTab = 'wishes' | 'funds' | 'add';
  const [tab, setTab] = useState<PTab>('wishes');
  const [editMode, setEditMode] = useState(false);
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileBio, setProfileBio] = useState(ME.bio);
  const [wishes, setWishes] = useState<Product[]>(MY_WISHES);
  const [lists, setLists] = useState(MY_LISTS.map(l => ({ ...l, products: [...l.products] })));
  const [funds, setFunds] = useState<GroupFund[]>(MY_GROUP_FUNDS);
  const [selectedList, setSelectedList] = useState<typeof lists[0] | null>(null);
  const [selectedFund, setSelectedFund] = useState<GroupFund | null>(null);
  // Create list form
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListEmoji, setNewListEmoji] = useState('🎁');
  // Note editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [toast, setToast] = useState('');
  const [showOwnerAmount, setShowOwnerAmount] = useState(false);
  const [selectedWish, setSelectedWish] = useState<Product | null>(null);
  const [likedWishes, setLikedWishes] = useState<Set<string>>(new Set());
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventLinkedWishes, setEventLinkedWishes] = useState<string[]>([]);
  const [myEvents, setMyEvents] = useState<{id:string;title:string;date:string;location:string;wishes:Product[]}[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const newAvatar = ev.target?.result as string;
      const updated: AppUser = { ...currentUser, avatar: newAvatar };
      onUserUpdate(updated);
      const all = getStoredUsers().map(u => u.id === updated.id ? updated : u);
      saveStoredUsers(all);
      // Sync to Supabase
      if (isSupabaseConfigured && supabase) {
        supabase.from('profiles').update({ avatar: newAvatar }).eq('id', updated.id).then(() => {});
      }
    };
    reader.readAsDataURL(file);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };


  // Fund detail
  if (selectedFund) {
    const pct = Math.round((selectedFund.currentAmount / selectedFund.targetAmount) * 100);
    return (
      <div className="max-w-lg mx-auto px-4">
        <BackButton onBack={() => setSelectedFund(null)} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <img src={selectedFund.product.image} alt={selectedFund.product.name} className="w-full h-48 object-cover" />
          <div className="p-5">
            <p className="text-purple-600 text-sm font-medium">{selectedFund.product.brand}</p>
            <h2 className="text-xl font-bold text-gray-800">{selectedFund.name}</h2>
            <p className="text-gray-500 text-sm">{selectedFund.product.name}</p>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Progreso</span>
                <span className="font-semibold text-purple-600">{pct}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{fmt(selectedFund.currentAmount)} recaudados</span>
                <span>Meta: {fmt(selectedFund.targetAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Contribuidores ({selectedFund.contributors.length})</h3>
            {selectedFund.isOwner && (
              <button onClick={() => setShowOwnerAmount(!showOwnerAmount)}
                className="flex items-center gap-1 text-xs text-purple-600 font-medium">
                {showOwnerAmount ? <EyeOff size={14} /> : <Eye size={14} />}
                {showOwnerAmount ? 'Ocultar montos' : 'Ver montos'}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {selectedFund.contributors.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <Avatar src={c.user.avatar} size={40} />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{c.user.name} {c.user.lastName}</p>
                  <p className="text-xs text-gray-400">{c.date}</p>
                </div>
                {selectedFund.isOwner && showOwnerAmount
                  ? <p className="font-bold text-green-600 text-sm">{fmt(c.amount)}</p>
                  : <p className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Aportó ✓</p>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const createList = () => {
    if (!newListName.trim()) return;
    const newL = { id: 'list_' + Date.now(), name: newListName.trim(), emoji: newListEmoji, products: [] };
    setLists(prev => [...prev, newL]);
    setNewListName(''); setNewListEmoji('🎁'); setShowNewList(false);
    showToast(`Lista "${newL.name}" creada ✓`);
  };

  const saveNote = (id: string) => {
    setWishes(prev => prev.map(w => w.id === id ? { ...w, note: noteInput.trim() || undefined } : w));
    setEditingNoteId(null); setNoteInput('');
  };

  // List detail
  if (selectedList) {
    return (
      <div className="max-w-lg mx-auto px-4">
        <BackButton onBack={() => setSelectedList(null)} />
        <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedList.emoji} {selectedList.name}</h2>
        <div className="grid grid-cols-2 gap-3">
          {selectedList.products.length === 0
            ? <p className="col-span-2 text-gray-400 text-sm text-center py-10">Esta lista está vacía. Agrega productos desde "➕ Agregar".</p>
            : selectedList.products.map(p => (
              <ProductCard key={p.id} product={p}
                onLike={() => showToast('Guardado ✓')}
                onBuy={p => window.open(p.url, '_blank')}
                isOwner
              />
            ))}
        </div>
        {toast && <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm z-50">{toast}</div>}
      </div>
    );
  }

  return (
    <>
    <div className="max-w-lg mx-auto">
      {/* ── Instagram-style profile header ── */}
      <div className="bg-white mb-0.5">
        {/* Top row: pic + stats */}
        <div className="flex items-center gap-4 px-4 pt-5 pb-3">
          {/* Avatar with ring + tap to change */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
              <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                <img src={currentUser.avatar} alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover cursor-pointer"
                  onClick={() => fileInputRef.current?.click()} />
              </div>
            </div>
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white">
              <Plus size={12} className="text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around">
            {[
              [String(wishes.length), 'deseos'],
              [String(lists.length), 'listas'],
              [String(funds.length > 0 ? funds.length : 0), 'fondos'],
            ].map(([n, label]) => (
              <div key={label} className="text-center">
                <p className="font-bold text-gray-900 text-lg leading-tight">{n}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Name + username + bio */}
        <div className="px-4 pb-3">
          {editMode ? (
            <div className="space-y-2">
              <input value={profileName} onChange={e => setProfileName(e.target.value)}
                className="w-full font-bold text-gray-900 border-b border-purple-300 focus:outline-none text-sm pb-1" placeholder="Nombre" />
              <textarea value={profileBio} onChange={e => setProfileBio(e.target.value)}
                rows={2} className="w-full text-xs text-gray-500 border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:border-purple-300" placeholder="Biografía..." />
              <button onClick={() => {
                const updated: AppUser = { ...currentUser, name: profileName, bio: profileBio };
                onUserUpdate(updated);
                const all = getStoredUsers().map(u => u.id === updated.id ? updated : u);
                saveStoredUsers(all);
                if (isSupabaseConfigured && supabase) {
                  supabase.from('profiles').update({ name: updated.name, bio: updated.bio }).eq('id', updated.id).then(() => {});
                }
                setEditMode(false);
              }} className="bg-purple-600 text-white text-xs px-4 py-1.5 rounded-lg font-semibold">Guardar</button>
            </div>
          ) : (
            <>
              <p className="font-bold text-gray-900 text-sm">{profileName}</p>
              <p className="text-xs text-gray-400">@{(currentUser as AppUser & {username?:string}).username ?? 'usuario'}</p>
              {profileBio && <p className="text-xs text-gray-600 mt-1">{profileBio}</p>}
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-4 pb-4">
          <button onClick={() => setEditMode(v => !v)}
            className="flex-1 border border-gray-300 text-gray-800 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
            {editMode ? 'Cancelar' : 'Editar perfil'}
          </button>
          <button onClick={() => onNavigate('messages')}
            className="flex-1 border border-gray-300 text-gray-800 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
            Compartir
          </button>
        </div>

        {/* Highlights (lists as stories) */}
        {lists.length > 0 && (
          <div className="flex gap-4 px-4 pb-4 overflow-x-auto hide-scrollbar">
            {lists.map(list => (
              <button key={list.id} onClick={() => setSelectedList(list)} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center bg-gray-50 text-2xl">
                  {list.emoji}
                </div>
                <span className="text-[10px] text-gray-600 w-14 text-center truncate">{list.name}</span>
              </button>
            ))}
            <button onClick={() => { setShowNewList(true); }} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <Plus size={20} className="text-gray-400" />
              </div>
              <span className="text-[10px] text-gray-400 w-14 text-center">Nueva</span>
            </button>
          </div>
        )}

        {/* Tab bar — deseos / fondos / add */}
        <div className="flex border-t border-gray-200">
          {([
            ['wishes', '⊞'],
            ['funds', '💰'],
            ['add', '＋'],
          ] as [PTab, string][]).map(([key, icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-3 text-base transition border-t-2 ${tab === key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'}`}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
      {/* ── Wishes — card list with price, like, note ── */}
      {tab === 'wishes' && (
        wishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">⭐</span>
            <p className="text-gray-500 font-medium">Aún no tienes deseos</p>
            <p className="text-gray-400 text-sm mt-1">Ve a "➕ Agregar" para empezar</p>
          </div>
        ) : (
          <div className="space-y-3 pt-3">
            {wishes.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex gap-0">
                {/* Image */}
                <button onClick={() => setSelectedWish(p)} className="flex-shrink-0 w-24 h-24 bg-gray-50 overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop'; }} />
                </button>
                {/* Info */}
                <div className="flex-1 p-3 min-w-0">
                  <button onClick={() => setSelectedWish(p)} className="w-full text-left">
                    <p className="text-xs text-purple-600 font-medium capitalize truncate">{p.brand}</p>
                    <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{p.name}</p>
                    <p className="text-base font-bold text-gray-900 mt-0.5">{p.price > 0 ? fmt(p.price) : '—'}</p>
                  </button>
                  {p.note && (
                    <p className="text-xs text-purple-500 mt-1 truncate">💬 {p.note}</p>
                  )}
                  {/* Editing note inline */}
                  {editingNoteId === p.id && (
                    <div className="mt-1 flex gap-1">
                      <input autoFocus value={noteInput} onChange={e => setNoteInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveNote(p.id); if (e.key === 'Escape') { setEditingNoteId(null); } }}
                        placeholder="Talla, color, nota..."
                        className="flex-1 text-xs border border-purple-300 rounded-lg px-2 py-1 focus:outline-none" />
                      <button onClick={() => saveNote(p.id)} className="text-xs bg-purple-600 text-white px-2 py-1 rounded-lg">✓</button>
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex flex-col items-center justify-between p-2 gap-1">
                  <button
                    onClick={() => setLikedWishes(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}
                    className={`p-1.5 rounded-full transition ${likedWishes.has(p.id) ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}>
                    <Heart size={18} fill={likedWishes.has(p.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => { setEditingNoteId(editingNoteId === p.id ? null : p.id); setNoteInput(p.note ?? ''); }}
                    className="p-1.5 text-gray-300 hover:text-purple-500 transition">
                    <Edit3 size={16} />
                  </button>
                  {p.isGroupFund && <span className="text-sm">🎁</span>}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Group Funds */}
      {tab === 'funds' && (
        <div className="space-y-4">
          {funds.map(fund => {
            const pct = Math.round((fund.currentAmount / fund.targetAmount) * 100);
            return (
              <div key={fund.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <img src={fund.product.image} alt={fund.product.name} className="w-full h-36 object-cover" />
                <div className="p-4">
                  <p className="font-bold text-gray-800">{fund.name}</p>
                  <p className="text-xs text-gray-500 mb-3">{fund.product.name}</p>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-3">
                    <span>{fmt(fund.currentAmount)}</span><span>Meta {fmt(fund.targetAmount)}</span>
                  </div>
                  <button onClick={() => setSelectedFund(fund)}
                    className="w-full border border-purple-200 text-purple-600 py-2 rounded-xl text-sm font-semibold">
                    Ver detalle del fondo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Event Creation ── */}
      {tab === 'funds' && (
        <div className="mt-4">
          {/* Create event button */}
          {!showEventForm ? (
            <button onClick={() => setShowEventForm(true)}
              className="w-full border-2 border-dashed border-indigo-300 rounded-2xl p-4 flex items-center gap-3 text-indigo-600 hover:bg-indigo-50 transition mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Crear invitación a evento</p>
                <p className="text-xs text-gray-400">Vincula tus deseos a un evento especial</p>
              </div>
            </button>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-indigo-300 p-4 shadow-sm mb-4">
              <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Calendar size={16} className="text-indigo-500" /> Nuevo Evento</p>
              <input value={eventTitle} onChange={e => setEventTitle(e.target.value)}
                placeholder="Título del evento (ej: Mi cumpleaños 🎂)"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400 transition mb-2" />
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400 transition mb-2" />
              <input value={eventLocation} onChange={e => setEventLocation(e.target.value)}
                placeholder="Lugar (ej: Santiago, Chile)"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400 transition mb-3" />
              {wishes.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Vincular deseos:</p>
                  <div className="flex flex-col gap-1.5">
                    {wishes.slice(0, 5).map(w => (
                      <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={eventLinkedWishes.includes(w.id)}
                          onChange={e => setEventLinkedWishes(prev => e.target.checked ? [...prev, w.id] : prev.filter(id => id !== w.id))}
                          className="accent-indigo-600" />
                        <span className="text-xs text-gray-700 truncate">{w.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">{w.price > 0 ? fmt(w.price) : ''}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => {
                  if (!eventTitle.trim() || !eventDate) return;
                  const linked = wishes.filter(w => eventLinkedWishes.includes(w.id));
                  setMyEvents(prev => [...prev, { id: 'ev_' + Date.now(), title: eventTitle.trim(), date: eventDate, location: eventLocation.trim(), wishes: linked }]);
                  setShowEventForm(false); setEventTitle(''); setEventDate(''); setEventLocation(''); setEventLinkedWishes([]);
                  showToast('¡Evento creado! 🎉');
                }} disabled={!eventTitle.trim() || !eventDate}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-40">
                  Crear evento 🎉
                </button>
                <button onClick={() => setShowEventForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm">Cancelar</button>
              </div>
            </div>
          )}
          {/* My events list */}
          {myEvents.map(ev => (
            <div key={ev.id} className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎉</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{ev.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={11} />
                    {new Date(ev.date).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  {ev.location && <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={11} /> {ev.location}</p>}
                  {ev.wishes.length > 0 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {ev.wishes.map(w => (
                        <div key={w.id} className="flex-shrink-0 bg-white rounded-lg p-1.5 text-xs text-gray-700 border border-indigo-100 flex items-center gap-1">
                          <img src={w.image} alt="" className="w-6 h-6 rounded object-cover" />
                          <span className="truncate max-w-[80px]">{w.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product */}
      {tab === 'add' && (
        <AddProductTab
          lists={lists}
          onSaved={(product, listId) => {
            if (listId === 'wishes') {
              setWishes(prev => [product, ...prev]);
            } else {
              setLists(prev => prev.map(l =>
                l.id === listId ? { ...l, products: [product, ...l.products] } : l
              ));
            }
            // Si es fondo grupal, agrégalo también a fondos
            if (product.isGroupFund) {
              const newFund: GroupFund = {
                id: 'fund_' + Date.now(),
                name: product.name,
                product,
                targetAmount: product.price,
                currentAmount: 0,
                contributors: [],
                isOwner: true,
              };
              setFunds(prev => [newFund, ...prev]);
            }
            const dest = listId === 'wishes' ? 'Mis Deseos' : lists.find(l => l.id === listId)?.name ?? 'lista';
            showToast(`${product.isGroupFund ? '🎁 Fondo creado' : '⭐ Guardado'} en ${dest}`);
            setTab(product.isGroupFund ? 'funds' : 'wishes');
          }}
        />
      )}

      {toast && <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm z-50">{toast}</div>}
      </div>{/* end px-4 */}
    </div>{/* end max-w-lg */}

    {/* ── Wish bottom-sheet modal ── */}
    {selectedWish && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setSelectedWish(null)}>
        <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto pb-safe" onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
          <img src={selectedWish.image} alt={selectedWish.name} className="w-full h-56 object-contain bg-gray-50 px-4"
            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'; }} />
          <div className="p-5">
            <p className="text-xs text-purple-600 font-medium capitalize mb-1">{selectedWish.brand}</p>
            <p className="font-bold text-gray-800 text-lg leading-snug mb-1">{selectedWish.name}</p>
            <p className="text-2xl font-extrabold text-gray-900 mb-3">{selectedWish.price > 0 ? fmt(selectedWish.price) : 'Sin precio'}</p>
            {selectedWish.note && (
              <p className="text-sm text-purple-600 bg-purple-50 rounded-xl px-3 py-2 mb-3">💬 {selectedWish.note}</p>
            )}
            <div className="flex flex-col gap-2">
              <button onClick={() => { const w = selectedWish; setSelectedWish(null); setEditingNoteId(w.id); setNoteInput(w.note ?? ''); setTab('wishes'); }}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-3 rounded-2xl font-semibold text-sm">
                <Edit3 size={15} /> {selectedWish.note ? 'Editar nota' : 'Agregar nota'}
              </button>
              <button onClick={() => window.open(selectedWish.url, '_blank')}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-2xl font-semibold text-sm">
                <ExternalLink size={15} /> Ver producto
              </button>
              <button onClick={() => { setWishes(prev => prev.filter(w => w.id !== selectedWish.id)); setSelectedWish(null); showToast('Deseo eliminado'); }}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-500 py-3 rounded-2xl font-semibold text-sm">
                <X size={15} /> Eliminar deseo
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function Navigation({ current, onNavigate }: { current: Screen; onNavigate: (s: Screen) => void }) {
  const items: { screen: Screen; icon: React.ReactNode; label: string }[] = [
    { screen: 'home', icon: <Home size={22} />, label: 'Inicio' },
    { screen: 'discover', icon: <Search size={22} />, label: 'Descubrir' },
    { screen: 'search', icon: <Users size={22} />, label: 'Amigos' },
    { screen: 'messages', icon: <MessageCircle size={22} />, label: 'Mensajes' },
    { screen: 'profile', icon: <User size={22} />, label: 'Perfil' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 z-40 shadow-lg">
      {items.map(({ screen, icon, label }) => (
        <button key={screen} onClick={() => onNavigate(screen)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${current === screen ? 'text-purple-600' : 'text-gray-400'}`}>
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── AUTH SCREEN (Login + Register) ──────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (user: AppUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && (!name.trim() || !username.trim())) {
      setError('Completa nombre y usuario.'); return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos.'); return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.'); return;
    }

    setLoading(true);
    try {
      // ── Supabase auth (production) ────────────────────────────────────────
      if (isSupabaseConfigured && supabase) {
        if (mode === 'login') {
          const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
          if (authErr) throw new Error(authErr.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : authErr.message);
          if (!data.user) throw new Error('No se pudo iniciar sesión.');
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          onAuth(mapSupabaseUser(data.user, profile));
        } else {
          // Check duplicate username
          const { data: existing } = await supabase.from('profiles').select('id').eq('username', username.toLowerCase()).single();
          if (existing) { setError('Ese usuario ya existe.'); return; }

          const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=7C3AED&textColor=ffffff`;
          const { data, error: authErr } = await supabase.auth.signUp({
            email, password,
            options: { data: { name: name.trim(), username: username.toLowerCase() } }
          });
          if (authErr) throw new Error(authErr.message);
          if (!data.user) throw new Error('No se pudo crear la cuenta.');

          // Upsert profile
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: name.trim(),
            username: username.toLowerCase(),
            avatar: avatarUrl,
            bio: '',
          });

          onAuth(mapSupabaseUser(data.user, { name: name.trim(), username: username.toLowerCase(), avatar: avatarUrl, bio: '' }));
        }
        return;
      }

      // ── LocalStorage fallback (dev without Supabase) ──────────────────────
      if (mode === 'login') {
        const users = getStoredUsers();
        const found = users.find(u => u.email === email && u.passwordHash === simpleHash(password));
        if (!found) { setError('Email o contraseña incorrectos.'); return; }
        setStoredCurrent(found);
        onAuth(found);
      } else {
        const users = getStoredUsers();
        if (users.find(u => u.email === email)) { setError('Ya existe una cuenta con ese email.'); return; }
        if (users.find(u => u.username === username.toLowerCase())) { setError('Ese usuario ya existe.'); return; }
        const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=7C3AED&textColor=ffffff`;
        const newUser: AppUser = {
          id: String(Date.now()),
          name: name.trim(), username: username.toLowerCase(),
          email, passwordHash: simpleHash(password),
          avatar: avatarUrl, bio: '',
        };
        saveStoredUsers([...users, newUser]);
        setStoredCurrent(newUser);
        onAuth(newUser);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-200">
            <Gift size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">GiftLoop</h1>
          <p className="text-gray-500 text-sm mt-1">Tu wishlist social</p>
        </div>

        {/* Tabs */}
        <div className="flex w-full max-w-sm bg-gray-100 rounded-2xl p-1 mb-6">
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${mode === m ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}>
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
          {mode === 'register' && (
            <>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 bg-gray-50 transition" />
              <input value={username} onChange={e => setUsername(e.target.value.replace(/\s/g,'_').toLowerCase())}
                placeholder="@usuario" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 bg-gray-50 transition" />
            </>
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Correo electrónico"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 bg-gray-50 transition" />
          <div className="relative">
            <input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? 'text' : 'password'}
              placeholder="Contraseña" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 bg-gray-50 pr-12 transition" />
            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className="text-xs text-red-500 text-center bg-red-50 py-2 px-3 rounded-xl">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold disabled:opacity-60 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? (mode === 'login' ? 'Ingresando...' : 'Creando cuenta...') : (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta')}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-8 text-center max-w-xs">
          Al continuar aceptas los Términos de servicio y Política de privacidad de GiftLoop
        </p>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState<Screen>('home');
  // When Supabase is configured, start null and load from session
  // When not configured, load from localStorage
  const [appUser, setAppUser] = useState<AppUser | null>(() =>
    isSupabaseConfigured ? null : getStoredCurrent()
  );
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [following, setFollowing] = useState<Set<string>>(new Set(FRIENDS.filter(f => f.following).map(f => f.id)));
  const [showNotifications, setShowNotifications] = useState(false);

  // Supabase session init
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase!.from('profiles').select('*').eq('id', session.user.id).single();
        setAppUser(mapSupabaseUser(session.user, profile));
      }
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase!.from('profiles').select('*').eq('id', session.user.id).single();
        setAppUser(mapSupabaseUser(session.user, profile));
      } else if (event === 'SIGNED_OUT') {
        setAppUser(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigate = (s: Screen) => setScreen(s);
  const onFollow = (id: string) => setFollowing(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const NOTIFICATIONS = [
    { id: '1', avatar: FRIENDS[0].avatar, text: `${FRIENDS[0].name} agregó "AirPods Pro" a su wishlist`, time: '2m', unread: true },
    { id: '2', avatar: FRIENDS[1].avatar, text: `${FRIENDS[1].name} quiere el mismo producto que tú 🎯`, time: '15m', unread: true },
    { id: '3', avatar: FRIENDS[2].avatar, text: `¡Hoy es el cumpleaños de ${FRIENDS[2].name}! 🎂`, time: '1h', unread: true },
    { id: '4', avatar: FRIENDS[3].avatar, text: `${FRIENDS[3].name} empezó a seguirte`, time: '3h', unread: false },
    { id: '5', avatar: FRIENDS[4].avatar, text: `${FRIENDS[4].name} aportó $15.000 al fondo de tu MacBook Pro`, time: '5h', unread: false },
    { id: '6', avatar: FRIENDS[5].avatar, text: `${FRIENDS[5].name} comentó en tu lista "Navidad"`, time: '1d', unread: false },
  ];
  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  useEffect(() => {
    if (!showNotifications) return;
    const handler = () => setShowNotifications(false);
    setTimeout(() => window.addEventListener('click', handler), 0);
    return () => window.removeEventListener('click', handler);
  }, [showNotifications]);

  const handleAuth = (user: AppUser) => {
    setAppUser(user);
    if (!isSupabaseConfigured) setStoredCurrent(user);
  };
  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      setStoredCurrent(null);
    }
    setAppUser(null);
    setScreen('home');
  };
  const currentUser = appUser ?? { ...ME, name: 'Usuario', username: 'usuario', email: '', passwordHash: '', bio: '' };

  // Show loading spinner while Supabase checks session
  if (authLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center">
          <Gift size={24} className="text-white" />
        </div>
        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
  if (!appUser) return <AuthScreen onAuth={handleAuth} />;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* TOP BAR */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('home')} className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Gift size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-gray-800 text-lg tracking-tight">GiftLoop</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowNotifications(v => !v)} className="relative p-2 text-gray-500 hover:text-purple-600">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <p className="font-bold text-gray-800">Notificaciones</p>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400"><X size={16} /></button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {NOTIFICATIONS.map(n => (
                      <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition ${n.unread ? 'bg-purple-50/50' : ''}`}>
                        <img src={n.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${n.unread ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>{n.text}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                        {n.unread && <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => navigate('profile')}>
              <Avatar src={currentUser.avatar} size={32} />
            </button>
            <button onClick={() => { if (window.confirm('¿Cerrar sesión?')) handleLogout(); }}
              className="p-2 text-gray-400 hover:text-red-500 transition">
              <ArrowLeft size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* SCREEN CONTENT */}
      <main className="pb-20 pt-4">
        {screen === 'home' && <HomeScreen onNavigate={navigate} following={following} onFollow={onFollow} />}
        {screen === 'discover' && <DiscoverScreen />}
        {screen === 'search' && <SearchFriendsScreen onNavigate={navigate} following={following} onFollow={onFollow} />}
        {screen === 'messages' && <MessagingScreen />}

        {screen === 'profile' && <ProfileScreen onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} onUserUpdate={(u) => { setAppUser(u); setStoredCurrent(u); }} />}
      </main>

      <Navigation current={screen} onNavigate={navigate} />
    </div>
  );
}

// Re-export wrapped with ErrorBoundary so any crash shows a useful message
export default function AppWithBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
