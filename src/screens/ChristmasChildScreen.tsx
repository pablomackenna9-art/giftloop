import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Star, X, Send, Volume2, VolumeX } from 'lucide-react';
import {
  INTERESTS, loadWishes, saveWishes, XMAS_RED, XMAS_GREEN, XMAS_GOLD, fmtCLP
} from './xmas-data';
import type { ChildProfile, XmasWish } from './xmas-data';
import { loadProducts, loadStores } from './xmas-store-data';
import type { StoreProduct } from './xmas-store-data';

type Phase = 'video' | 'workshop' | 'favorites' | 'letter' | 'sent';

type Props = {
  child: ChildProfile;
  onBack: () => void;
};

function SnowBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map((x, i) => (
        <div key={x} className="absolute text-white select-none opacity-20 animate-bounce"
          style={{ left: `${x}%`, top: `${(i * 13) % 80}%`, fontSize: 10 + (i % 3) * 4, animationDelay: `${i * 0.5}s`, animationDuration: '4s' }}>
          ❄
        </div>
      ))}
    </div>
  );
}

export function ChristmasChildScreen({ child, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('video');
  const [wishes, setWishes] = useState<XmasWish[]>(() => loadWishes(child.id));
  const [freeText, setFreeText] = useState('');
  const [showFreeInput, setShowFreeInput] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [letterDecor, setLetterDecor] = useState('🎄');
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  const toggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(script);
    utter.lang = 'es-CL';
    utter.rate = 0.78;
    utter.pitch = 0.38;  // Very low pitch — deep old man voice
    utter.volume = 1;
    utter.onend = () => setIsPlaying(false);
    utter.onerror = () => setIsPlaying(false);
    utteranceRef.current = utter;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setIsPlaying(true);
  };

  const script = `¡Hohoho! ¡Hohoho! ¡Hola, ${child.name}! Qué alegría tan grande saludarte desde el Polo Norte. Mis ayudantes me contaron que estás preparando tu carta de Navidad. Tengo algunas ideas para mostrarte, pero también puedes contarme qué te haría ilusión recibir. Elige tus favoritos y prepararemos tu carta juntos. Recuerda, hohoho, que es una lista de deseos: ¡no siempre pueden llegar todos los regalos!`;

  // Build exclusion category list from adult config
  const excCats: string[] = child.exclusions.flatMap(e => {
    if (e === 'exc_tech') return ['tecnologia'];
    if (e === 'exc_screen') return ['tecnologia'];
    return [];
  });

  // Use multi-store catalog; apply mandatory filters
  const allProducts = loadProducts();
  const catalog = allProducts.filter(p => {
    if (p.status !== 'published') return false;
    if (p.price >= child.maxGiftPrice) return false;
    if (p.minAge !== undefined && p.minAge > child.age) return false;
    if (excCats.includes(p.category)) return false;
    if (p.stock !== 'unlimited' && Number(p.stock) === 0) return false;
    return true;
  });

  // Sort: interests first, then by price asc, avoid same-store concentration
  const scoredCatalog = catalog.map(p => {
    const interestMatch = child.interests.some(i => p.interests.includes(i) || p.category === i);
    return { ...p, _score: interestMatch ? 1 : 0 };
  }).sort((a, b) => b._score - a._score);

  const filtered = activeCategory === 'all'
    ? scoredCatalog
    : scoredCatalog.filter(p => p.category === activeCategory);

  const categories = ['all', ...Array.from(new Set(catalog.map(p => p.category)))];

  const isInCart = (id: string) => wishes.some(w => w.id === id && !w.isFree);
  const isFav = (id: string) => wishes.find(w => w.id === id)?.isFavorite ?? false;

  const toggleItem = (item: StoreProduct) => {
    setWishes(prev => {
      let updated: XmasWish[];
      if (isInCart(item.id)) {
        updated = prev.filter(w => w.id !== item.id);
      } else {
        const wish: XmasWish = {
          id: item.id, childId: child.id,
          name: item.name, price: item.price,
          image: item.images[0],
          store: item.storeId, category: item.category,
          isFavorite: false, isFree: false, adultStatus: 'none',
        };
        updated = [...prev, wish];
      }
      saveWishes(child.id, updated);
      return updated;
    });
  };

  const toggleFav = (id: string) => {
    const favCount = wishes.filter(w => w.isFavorite).length;
    setWishes(prev => {
      const updated = prev.map(w => {
        if (w.id !== id) return w;
        if (!w.isFavorite && favCount >= 3) return w; // max 3
        return { ...w, isFavorite: !w.isFavorite };
      });
      saveWishes(child.id, updated);
      return updated;
    });
  };

  const addFreeWish = () => {
    if (!freeText.trim()) return;
    const wish: XmasWish = {
      id: `free_${Date.now()}`, childId: child.id,
      name: freeText.trim(), isFavorite: false, isFree: true, adultStatus: 'none',
    };
    const updated = [...wishes, wish];
    saveWishes(child.id, updated);
    setWishes(updated);
    setFreeText('');
    setShowFreeInput(false);
  };

  const sendLetter = () => {
    const all = JSON.parse(localStorage.getItem('xmas_children') ?? '[]');
    const updated = all.map((c: ChildProfile) =>
      c.id === child.id ? { ...c, letterSent: true, letterSentAt: new Date().toISOString() } : c
    );
    localStorage.setItem('xmas_children', JSON.stringify(updated));
    setPhase('sent');
  };

  const cartItems = wishes.filter(w => !w.isFree);
  const freeWishes = wishes.filter(w => w.isFree);
  const favorites = wishes.filter(w => w.isFavorite);

  // ── PHASE: VIDEO ───────────────────────────────────────────────────
  if (phase === 'video') {
    return (
      <div className="min-h-screen relative flex flex-col" style={{ background: `linear-gradient(160deg, #1E4034 0%, #2D6A4F 60%, #1A3A2A 100%)` }}>
        <SnowBg />
        <div className="relative z-10 px-5 pt-6">
          <button onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center mb-8"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <ChevronLeft size={20} className="text-white" />
          </button>
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-16">
          <div className="relative mb-4">
            <img
              src="/santa-real.jpg"
              alt={child.santaName}
              className="w-[120px] h-[120px] rounded-full object-cover object-top"
              style={{ border: '4px solid rgba(255,255,255,.4)', boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}
            />
            <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center text-[18px]"
              style={{ background: '#C9A227', boxShadow: '0 4px 10px rgba(0,0,0,.3)' }}>🎅</div>
          </div>
          <h1 className="font-display text-[28px] font-[800] text-white text-center leading-tight mb-2">
            {child.name}, tengo un<br />mensaje para ti
          </h1>
          <p className="text-[14px] text-white text-center mb-8" style={{ opacity: .8 }}>
            Del {child.santaName} desde el Polo Norte 🎄
          </p>

          {/* Audio player con voz del Viejo Pascuero */}
          <div className="w-full rounded-22 overflow-hidden mb-6" style={{ background: '#0D2218', border: '2px solid rgba(255,255,255,.15)' }}>
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-6">
              <div className="relative">
                <img src="/santa-real.jpg" alt="" className="w-16 h-16 rounded-full object-cover object-top opacity-80" style={{ border: '2px solid rgba(255,255,255,.3)' }} />
                {isPlaying && (
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: `${XMAS_GOLD}30` }} />
                )}
              </div>
              <p className="text-[13px] text-white text-center leading-relaxed" style={{ opacity: .9 }}>
                "{script}"
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
              <div className="flex gap-2 items-center">
                <button onClick={() => { window.speechSynthesis.cancel(); setIsPlaying(false); }}
                  className="text-white text-[18px]" style={{ opacity: .7 }}>⏮</button>
                <button onClick={toggleSpeech}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: isPlaying ? XMAS_GOLD : 'rgba(255,255,255,.15)' }}>
                  {isPlaying
                    ? <VolumeX size={18} className="text-ink" />
                    : <Volume2 size={18} className="text-white" />}
                </button>
                <button onClick={() => { window.speechSynthesis.cancel(); setIsPlaying(false); setPhase('workshop'); }}
                  className="text-white text-[18px]" style={{ opacity: .7 }}>⏭</button>
              </div>
              <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,.2)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: isPlaying ? '60%' : '0%', background: XMAS_GOLD }} />
              </div>
              <span className="text-white text-[11px] font-medium" style={{ opacity: .7 }}>
                {isPlaying ? '🔊 Escuchando' : '▶ Escuchar'}
              </span>
            </div>
          </div>

          <button onClick={() => setPhase('workshop')}
            className="w-full h-14 rounded-20 text-[17px] font-bold text-ink"
            style={{ background: XMAS_GOLD, boxShadow: `0 10px 30px rgba(201,162,39,.5)` }}>
            🎁 Entrar al taller de regalos
          </button>
        </div>
      </div>
    );
  }

  // ── PHASE: WORKSHOP ────────────────────────────────────────────────
  if (phase === 'workshop') {
    return (
      <div className="min-h-screen pb-32" style={{ background: '#FAF7F2' }}>
        {/* Header */}
        <div className="sticky top-0 z-20 px-5 py-3 flex items-center gap-3"
          style={{ background: 'rgba(250,247,242,.96)', borderBottom: '1px solid #EAE2D6', backdropFilter: 'blur(10px)' }}>
          <button onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(48,34,56,.08)' }}>
            <ChevronLeft size={18} className="text-ink" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-[18px] font-[800] text-ink">Taller de regalos 🎁</h1>
            <p className="text-[12px] text-ink-muted">Hola, {child.name}! Elige lo que te haría ilusión</p>
          </div>
          <button onClick={() => setPhase('favorites')}
            className="h-9 px-3 rounded-14 flex items-center gap-1.5 font-bold text-[13px] text-white"
            style={{ background: XMAS_RED }}>
            <span>🛷</span> Mi carta ({cartItems.length + freeWishes.length})
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto px-5 py-3" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => {
            const int = INTERESTS.find(i => i.id === cat);
            const label = cat === 'all' ? '✨ Todos' : `${int?.emoji ?? ''} ${int?.label ?? cat}`;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 h-9 px-4 rounded-20 text-[13px] font-semibold border-[1.5px] transition-all"
                style={{
                  background: activeCategory === cat ? XMAS_GREEN : 'white',
                  color: activeCategory === cat ? 'white' : '#302238',
                  borderColor: activeCategory === cat ? XMAS_GREEN : '#E2D8CB',
                }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Section label */}
        <div className="px-5 mb-1">
          {activeCategory === 'all' ? (
            <p className="text-[13px] font-bold text-ink-muted">
              ✨ Para ti · {filtered.length} ideas ordenadas por tus intereses
            </p>
          ) : (
            <p className="text-[13px] font-bold text-ink-muted">
              {INTERESTS.find(i => i.id === activeCategory)?.emoji} {INTERESTS.find(i => i.id === activeCategory)?.label} · {filtered.length} ideas
            </p>
          )}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-3 px-5">
          {filtered.map(item => {
            const inCart = isInCart(item.id);
            const fav = isFav(item.id);
            const img = item.images?.[0] ?? (item as unknown as { image?: string }).image ?? '';
            return (
              <div key={item.id} className="rounded-20 overflow-hidden bg-white"
                style={{ boxShadow: `0 2px 12px rgba(48,34,56,.06)`, border: inCart ? `2px solid ${XMAS_GREEN}` : '1.5px solid #EAE2D6' }}>
                <div className="relative" style={{ height: 150 }}>
                  <img src={img} alt={item.name} className="w-full h-full object-cover" />
                  {inCart && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: `${XMAS_GREEN}30` }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: XMAS_GREEN }}>
                        <span className="text-white text-[20px]">✓</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => inCart && toggleFav(item.id)}
                    className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(250,247,242,.9)' }}>
                    <Star size={16} fill={fav ? XMAS_GOLD : 'none'} style={{ color: fav ? XMAS_GOLD : '#8A7D90' }} />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-ink leading-snug line-clamp-2 mb-2">{item.name}</p>
                  <button
                    onClick={() => toggleItem(item)}
                    className="w-full h-9 rounded-12 text-[13px] font-bold transition-all"
                    style={{
                      background: inCart ? 'white' : XMAS_RED,
                      color: inCart ? XMAS_RED : 'white',
                      border: inCart ? `1.5px solid ${XMAS_RED}` : 'none',
                    }}>
                    {inCart ? '✓ Agregado' : '¡Me gusta!'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tiendas participantes */}
        {(() => {
          const stores = loadStores();
          return (
            <div className="px-5 mt-5">
              <p className="text-[13px] font-bold text-ink-muted uppercase tracking-wider mb-3">🏪 Tiendas participantes</p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {stores.map(store => (
                  <button key={store.id}
                    onClick={() => setActiveBrand(activeBrand === store.id ? null : store.id)}
                    className="flex-shrink-0 rounded-18 px-4 py-3 text-left transition-all"
                    style={{
                      background: activeBrand === store.id ? XMAS_GREEN : 'white',
                      border: activeBrand === store.id ? `2px solid ${XMAS_GREEN}` : '1.5px solid #E2D8CB',
                      minWidth: 120,
                    }}>
                    <p className="text-[22px] leading-none mb-1">{store.logoEmoji}</p>
                    <p className="text-[13px] font-bold" style={{ color: activeBrand === store.id ? 'white' : '#302238' }}>{store.name}</p>
                    <p className="text-[11px]" style={{ color: activeBrand === store.id ? 'rgba(255,255,255,.7)' : '#8A7D90' }}>
                      {allProducts.filter(p => p.storeId === store.id && p.status === 'published').length} productos
                    </p>
                  </button>
                ))}
              </div>
              {activeBrand && (() => {
                const brandProducts = allProducts.filter(p => p.storeId === activeBrand && p.status === 'published');
                return (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {brandProducts.map(item => {
                      const inCart = isInCart(item.id);
                      const img = item.images?.[0] ?? '';
                      return (
                        <div key={item.id} className="rounded-18 overflow-hidden bg-white"
                          style={{ border: inCart ? `2px solid ${XMAS_GREEN}` : '1.5px solid #EAE2D6' }}>
                          {img && <img src={img} alt={item.name} className="w-full h-[110px] object-cover" />}
                          <div className="p-2.5">
                            <p className="text-[12px] font-semibold text-ink leading-snug line-clamp-2 mb-1">{item.name}</p>
                            <p className="text-[12px] font-bold mb-2" style={{ color: XMAS_GREEN }}>{fmtCLP(item.price)}</p>
                            <button onClick={() => toggleItem(item)}
                              className="w-full h-8 rounded-10 text-[12px] font-bold transition-all"
                              style={{
                                background: inCart ? 'white' : XMAS_RED,
                                color: inCart ? XMAS_RED : 'white',
                                border: inCart ? `1.5px solid ${XMAS_RED}` : 'none',
                              }}>
                              {inCart ? '✓ En carta' : '¡Me gusta!'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* Free wish card */}
        <div className="px-5 mt-4">
          <div className="rounded-20 p-4 bg-white" style={{ border: '1.5px dashed #E2D8CB' }}>
            <p className="text-[15px] font-bold text-ink mb-1">¿Hay algo más que te haría ilusión?</p>
            <p className="text-[13px] text-ink-muted mb-3">Cuéntale al {child.santaName} algo especial</p>
            {showFreeInput ? (
              <div className="flex gap-2">
                <input value={freeText} onChange={e => setFreeText(e.target.value)}
                  placeholder="Escribe tu deseo aquí..."
                  className="flex-1 h-11 rounded-12 px-3 text-[14px] text-ink outline-none"
                  style={{ border: '1.5px solid #E2D8CB', background: '#FAF7F2' }}
                  onKeyDown={e => e.key === 'Enter' && addFreeWish()} />
                <button onClick={addFreeWish}
                  className="h-11 px-4 rounded-12 font-bold text-white"
                  style={{ background: XMAS_GREEN }}>
                  <Send size={16} />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowFreeInput(true)}
                className="h-10 px-5 rounded-12 text-[13px] font-bold text-white"
                style={{ background: XMAS_GREEN }}>
                + Pedir otra cosa
              </button>
            )}
            {freeWishes.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5">
                {freeWishes.map(w => (
                  <div key={w.id} className="flex items-center gap-2 rounded-10 px-3 py-2"
                    style={{ background: '#FAF7F2' }}>
                    <span className="text-[13px] flex-1 text-ink">✏️ {w.name}</span>
                    <button onClick={() => {
                      const upd = wishes.filter(x => x.id !== w.id);
                      saveWishes(child.id, upd); setWishes(upd);
                    }}>
                      <X size={14} className="text-ink-muted" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        {(cartItems.length + freeWishes.length) > 0 && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] px-5 pb-6 pt-3"
            style={{ background: 'rgba(250,247,242,.96)', borderTop: '1px solid #EAE2D6' }}>
            <button onClick={() => setPhase('favorites')}
              className="w-full h-14 rounded-20 text-[16px] font-bold text-white"
              style={{ background: XMAS_RED, boxShadow: `0 8px 24px rgba(192,57,43,.4)` }}>
              🌟 Ver mi carta · {cartItems.length + freeWishes.length} deseos
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── PHASE: FAVORITES ───────────────────────────────────────────────
  if (phase === 'favorites') {
    return (
      <div className="min-h-screen pb-28" style={{ background: '#FAF7F2' }}>
        <div className="px-5 pt-6 pb-4">
          <button onClick={() => setPhase('workshop')}
            className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(48,34,56,.08)' }}>
            <ChevronLeft size={20} className="text-ink" />
          </button>
          <h1 className="font-display text-[22px] font-[800] text-ink">¿Cuáles te hacen más ilusión?</h1>
          <p className="text-[14px] text-ink-muted mt-1">
            Si tuvieras que elegir solo tres, ¿cuáles serían? Toca la ⭐ para marcarlos.
          </p>
          <p className="text-[13px] font-semibold mt-2" style={{ color: favorites.length >= 3 ? XMAS_GOLD : '#8A7D90' }}>
            {favorites.length}/3 favoritos marcados
          </p>
        </div>

        <div className="px-5 flex flex-col gap-3">
          {cartItems.map(item => {
            const fav = item.isFavorite;
            return (
              <div key={item.id} className="rounded-18 p-3 flex items-center gap-3 bg-white"
                style={{ border: `1.5px solid ${fav ? XMAS_GOLD : '#EAE2D6'}` }}>
                {item.image && (
                  <img src={item.image} alt="" className="w-14 h-14 rounded-14 object-cover flex-shrink-0" />
                )}
                <p className="text-[14px] font-semibold text-ink flex-1 leading-snug">{item.name}</p>
                <button onClick={() => toggleFav(item.id)}
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: fav ? `${XMAS_GOLD}20` : '#FAF7F2' }}>
                  <Star size={20} fill={fav ? XMAS_GOLD : 'none'} style={{ color: fav ? XMAS_GOLD : '#8A7D90' }} />
                </button>
              </div>
            );
          })}

          {freeWishes.map(item => (
            <div key={item.id} className="rounded-18 p-3 flex items-center gap-3 bg-white"
              style={{ border: '1.5px solid #EAE2D6' }}>
              <div className="w-14 h-14 rounded-14 flex items-center justify-center text-[24px] flex-shrink-0"
                style={{ background: '#FAF7F2' }}>✏️</div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-ink">{item.name}</p>
                <p className="text-[12px] text-ink-muted">Deseo libre</p>
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setPhase('workshop')}
              className="flex-1 h-12 rounded-16 border-[1.5px] border-line text-[14px] font-semibold text-ink bg-white">
              Seguir eligiendo
            </button>
            <button onClick={() => setPhase('letter')}
              className="flex-1 h-12 rounded-16 text-[14px] font-bold text-white"
              style={{ background: XMAS_RED }}>
              Ver mi carta →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: LETTER ──────────────────────────────────────────────────
  if (phase === 'letter') {
    const DECORS = ['🎄', '⭐', '🦌', '🔔', '❄️'];
    return (
      <div className="min-h-screen pb-28" style={{ background: '#FAF7F2' }}>
        <div className="px-5 pt-6 pb-4">
          <button onClick={() => setPhase('favorites')}
            className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(48,34,56,.08)' }}>
            <ChevronLeft size={20} className="text-ink" />
          </button>
          <h1 className="font-display text-[22px] font-[800] text-ink">Tu carta {letterDecor}</h1>
        </div>

        {/* Decor selector */}
        <div className="flex gap-3 px-5 mb-4">
          {DECORS.map(d => (
            <button key={d} onClick={() => setLetterDecor(d)}
              className="w-10 h-10 rounded-full text-[22px] flex items-center justify-center"
              style={{ background: letterDecor === d ? `${XMAS_GOLD}20` : '#FAF7F2', border: `2px solid ${letterDecor === d ? XMAS_GOLD : 'transparent'}` }}>
              {d}
            </button>
          ))}
        </div>

        {/* Letter card */}
        <div className="mx-5 rounded-22 p-5 bg-white"
          style={{ boxShadow: '0 8px 32px rgba(48,34,56,.1)', border: `2px solid ${XMAS_GOLD}44`, fontFamily: 'Georgia, serif' }}>
          <p className="text-[20px] font-bold text-center mb-4" style={{ color: XMAS_RED }}>
            {letterDecor} {letterDecor} {letterDecor}
          </p>
          <p className="text-[16px] text-ink mb-3">Querido {child.santaName}:</p>
          <p className="text-[14px] text-ink-muted mb-4">Me llamo {child.name} y tengo {child.age} años. Estos son los regalos que me harían ilusión:</p>

          {favorites.length > 0 && (
            <div className="mb-4">
              <p className="text-[13px] font-bold text-ink mb-2" style={{ color: XMAS_GOLD }}>⭐ Mis favoritos:</p>
              {favorites.map(w => (
                <p key={w.id} className="text-[14px] text-ink ml-3">• {w.name}</p>
              ))}
            </div>
          )}

          {cartItems.filter(w => !w.isFavorite).length > 0 && (
            <div className="mb-4">
              <p className="text-[13px] font-bold text-ink-muted mb-2">También me gustaría:</p>
              {cartItems.filter(w => !w.isFavorite).map(w => (
                <p key={w.id} className="text-[14px] text-ink ml-3">• {w.name}</p>
              ))}
            </div>
          )}

          {freeWishes.length > 0 && (
            <div className="mb-4">
              <p className="text-[13px] font-bold text-ink-muted mb-2">También soñé con:</p>
              {freeWishes.map(w => (
                <p key={w.id} className="text-[14px] text-ink ml-3">✏️ {w.name}</p>
              ))}
            </div>
          )}

          <p className="text-[14px] text-ink mt-4">Con cariño,</p>
          <p className="text-[17px] font-bold text-ink">{child.name} {letterDecor}</p>
        </div>

        <div className="flex gap-3 px-5 mt-4">
          <button onClick={() => setPhase('workshop')}
            className="flex-1 h-12 rounded-16 border-[1.5px] border-line text-[14px] font-semibold text-ink bg-white">
            Seguir eligiendo
          </button>
          <button onClick={sendLetter}
            className="flex-1 h-12 rounded-16 text-[14px] font-bold text-white flex items-center justify-center gap-2"
            style={{ background: XMAS_RED }}>
            <Send size={16} /> Enviar carta
          </button>
        </div>
      </div>
    );
  }

  // ── PHASE: SENT ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: `linear-gradient(160deg, ${XMAS_GREEN} 0%, #1E4034 100%)` }}>
      <SnowBg />
      <div className="relative z-10 flex flex-col items-center">
        <div className="text-[80px] mb-4 animate-bounce">✉️</div>
        <h1 className="font-display text-[26px] font-[800] text-white mb-2">¡Tu carta está lista!</h1>
        <p className="text-[15px] text-white mb-2" style={{ opacity: .85 }}>
          Gracias por compartir tus deseos, {child.name}.
        </p>
        <p className="text-[13px] text-white mb-8" style={{ opacity: .6 }}>
          Tu carta va camino al Polo Norte 🛷
        </p>
        <button onClick={onBack}
          className="h-12 px-8 rounded-20 text-[15px] font-bold text-ink"
          style={{ background: XMAS_GOLD }}>
          Volver al inicio ⭐
        </button>
      </div>
    </div>
  );
}
