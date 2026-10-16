import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button, Sheet, Toast, PrivacyNote, fmt } from '../components/base';
import type { Wish } from '../components/data';
import { CAMILA_WISHES } from '../components/data';

type Props = {
  wish?: Wish;
  onBack: () => void;
  onNavigate: (screen: string, data?: unknown) => void;
};

export function WishScreen({ wish = CAMILA_WISHES[0], onBack, onNavigate }: Props) {
  const [status, setStatus] = useState(wish.status);
  const [imgIdx, setImgIdx] = useState(0);
  const [showReserve, setShowReserve] = useState(false);
  const [showOrganize, setShowOrganize] = useState(false);
  const [toast, setToast] = useState('');

  const images = [wish.image, wish.image, wish.image];

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Image gallery */}
      <div className="relative" style={{ height: 380 }}>
        <img src={images[imgIdx]} alt="" className="w-full h-full object-cover"
          onClick={() => setImgIdx(i => (i + 1) % images.length)} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(48,34,56,0) 60%,rgba(48,34,56,.3) 100%)' }} />
        <button onClick={onBack}
          className="absolute top-3 left-3.5 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(250,247,242,.94)' }}>
          <ChevronLeft size={20} className="text-ink" />
        </button>
        {/* Dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <div key={i} className="rounded-full bg-cream transition-all"
              style={{ width: i === imgIdx ? 22 : 7, height: 7, opacity: i === imgIdx ? 1 : 0.6 }} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 flex flex-col" style={{ gap: 16, paddingTop: 20 }}>
        {/* Owner row */}
        <div className="flex items-center gap-2">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=28&h=28&fit=crop&auto=format" alt=""
            className="w-7 h-7 rounded-full object-cover" />
          <p className="text-[14px] text-ink-muted">Deseo de <strong className="text-ink">Camila</strong> · lista Cumple 29</p>
        </div>

        {/* Title & price */}
        <div>
          <h1 className="font-display text-[26px] font-[800] leading-tight text-ink">{wish.name}</h1>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-[28px] font-[800] text-ink">{fmt(wish.price)}</span>
            <span className="text-[15px] text-ink-muted">{wish.store ? `en ${wish.store}` : 'Experiencia · sin tienda'}</span>
          </div>
        </div>

        {/* Note */}
        {wish.note && (
          <div className="bg-white rounded-16 p-3.5 border border-line">
            <div className="flex items-start gap-2">
              <span className="font-display text-[22px] font-[800] text-coral leading-none">"</span>
              <div>
                <p className="text-[13px] font-semibold text-ink mb-0.5">Nota de Camila</p>
                <p className="text-[14px] text-ink leading-snug">{wish.note}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions by status */}
        {status === 'free' && (
          <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" subtitle="Lo apartas para ti. Camila no lo verá."
              onClick={() => setShowReserve(true)}>
              Reservar este regalo
            </Button>
            <Button variant="coral" size="lg" subtitle={`Invita a otros y junten ${fmt(wish.price)} en privado.`}
              onClick={() => setShowOrganize(true)}>
              Organizar regalo grupal
            </Button>
            <button onClick={() => { setStatus('bought_me'); setToast('Marcado como comprado. Camila no recibe aviso.'); }}
              className="text-[14px] font-semibold underline underline-offset-[3px] text-ink text-center py-1">
              Ya lo compré por mi cuenta
            </button>
          </div>
        )}

        {status === 'reserved_me' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-16 p-3.5 flex items-start gap-3" style={{ background: '#E3ECE5' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#557A65" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <p className="text-[14px] text-ink leading-snug">
                <strong>Reservado por ti</strong> hasta el jue 22 oct. Para los demás aparece como no disponible; Camila no ve nada.
              </p>
            </div>
            {wish.store && (
              <Button variant="primary" size="lg" onClick={() => {}}>Comprar en {wish.store}</Button>
            )}
            <Button variant="outline" size="md" onClick={() => { setStatus('bought_me'); setToast('Marcado como comprado.'); }}>
              Marcar como comprado
            </Button>
            <button onClick={() => { setStatus('free'); setToast('Reserva liberada.'); }}
              className="text-[14px] font-semibold underline underline-offset-[3px] text-ink-muted text-center py-1">
              Liberar reserva
            </button>
          </div>
        )}

        {status === 'bought_me' && (
          <div className="rounded-16 p-4 bg-green">
            <p className="text-[14px] font-semibold text-white">
              <strong>Comprado.</strong> Nadie más podrá elegirlo. Camila lo descubrirá el día de su cumple.
            </p>
            <button onClick={() => setStatus('free')} className="text-[13px] text-white underline mt-2">Deshacer</button>
          </div>
        )}

        {status === 'reserved_other' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-16 p-4 bg-lilac">
              <p className="text-[14px] text-ink"><strong>Alguien ya lo reservó.</strong> Elige otro deseo de la lista; así no se repiten regalos.</p>
            </div>
            <Button variant="primary" size="lg" onClick={onBack}>Ver otros deseos</Button>
          </div>
        )}

        {status === 'group' && (
          <button onClick={() => onNavigate('group', wish)}
            className="w-full rounded-22 p-4 bg-coral text-left">
            <p className="text-[13px] font-semibold text-ink mb-1">Regalo grupal en curso</p>
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-[20px] font-[800] text-ink">{wish.groupPct}%</span>
            </div>
            <div className="h-2 rounded-full mb-2" style={{ background: 'rgba(48,34,56,.18)' }}>
              <div className="h-full bg-ink rounded-full transition-all" style={{ width: `${wish.groupPct}%` }} />
            </div>
            <p className="text-[13px] text-ink">Organiza Tomás · 5 participantes · privado</p>
            <div className="mt-3">
              <Button variant="primary" size="sm" fullWidth={false}>Ver regalo grupal</Button>
            </div>
          </button>
        )}
      </div>

      {/* Sheet: Reservar */}
      <Sheet open={showReserve} onClose={() => setShowReserve(false)} title="Reservar en secreto">
        <div className="flex items-center gap-3 mb-5 p-3 bg-sand rounded-16">
          <img src={wish.image} alt="" className="w-16 h-16 rounded-14 object-cover" />
          <div>
            <p className="text-[14px] font-semibold text-ink leading-tight">{wish.name}</p>
            <p className="text-[14px] font-bold text-ink mt-0.5">{fmt(wish.price)}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 mb-6">
          {[
            'Nadie más podrá elegirlo hasta el jue 22 oct.',
            'Camila sigue viéndolo como disponible.',
            'Reservar no cobra nada. Lo compras donde quieras y lo marcas.',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-[22px] h-[22px] rounded-full bg-lilac flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-ink">{i + 1}</div>
              <p className="text-[14px] text-ink leading-snug">{step}</p>
            </div>
          ))}
        </div>
        <Button variant="primary" size="lg" onClick={() => {
          setStatus('reserved_me');
          setShowReserve(false);
          setToast('Reservado. Queda entre tú y GiftLoop.');
        }}>
          Confirmar reserva
        </Button>
      </Sheet>

      {/* Sheet: Organizar */}
      <Sheet open={showOrganize} onClose={() => setShowOrganize(false)} title="Organizar regalo grupal">
        <div className="flex items-center gap-3 mb-4 p-3 bg-sand rounded-16">
          <img src={wish.image} alt="" className="w-16 h-16 rounded-14 object-cover" />
          <div>
            <p className="text-[14px] font-semibold text-ink">Meta {fmt(wish.price)} · cierra mié 21 oct</p>
          </div>
        </div>
        <p className="text-[14px] font-semibold text-ink mb-2">Invitar a:</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {['Tomás', 'Valentina', 'Joaquín', 'Fernanda'].map((n, i) => (
            <button key={n} className={`flex items-center gap-2 h-11 px-3 rounded-20 border-[1.5px] text-[13px] font-semibold transition-all ${i < 2 ? 'bg-ink text-cream border-ink' : 'border-ink text-ink bg-transparent'}`}>
              {n}
            </button>
          ))}
        </div>
        <div className="rounded-16 px-4 py-3 bg-coral mb-4">
          <p className="text-[14px] text-ink">Sugerido: <strong>{fmt(Math.ceil(wish.price / 3 / 500) * 500)}</strong> por persona entre 3 (contigo). Cada uno elige cuánto aporta y nadie ve montos ajenos.</p>
        </div>
        <PrivacyNote text="Privado: Camila no recibe avisos ni ve el grupo." />
        <div className="mt-5">
          <Button variant="primary" size="lg" onClick={() => {
            setShowOrganize(false);
            onNavigate('group', wish);
            setToast('Grupo creado. Comparte el enlace.');
          }}>
            Crear y obtener enlace
          </Button>
        </div>
      </Sheet>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
