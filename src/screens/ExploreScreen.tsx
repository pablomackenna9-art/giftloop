import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Chip, Toast, fmt } from '../components/base';
import { EXPLORE_CATALOG } from '../components/data';

type Props = {
  onNavigate: (screen: string, data?: unknown) => void;
};

const OCCASIONS = ['Cumpleaños', 'Navidad', 'Amigo secreto', 'Casa nueva', 'Aniversario'];
const INTERESTS = [
  { id: 'cafe', label: 'Café', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=104&h=124&fit=crop&auto=format' },
  { id: 'montana', label: 'Montaña', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=104&h=124&fit=crop&auto=format' },
  { id: 'tech', label: 'Tecnología', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=104&h=124&fit=crop&auto=format' },
  { id: 'lectura', label: 'Lectura', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=104&h=124&fit=crop&auto=format' },
  { id: 'hogar', label: 'Hogar', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=104&h=124&fit=crop&auto=format' },
  { id: 'moda', label: 'Moda', img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=104&h=124&fit=crop&auto=format' },
];
const BUDGETS = ['Todos', 'Hasta $20.000', '$20 – 50 mil', '$50 – 100 mil', 'Más de $100 mil'];

export function ExploreScreen({ onNavigate }: Props) {
  const [q, setQ] = useState('');
  const [occasion, setOccasion] = useState('');
  const [interest, setInterest] = useState('');
  const [budget, setBudget] = useState('Todos');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  const filtered = EXPLORE_CATALOG.filter(item =>
    !q || item.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="flex flex-col pb-[120px]" style={{ gap: 20, padding: '8px 0 120px' }}>
      <div className="px-5">
        <h1 className="font-display text-[30px] font-[800] tracking-[-0.02em] text-ink">Explorar ideas</h1>
      </div>

      {/* Search */}
      <div className="px-5">
        <div className="flex items-center gap-3 h-[52px] bg-white rounded-16 px-4" style={{ border: '1.5px solid #E2D8CB' }}>
          <Search size={18} className="text-ink-muted flex-shrink-0" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Audífonos, cerámica, trekking…"
            className="flex-1 text-[14px] text-ink outline-none bg-transparent" />
        </div>
      </div>

      {/* Ocasión */}
      <div className="px-5 flex flex-col gap-3">
        <p className="text-[13px] font-bold uppercase tracking-[.06em] text-ink-muted">OCASIÓN</p>
        <div className="flex gap-2 flex-wrap">
          {OCCASIONS.map(o => (
            <Chip key={o} label={o} active={occasion === o} variant="filter"
              onClick={() => setOccasion(occasion === o ? '' : o)} />
          ))}
        </div>
      </div>

      {/* Intereses */}
      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-bold uppercase tracking-[.06em] text-ink-muted px-5">INTERESES</p>
        <div className="flex gap-3 overflow-x-auto px-5" style={{ scrollbarWidth: 'none' }}>
          {INTERESTS.map(int => (
            <button key={int.id} onClick={() => setInterest(interest === int.id ? '' : int.id)}
              className="flex-shrink-0 rounded-20 overflow-hidden relative"
              style={{
                width: 104, height: 124,
                outline: interest === int.id ? '3px solid #EF7564' : 'none',
                outlineOffset: -3,
              }}>
              <img src={int.img} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,transparent 50%,rgba(48,34,56,.6) 100%)' }} />
              <p className="absolute bottom-2 left-0 right-0 text-center text-cream text-[14px] font-bold">{int.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Presupuesto */}
      <div className="px-5 flex flex-col gap-3">
        <p className="text-[13px] font-bold uppercase tracking-[.06em] text-ink-muted">PRESUPUESTO</p>
        <div className="flex gap-2 flex-wrap">
          {BUDGETS.map(b => (
            <Chip key={b} label={b} active={budget === b} variant="budget"
              onClick={() => setBudget(b)} />
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-5 flex flex-col gap-3">
        <h2 className="font-display text-[18px] font-[700]">
          {occasion || interest ? `${occasion || 'Todos'} · ${filtered.length} ideas` : `${filtered.length} ideas`}
        </h2>
        {filtered.length === 0 ? (
          <div className="rounded-22 p-6 bg-lilac text-center">
            <p className="text-[14px] text-ink">Nada con esos filtros. Prueba otro presupuesto o quita el interés.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(item => {
              const saved = savedIds.has(item.id);
              return (
                <div key={item.id} className="bg-white rounded-20 overflow-hidden" style={{ boxShadow: '0 2px 14px rgba(48,34,56,.05)' }}>
                  <div className="relative" style={{ height: 160 }}>
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        setSavedIds(prev => { const s = new Set(prev); s.has(item.id) ? s.delete(item.id) : s.add(item.id); return s; });
                        if (!saved) setToast('Guardado en Cumple 30');
                      }}
                      className="absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: saved ? '#557A65' : '#FAF7F2', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
                      {saved
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <Plus size={16} className="text-ink" />}
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] font-semibold text-ink leading-tight line-clamp-2">{item.name}</p>
                    <p className="text-[13px] font-bold text-ink mt-1">{fmt(item.price)}</p>
                    {item.store && <p className="text-[12px] text-ink-muted">{item.store}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
