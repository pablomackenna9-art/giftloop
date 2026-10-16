import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Toast, fmt } from '../components/base';
import { MY_LISTS } from '../components/data';

type Props = {
  onBack: () => void;
  onNavigate: (screen: string, data?: unknown) => void;
  isExperience?: boolean;
};

type Mode = 'link' | 'manual';
type Step = 'input' | 'loading' | 'review';

export function AddScreen({ onBack, onNavigate, isExperience = false }: Props) {
  const [mode, setMode] = useState<Mode>(isExperience ? 'manual' : 'link');
  const [step, setStep] = useState<Step>('input');
  const [url, setUrl] = useState('');
  const [isExp, setIsExp] = useState(isExperience);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [selectedList, setSelectedList] = useState('cumple30');
  const [toast, setToast] = useState('');

  const handleRevisar = () => {
    if (!url) return;
    setStep('loading');
    setTimeout(() => {
      setName('Audífonos Bluetooth Sony WH-1000XM5');
      setPrice('349990');
      setStep('review');
    }, 1500);
  };

  const handleGuardar = () => {
    if (name.length < 2) return;
    const list = MY_LISTS.find(l => l.id === selectedList);
    onNavigate('profile');
    setToast(`Guardado en ${list?.name ?? 'tu lista'}`);
  };

  const fmtPrice = (v: string) => {
    const n = parseInt(v.replace(/\D/g, ''));
    return isNaN(n) ? '' : n.toLocaleString('es-CL');
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <button onClick={onBack} className="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center">
          <X size={18} className="text-ink" />
        </button>
        <h1 className="font-display text-[24px] font-[800]">Nuevo deseo</h1>
        <div className="w-11" />
      </div>

      {/* Segmented selector */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-2 p-1 rounded-16" style={{ background: '#EFE8DE' }}>
          {(['link', 'manual'] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setStep('input'); }}
              className={`h-10 rounded-12 text-[14px] font-semibold transition-all ${mode === m ? 'bg-white text-ink' : 'text-ink-muted'}`}
              style={mode === m ? { boxShadow: '0 1px 4px rgba(48,34,56,.12)' } : {}}>
              {m === 'link' ? 'Desde un enlace' : 'Manual o experiencia'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4 pb-24">
        {mode === 'link' && step === 'input' && (
          <>
            <div>
              <label className="text-[14px] font-semibold text-ink block mb-2">Pega el enlace del producto</label>
              <input value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://www.falabella.com/…"
                className="w-full h-[54px] rounded-16 px-4 text-[14px] text-ink outline-none"
                style={{ border: '1.5px solid #D9CFC2', background: '#FAF7F2' }} />
            </div>
            <button onClick={() => setUrl('https://www.falabella.com/ejemplo-audífonos-sony')}
              className="self-start h-10 px-4 rounded-20 bg-lilac text-ink text-[13px] font-semibold">
              Pegar enlace de ejemplo
            </button>
            <Button variant="primary" size="lg" disabled={!url} onClick={handleRevisar}
              className={!url ? 'opacity-50' : ''}>
              Revisar enlace
            </Button>
            <p className="text-[13px] text-ink-muted leading-snug">Funciona con Falabella, Ripley, Paris, Mercado Libre y la mayoría de las tiendas. Si algo no se lee bien, lo corriges antes de guardar.</p>
          </>
        )}

        {mode === 'link' && step === 'loading' && (
          <div className="flex flex-col gap-4">
            {/* Skeleton */}
            <div className="rounded-20 bg-lilac animate-pulse" style={{ height: 220 }} />
            <div className="h-[22px] rounded-full bg-lilac animate-pulse" style={{ width: '70%' }} />
            <div className="h-[22px] rounded-full bg-lilac animate-pulse" style={{ width: '40%' }} />
            <p className="text-[14px] text-ink-muted text-center">Leyendo la tienda…</p>
          </div>
        )}

        {mode === 'link' && step === 'review' && (
          <>
            <div className="flex gap-3 p-3 bg-white rounded-16 border border-line">
              <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=96&h=96&fit=crop&auto=format" alt=""
                className="w-24 h-24 rounded-14 object-cover flex-shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-green-DEFAULT uppercase tracking-wide">Encontrado en Falabella</p>
                <p className="text-[14px] font-semibold text-ink mt-1">{name}</p>
              </div>
            </div>
            <FieldsForm name={name} setName={setName} price={price} setPrice={setPrice}
              note={note} setNote={setNote} isExp={false} fmtPrice={fmtPrice} />
            <ListSelector selectedList={selectedList} setSelectedList={setSelectedList} />
            <Button variant="primary" size="lg" disabled={name.length < 2} onClick={handleGuardar}>
              Guardar deseo
            </Button>
          </>
        )}

        {mode === 'manual' && (
          <>
            {/* Experience toggle */}
            <button onClick={() => setIsExp(e => !e)}
              className={`flex items-start gap-3 p-4 rounded-16 text-left transition-all ${isExp ? 'border-[1.5px] border-ink' : 'border-[1.5px] border-line'}`}
              style={{ background: isExp ? '#FAF7F2' : 'white' }}>
              <div className={`w-[22px] h-[22px] rounded-[6px] border-[1.5px] flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${isExp ? 'bg-white border-ink' : 'border-line-2 bg-sand'}`}>
                {isExp && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#302238" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <div>
                <p className="text-[14px] font-bold text-ink">Es una experiencia</p>
                <p className="text-[13px] text-ink-muted">Una clase, un viaje, una salida. Sin tienda asociada.</p>
              </div>
            </button>

            <FieldsForm name={name} setName={setName} price={price} setPrice={setPrice}
              note={note} setNote={setNote} isExp={isExp} fmtPrice={fmtPrice} />

            {price && parseInt(price.replace(/\D/g, '')) > 100000 && (
              <div className="rounded-16 px-4 py-3 bg-coral">
                <p className="text-[14px] text-ink"><strong>Sobre $100.000:</strong> tus amigos verán la opción de regalarlo en grupo.</p>
              </div>
            )}

            <ListSelector selectedList={selectedList} setSelectedList={setSelectedList} />
            <Button variant="primary" size="lg" disabled={name.length < 2} onClick={handleGuardar}>
              Guardar deseo
            </Button>
          </>
        )}
      </div>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}

function FieldsForm({ name, setName, price, setPrice, note, setNote, isExp, fmtPrice }: {
  name: string; setName: (v: string) => void;
  price: string; setPrice: (v: string) => void;
  note: string; setNote: (v: string) => void;
  isExp: boolean; fmtPrice: (v: string) => string;
}) {
  const inputCls = "w-full h-[50px] rounded-14 px-4 text-[14px] text-ink outline-none";
  const inputStyle = { border: '1.5px solid #D9CFC2', background: '#FAF7F2' };
  return (
    <div className="flex flex-col gap-3">
      <input value={name} onChange={e => setName(e.target.value)}
        placeholder={isExp ? 'Clase de cerámica en Barrio Italia' : 'Nombre del producto'}
        className={inputCls} style={inputStyle} />
      <input value={price ? `$${fmtPrice(price)}` : ''} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))}
        placeholder={isExp ? 'Precio aproximado' : 'Precio'}
        className={inputCls} style={inputStyle} inputMode="numeric" />
      <input value={note} onChange={e => setNote(e.target.value)}
        placeholder={isExp ? 'Cualquier sábado, para 2 personas' : 'Talla, color, modelo…'}
        className={inputCls} style={inputStyle} />
    </div>
  );
}

function ListSelector({ selectedList, setSelectedList }: { selectedList: string; setSelectedList: (v: string) => void }) {
  return (
    <div>
      <p className="text-[14px] font-semibold text-ink mb-2">Guardar en:</p>
      <div className="flex gap-2 flex-wrap">
        {MY_LISTS.map(l => (
          <button key={l.id} onClick={() => setSelectedList(l.id)}
            className={`flex items-center gap-2 h-11 pl-1 pr-3 rounded-20 border-[1.5px] transition-all ${selectedList === l.id ? 'bg-ink border-ink' : 'bg-transparent border-line'}`}>
            <img src={l.cover} alt="" className="w-8 h-8 rounded-full object-cover" />
            <span className={`text-[13px] font-semibold ${selectedList === l.id ? 'text-cream' : 'text-ink'}`}>{l.name}</span>
          </button>
        ))}
      </div>
      <p className="text-[13px] text-ink-muted mt-2">Visibilidad de la lista: con enlace.</p>
    </div>
  );
}
