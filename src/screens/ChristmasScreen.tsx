import { useState } from 'react';
import { ChevronLeft, Plus, TreePine, Gift, Star } from 'lucide-react';
import { loadChildren, loadWishes, XMAS_RED, XMAS_GREEN, XMAS_GOLD, XMAS_LIGHT } from './xmas-data';
import type { ChildProfile } from './xmas-data';

type Props = {
  onBack: () => void;
  onNavigate: (screen: string, data?: unknown) => void;
};

function snowflake(x: number, delay: number) {
  return (
    <div key={x} className="absolute text-white opacity-30 select-none pointer-events-none animate-bounce"
      style={{ left: `${x}%`, top: `${10 + (x % 5) * 8}%`, fontSize: 12, animationDelay: `${delay}s`, animationDuration: '3s' }}>
      ❄
    </div>
  );
}

export function ChristmasScreen({ onBack, onNavigate }: Props) {
  const [children, setChildren] = useState<ChildProfile[]>(loadChildren);

  const getStatus = (child: ChildProfile) => {
    if (!child.setupDone) return { label: 'Configurando', color: '#8A7D90' };
    if (!child.letterSent) return { label: 'Carta pendiente', color: XMAS_GOLD };
    return { label: 'Carta enviada ✓', color: XMAS_GREEN };
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: '#FAF7F2' }}>
      {/* Hero header */}
      <div className="relative overflow-hidden px-5 pt-5 pb-10"
        style={{ background: `linear-gradient(135deg, ${XMAS_GREEN} 0%, #1E4034 100%)` }}>
        {[10, 25, 42, 58, 74, 88].map((x, i) => snowflake(x, i * 0.4))}
        <button onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(255,255,255,.15)' }}>
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-20 flex items-center justify-center flex-shrink-0"
            style={{ background: XMAS_RED, boxShadow: `0 6px 18px rgba(192,57,43,.5)` }}>
            <TreePine size={24} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white" style={{ opacity: .7 }}>Edición especial</p>
            <h1 className="font-display text-[26px] font-[800] text-white leading-tight tracking-[-0.02em]">
              Navidad en GiftLoop
            </h1>
            <p className="text-[13px] text-white mt-1" style={{ opacity: .8 }}>
              Prepara la magia para los más pequeños
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4" style={{ marginTop: -24 }}>
        {/* Children cards */}
        {children.map(child => {
          const wishes = loadWishes(child.id);
          const favorites = wishes.filter(w => w.isFavorite);
          const status = getStatus(child);
          return (
            <div key={child.id} className="rounded-22 overflow-hidden bg-white"
              style={{ boxShadow: '0 4px 20px rgba(45,106,79,.12)', border: `1.5px solid #E2D8CB` }}>
              {/* Card top */}
              <div className="px-4 pt-4 pb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-[24px]"
                    style={{ background: XMAS_LIGHT, border: `2px solid ${XMAS_GREEN}22` }}>
                    🎅
                  </div>
                  <div>
                    <h2 className="font-display text-[18px] font-[800] text-ink">{child.name}</h2>
                    <p className="text-[13px] text-ink-muted">{child.age} años · {child.santaName}</p>
                  </div>
                </div>
                <span className="text-[12px] font-bold px-2.5 py-1 rounded-20"
                  style={{ background: `${status.color}18`, color: status.color }}>
                  {status.label}
                </span>
              </div>

              {/* Stats row */}
              <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                {[
                  { val: wishes.length, label: 'deseos' },
                  { val: favorites.length, label: 'favoritos' },
                  { val: wishes.filter(w => w.adultStatus !== 'none').length, label: 'gestionados' },
                ].map(s => (
                  <div key={s.label} className="rounded-14 px-2 py-2.5 text-center"
                    style={{ background: '#FAF7F2' }}>
                    <p className="font-display text-[18px] font-[800] text-ink leading-none">{s.val}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                {child.setupDone ? (
                  <>
                    <button
                      onClick={() => onNavigate('xmas-child', child)}
                      className="h-11 rounded-14 text-[13px] font-bold text-white"
                      style={{ background: XMAS_RED }}>
                      🎁 Experiencia del niño
                    </button>
                    <button
                      onClick={() => onNavigate('xmas-adult', child)}
                      className="h-11 rounded-14 text-[13px] font-bold text-ink border-[1.5px]"
                      style={{ borderColor: '#D9CFC2', background: 'white' }}>
                      🔒 Panel del adulto
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onNavigate('xmas-setup', child)}
                    className="col-span-2 h-11 rounded-14 text-[13px] font-bold text-white"
                    style={{ background: XMAS_GREEN }}>
                    Continuar configuración →
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add child card */}
        <button
          onClick={() => onNavigate('xmas-setup', null)}
          className="rounded-22 p-5 flex items-center gap-4 w-full text-left"
          style={{ border: `2px dashed ${XMAS_GREEN}55`, background: `${XMAS_GREEN}08` }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: XMAS_GREEN }}>
            <Plus size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-ink">Agregar otro niño</p>
            <p className="text-[13px] text-ink-muted">Listas y presupuestos independientes</p>
          </div>
        </button>

        {/* Empty state */}
        {children.length === 0 && (
          <div className="rounded-22 p-6 text-center" style={{ background: XMAS_LIGHT, border: `1.5px solid #EAE2D6` }}>
            <div className="text-[48px] mb-3">🎄</div>
            <h2 className="font-display text-[20px] font-[800] text-ink mb-1">
              La magia de Navidad empieza con su carta
            </h2>
            <p className="text-[14px] text-ink-muted mb-4 leading-snug">
              Prepara un saludo del {'{'}Viejo Pascuero{'}'} y descubre qué regalos le hacen ilusión.
            </p>
            <button
              onClick={() => onNavigate('xmas-setup', null)}
              className="h-12 px-6 rounded-18 text-[15px] font-bold text-white"
              style={{ background: XMAS_RED, boxShadow: `0 8px 20px rgba(192,57,43,.35)` }}>
              🎅 Preparar su Navidad
            </button>
          </div>
        )}

        {/* Info strip */}
        <div className="rounded-18 px-4 py-3 flex items-center gap-3"
          style={{ background: `${XMAS_GOLD}18`, border: `1px solid ${XMAS_GOLD}44` }}>
          <Star size={16} style={{ color: XMAS_GOLD }} className="flex-shrink-0" />
          <p className="text-[13px] text-ink leading-snug">
            El niño no necesita cuenta propia. Su experiencia está dentro de tu cuenta.
          </p>
        </div>
      </div>
    </div>
  );
}
