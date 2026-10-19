import { useState } from 'react';
import { ChevronLeft, Lock, Share2, Check, ShoppingBag } from 'lucide-react';
import { loadWishes, saveWishes, XMAS_RED, XMAS_GREEN, XMAS_GOLD, fmtCLP } from './xmas-data';
import type { ChildProfile, XmasWish } from './xmas-data';
import { loadCampaigns, loadProducts, loadStores } from './xmas-store-data';

type Props = {
  child: ChildProfile;
  onBack: () => void;
  onNavigate?: (screen: string, data?: unknown) => void;
};

const DEMO_PIN = '1234';

type GiftStatus = 'none' | 'selected' | 'reserved' | 'bought';

const STATUS_LABELS: Record<GiftStatus, string> = {
  none: 'Sin gestionar',
  selected: 'Seleccionado para comprar',
  reserved: 'Reservado',
  bought: 'Comprado ✓',
};
const STATUS_COLORS: Record<GiftStatus, string> = {
  none: '#8A7D90',
  selected: XMAS_GREEN,
  reserved: XMAS_GOLD,
  bought: '#557A65',
};

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const attempt = (p: string) => {
    if (p === DEMO_PIN) { onUnlock(); return; }
    if (p.length === 4) { setError(true); setPin(''); }
  };

  const press = (d: string) => {
    if (d === 'del') { setPin(p => p.slice(0, -1)); setError(false); return; }
    const next = pin + d;
    setPin(next);
    if (next.length === 4) attempt(next);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#FAF7F2' }}>
      <div className="w-16 h-16 rounded-24 flex items-center justify-center mb-4"
        style={{ background: XMAS_GREEN, boxShadow: `0 8px 24px ${XMAS_GREEN}44` }}>
        <Lock size={28} className="text-white" />
      </div>
      <h1 className="font-display text-[22px] font-[800] text-ink mb-1">Panel del adulto</h1>
      <p className="text-[14px] text-ink-muted mb-6 text-center">Ingresa el PIN para acceder a los presupuestos y compras</p>
      <p className="text-[12px] text-ink-muted mb-2">DEMOSTRACIÓN: PIN es 1234</p>

      {/* PIN dots */}
      <div className="flex gap-4 mb-6">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-4 h-4 rounded-full transition-all"
            style={{ background: i < pin.length ? XMAS_GREEN : '#D9CFC2' }} />
        ))}
      </div>
      {error && <p className="text-[13px] font-semibold mb-4" style={{ color: XMAS_RED }}>PIN incorrecto. Intenta de nuevo.</p>}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3" style={{ width: 220 }}>
        {['1','2','3','4','5','6','7','8','9','','0','del'].map(k => (
          <button key={k} onClick={() => k && press(k)}
            className="h-14 rounded-18 text-[18px] font-bold text-ink flex items-center justify-center transition-all"
            style={{
              background: k ? 'white' : 'transparent',
              border: k ? '1.5px solid #E2D8CB' : 'none',
              boxShadow: k ? '0 1px 4px rgba(48,34,56,.06)' : 'none',
            }}>
            {k === 'del' ? '⌫' : k}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChristmasAdultScreen({ child, onBack, onNavigate }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [wishes, setWishes] = useState<XmasWish[]>(() => loadWishes(child.id));
  const [showShare, setShowShare] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  const updateStatus = (id: string, status: GiftStatus) => {
    const updated = wishes.map(w => w.id === id ? { ...w, adultStatus: status } : w);
    saveWishes(child.id, updated);
    setWishes(updated);
  };

  const cycleStatus = (wish: XmasWish) => {
    const cycle: GiftStatus[] = ['none', 'selected', 'reserved', 'bought'];
    const next = cycle[(cycle.indexOf(wish.adultStatus) + 1) % cycle.length];
    updateStatus(wish.id, next);
  };

  const cartWishes = wishes.filter(w => !w.isFree);
  const freeWishes = wishes.filter(w => w.isFree);
  const favorites = wishes.filter(w => w.isFavorite);

  const selectedWishes = cartWishes.filter(w => w.adultStatus !== 'none');
  const totalList = cartWishes.reduce((acc, w) => acc + (w.price ?? 0), 0);
  const totalSelected = selectedWishes.reduce((acc, w) => acc + (w.price ?? 0), 0);
  const remaining = child.adultBudget - totalSelected;

  const shareLink = `giftloop.app/xmas/${child.id}/share`;

  return (
    <div className="min-h-screen pb-28" style={{ background: '#FAF7F2' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4" style={{ background: XMAS_GREEN }}>
        <button onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          <ChevronLeft size={20} className="text-white" />
        </button>
        <p className="text-[13px] font-semibold text-white" style={{ opacity: .7 }}>Panel del adulto</p>
        <h1 className="font-display text-[22px] font-[800] text-white">
          {child.name} {child.letterSent ? '✓' : '· carta pendiente'}
        </h1>
        {child.letterSent && child.letterSentAt && (
          <p className="text-[12px] text-white mt-0.5" style={{ opacity: .7 }}>
            Carta enviada el {new Date(child.letterSentAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
          </p>
        )}
      </div>

      <div className="px-5 flex flex-col gap-4 pt-4">
        {/* Purchase CTA */}
        <button
          onClick={() => onNavigate?.('xmas-purchase', child)}
          className="w-full h-13 py-3 rounded-18 text-[15px] font-bold text-white flex items-center justify-center gap-2"
          style={{ background: XMAS_RED, boxShadow: `0 8px 24px rgba(192,57,43,.35)` }}>
          <ShoppingBag size={18} /> Gestionar compras para {child.name}
        </button>

        {/* Budget summary card */}
        <div className="rounded-22 p-4 bg-white" style={{ boxShadow: '0 4px 20px rgba(45,106,79,.1)', border: '1.5px solid #E2D8CB' }}>
          <p className="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-3">Resumen de presupuesto</p>
          {[
            { label: 'Valor completo de la lista', val: fmtCLP(totalList), sub: `${cartWishes.length} regalos` },
            { label: 'Tu presupuesto', val: fmtCLP(child.adultBudget), sub: 'definido por ti' },
            { label: 'Seleccionados para comprar', val: fmtCLP(totalSelected), sub: `${selectedWishes.length} regalos` },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
              <div>
                <p className="text-[14px] font-semibold text-ink">{row.label}</p>
                <p className="text-[12px] text-ink-muted">{row.sub}</p>
              </div>
              <p className="text-[15px] font-bold text-ink">{row.val}</p>
            </div>
          ))}
          <div className="mt-3 rounded-14 px-4 py-3 flex items-center justify-between"
            style={{ background: remaining >= 0 ? `${XMAS_GREEN}12` : '#FBE3DF' }}>
            <p className="text-[13px] font-bold" style={{ color: remaining >= 0 ? XMAS_GREEN : XMAS_RED }}>
              {remaining >= 0 ? `Te quedan ${fmtCLP(remaining)}` : `Excedes por ${fmtCLP(Math.abs(remaining))}`}
            </p>
            <p className="text-[12px] text-ink-muted">
              {selectedWishes.length} seleccionado{selectedWishes.length !== 1 ? 's' : ''} · {fmtCLP(totalSelected)}
            </p>
          </div>
        </div>

        {/* Compras por tienda */}
        {selectedWishes.length > 0 && (() => {
          const byStore: Record<string, { total: number; items: typeof selectedWishes }> = {};
          selectedWishes.forEach(w => {
            const key = w.store ?? 'Sin tienda';
            if (!byStore[key]) byStore[key] = { total: 0, items: [] };
            byStore[key].total += w.price ?? 0;
            byStore[key].items.push(w);
          });
          const stores = loadStores();
          return (
            <div className="rounded-22 p-4 bg-white" style={{ boxShadow: '0 4px 20px rgba(45,106,79,.1)', border: '1.5px solid #E2D8CB' }}>
              <p className="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-3">🏪 Compras por tienda</p>
              {Object.entries(byStore).map(([storeId, data]) => {
                const store = stores.find(s => s.id === storeId);
                return (
                  <div key={storeId} className="py-2.5 border-b border-line last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[14px] font-bold text-ink">
                        {store?.logoEmoji ?? '🏪'} {store?.name ?? storeId}
                      </p>
                      <p className="text-[14px] font-bold" style={{ color: XMAS_GREEN }}>{fmtCLP(data.total)}</p>
                    </div>
                    <p className="text-[12px] text-ink-muted">{data.items.map(w => w.name).join(', ')}</p>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Favorites */}
        {favorites.length > 0 && (
          <div>
            <p className="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-2" style={{ color: XMAS_GOLD }}>⭐ Favoritos de {child.name}</p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {favorites.map(w => (
                <div key={w.id} className="flex-shrink-0 rounded-18 overflow-hidden bg-white"
                  style={{ width: 120, border: `2px solid ${XMAS_GOLD}` }}>
                  {w.image && <img src={w.image} alt="" className="w-full h-[90px] object-cover" />}
                  <div className="p-2">
                    <p className="text-[11px] font-semibold text-ink line-clamp-2">{w.name}</p>
                    {w.price && <p className="text-[11px] font-bold mt-0.5" style={{ color: XMAS_GREEN }}>{fmtCLP(w.price)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sponsored campaigns */}
        {(() => {
          const campaigns = loadCampaigns().filter(c =>
            c.status === 'active' && c.locations.includes('adult_panel_featured')
          );
          const allProducts = loadProducts();
          const stores = loadStores();
          const sponsoredProducts = campaigns.flatMap(c =>
            c.products
              .map(pid => allProducts.find(p => p.id === pid))
              .filter((p): p is NonNullable<typeof p> =>
                !!p && p.status === 'published' && (p.stock as number) > 0 &&
                Number(p.price) <= child.adultBudget && (p.minAge ?? 0) <= child.age
              )
          );
          if (sponsoredProducts.length === 0) return null;
          return (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: XMAS_GOLD }}>⭐ Selección patrocinada</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-6"
                  style={{ background: `${XMAS_GOLD}22`, color: XMAS_GOLD }}>Patrocinado</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {sponsoredProducts.map(p => {
                  const store = stores.find(s => s.id === p.storeId);
                  return (
                    <div key={p.id} className="flex-shrink-0 rounded-18 overflow-hidden bg-white"
                      style={{ width: 140, border: `1.5px solid ${XMAS_GOLD}44` }}>
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-[100px] object-cover" />}
                      <div className="p-2.5">
                        <p className="text-[11px] font-semibold text-ink line-clamp-2 mb-1">{p.name}</p>
                        <p className="text-[12px] font-bold" style={{ color: XMAS_GREEN }}>{fmtCLP(p.price)}</p>
                        {store && <p className="text-[10px] text-ink-muted mt-0.5">{store.logoEmoji} {store.name}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-ink-muted mt-1.5 px-0.5">
                Productos de tiendas que participan en GiftLoop. Siempre etiquetados como Patrocinado.
              </p>
            </div>
          );
        })()}

        {/* Gift list */}
        <div>
          <p className="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-2">Lista completa · toca para cambiar estado</p>
          <div className="flex flex-col gap-2">
            {cartWishes.map(w => {
              const statusColor = STATUS_COLORS[w.adultStatus];
              return (
                <div key={w.id} className="rounded-18 p-3 flex items-center gap-3 bg-white"
                  style={{ border: `1.5px solid ${w.adultStatus !== 'none' ? statusColor + '44' : '#EAE2D6'}` }}>
                  {w.image && (
                    <img src={w.image} alt="" className="w-12 h-12 rounded-12 object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">
                      {w.isFavorite && <span style={{ color: XMAS_GOLD }}>⭐ </span>}
                      {w.name}
                    </p>
                    {w.price && <p className="text-[12px] font-bold" style={{ color: XMAS_GREEN }}>{fmtCLP(w.price)}</p>}
                  </div>
                  <button onClick={() => cycleStatus(w)}
                    className="flex-shrink-0 px-2.5 py-1.5 rounded-10 text-[11px] font-bold"
                    style={{ background: `${statusColor}18`, color: statusColor }}>
                    {STATUS_LABELS[w.adultStatus].split(' ')[0]}
                  </button>
                </div>
              );
            })}

            {/* Free wishes */}
            {freeWishes.length > 0 && (
              <div className="rounded-18 p-3 bg-white" style={{ border: '1.5px solid #EAE2D6' }}>
                <p className="text-[12px] font-bold text-ink-muted mb-2">Deseos libres · pendiente de revisión</p>
                {freeWishes.map(w => (
                  <div key={w.id} className="flex items-center gap-2 py-1.5">
                    <span className="text-[14px]">✏️</span>
                    <p className="text-[13px] text-ink">{w.name}</p>
                    <span className="ml-auto text-[11px] px-2 py-1 rounded-10" style={{ background: '#FBE3DF', color: XMAS_RED }}>
                      Sin precio
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Share */}
        <div className="rounded-20 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[14px] font-bold text-ink">Compartir con familiares</p>
            <Share2 size={16} className="text-ink-muted" />
          </div>
          <p className="text-[13px] text-ink-muted mb-3">
            Comparte una selección de la carta para que puedan reservar regalos sin duplicarse.
            No verán tu presupuesto personal.
          </p>
          {showShare ? (
            <div>
              <div className="rounded-12 px-3 py-2.5 flex items-center gap-2 mb-2"
                style={{ background: '#FAF7F2', border: '1px solid #E2D8CB' }}>
                <p className="text-[12px] text-ink-muted flex-1 truncate">{shareLink}</p>
                <button onClick={() => {
                  navigator.clipboard?.writeText(shareLink).catch(() => {});
                  setShareMsg('¡Enlace copiado!');
                  setTimeout(() => setShareMsg(''), 2000);
                }} className="text-[12px] font-bold flex-shrink-0" style={{ color: XMAS_GREEN }}>
                  Copiar
                </button>
              </div>
              {shareMsg && <p className="text-[12px] font-semibold text-center" style={{ color: XMAS_GREEN }}>{shareMsg}</p>}
              <p className="text-[11px] text-ink-muted text-center mt-1">
                DEMOSTRACIÓN · El enlace es simulado y no procesa pagos reales.
              </p>
            </div>
          ) : (
            <button onClick={() => setShowShare(true)}
              className="w-full h-11 rounded-14 text-[13px] font-bold text-white"
              style={{ background: XMAS_GREEN }}>
              Crear enlace para familiares
            </button>
          )}
        </div>

        {/* Status legend */}
        <div className="rounded-18 p-4 bg-white" style={{ border: '1.5px solid #EAE2D6' }}>
          <p className="text-[12px] font-bold text-ink-muted mb-2">Estados de gestión</p>
          {(Object.keys(STATUS_LABELS) as GiftStatus[]).filter(s => s !== 'none').map(s => (
            <div key={s} className="flex items-center gap-2 py-1">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s] }} />
              <p className="text-[12px] text-ink">{STATUS_LABELS[s]}</p>
            </div>
          ))}
          <p className="text-[11px] text-ink-muted mt-2">
            "Comprado" es confirmación manual. No implica verificación de tienda.
          </p>
        </div>
      </div>
    </div>
  );
}
