import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button, Sheet, Toast, ParticipantBadge, Spinner, fmt } from '../components/base';
import { CAMILA_WISHES, GROUP_MEMBERS } from '../components/data';
import type { Wish, GroupMember } from '../components/data';

type Props = {
  wish?: Wish;
  onBack: () => void;
  onNavigate: (screen: string, data?: unknown) => void;
};

type PayStatus = 'idle' | 'pending' | 'ok' | 'fail';

export function GroupScreen({ wish: selectedWish, onBack, onNavigate }: Props) {
  const wish = selectedWish ?? CAMILA_WISHES[0];
  const [showAporte, setShowAporte] = useState(false);
  const [payStatus, setPayStatus] = useState<PayStatus>('idle');
  const [selectedAmount, setSelectedAmount] = useState(40000);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const [reunido, setReunido] = useState(selectedWish && selectedWish.id !== CAMILA_WISHES[0].id ? 0 : 210000);
  const [members, setMembers] = useState<GroupMember[]>(GROUP_MEMBERS);
  const goal = wish.price;
  const pct = goal > 0 ? Math.min(100, Math.round((reunido / goal) * 100)) : 0;

  const handleAporte = () => {
    setPayStatus('pending');
    setTimeout(() => setPayStatus('ok'), 1600);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="flex items-center gap-3 px-3.5 py-2">
        <button onClick={onBack} className="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center">
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <span className="text-[15px] font-bold text-ink flex-1">Regalo grupal</span>
        <span className="flex items-center gap-1.5 bg-ink text-cream text-[12px] font-bold px-3 py-1.5 rounded-20">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Privado
        </span>
      </div>

      <div className="px-5 flex flex-col pb-[100px]" style={{ gap: 20, paddingTop: 6 }}>
        {/* Product row */}
        <div className="flex gap-4">
          <div className="relative flex-shrink-0">
            <img src={wish.image} alt="" className="w-[104px] h-[120px] rounded-20 object-cover"
              style={{ transform: 'rotate(-4deg)', boxShadow: '0 8px 20px rgba(48,34,56,.15)' }} />
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=44&h=44&fit=crop&auto=format" alt=""
              className="absolute -bottom-2.5 -right-2 w-11 h-11 rounded-full object-cover border-[3px] border-cream" />
          </div>
          <div className="flex flex-col justify-center gap-1.5">
            <p className="text-[13px] font-semibold text-coral-text">Para Camila · cumple jue 22</p>
            <h2 className="font-display text-[24px] font-[800] leading-tight text-ink">{wish.name}</h2>
            <p className="text-[13px] text-ink-muted">Camila no ve este grupo ni a sus participantes.</p>
          </div>
        </div>

        {/* Progress card */}
        <div className="rounded-24 p-5 text-cream flex flex-col gap-3.5 bg-ink">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[13px] font-semibold" style={{ opacity: .85 }}>Reunido</p>
              <p className="font-display text-[34px] font-[800] leading-none">{fmt(reunido)}</p>
            </div>
            <p className="text-[15px] text-cream" style={{ opacity: .75 }}>de {fmt(goal)}</p>
          </div>
          <div className="h-3.5 rounded-[7px] overflow-hidden" style={{ background: 'rgba(250,247,242,.15)' }}>
            <div className="h-full bg-coral rounded-[7px] transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-cream"><strong>{pct}%</strong> · faltan {fmt(goal - reunido)}</p>
            <p className="text-[13px] text-cream" style={{ opacity: .8 }}>Cierra mié 21 oct</p>
          </div>
        </div>

        {/* Organizer */}
        <div className="bg-white rounded-18 p-4 flex items-center gap-3 border border-line">
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=44&h=44&fit=crop&auto=format" alt=""
            className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-ink-muted uppercase tracking-wider">ORGANIZA</p>
            <p className="text-[14px] text-ink"><strong>Tomás</strong> compra el regalo al completar la meta</p>
          </div>
          <button onClick={() => onNavigate('messages')}
            className="h-9 px-3 rounded-12 border border-ink text-ink text-[13px] font-semibold">
            Chat
          </button>
        </div>

        {/* Participants */}
        <div>
          <h3 className="font-display text-[18px] font-[700] mb-3">Participantes · {members.length}</h3>
          <div className="flex flex-col gap-2.5">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <img src={m.avatar} alt="" className="w-[42px] h-[42px] rounded-full object-cover" />
                <p className="text-[15px] font-semibold text-ink flex-1">{m.name}</p>
                <ParticipantBadge status={m.status} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-line">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5D72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p className="text-[12px] text-ink-muted">Los montos individuales son privados. Todos ven solo el total.</p>
          </div>
        </div>

        {/* Invite link */}
        <div className="rounded-20 p-4 flex flex-col gap-3" style={{ border: '1.5px dashed #C9BCD6', background: '#F6F1FA' }}>
          <div className="flex gap-2">
            <div className="flex-1 bg-white rounded-12 h-11 px-3 flex items-center overflow-hidden">
              <p className="text-[13px] text-ink-muted truncate">giftloop.cl/grupo/camila-cumple29</p>
            </div>
            <button
              onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }}
              className="h-11 px-4 rounded-12 border border-ink text-ink text-[13px] font-semibold flex-shrink-0">
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <button className="w-full h-[46px] rounded-18 bg-green text-white text-[15px] font-bold flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Enviar por WhatsApp
          </button>
          <p className="text-[12px] text-ink-muted text-center">El enlace no funciona para Camila: la reconocemos y le mostramos su lista normal.</p>
        </div>
      </div>

      {/* CTA fixed */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] px-5 pb-7 pt-3.5"
        style={{ background: 'linear-gradient(180deg,rgba(250,247,242,0),#FAF7F2 30%)' }}>
        <Button variant="primary" size="lg" onClick={() => setShowAporte(true)}>
          Aportar al regalo
        </Button>
      </div>

      {/* Sheet: Aporte */}
      <Sheet open={showAporte} onClose={() => { if (payStatus !== 'pending') { setShowAporte(false); setPayStatus('idle'); } }}>
        {/* Demo banner */}
        <div className="rounded-14 px-3 py-2.5 mb-4 text-center" style={{ background: '#FFF3D6' }}>
          <p className="text-[13px] font-semibold" style={{ color: '#5B4A1E' }}>Pago de demostración: no se cobra dinero real.</p>
        </div>

        {payStatus === 'idle' && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-[24px] font-[800]">¿Cuánto quieres aportar?</h2>
            <div className="grid grid-cols-3 gap-2">
              {[40000, 20000, 87500].map(amt => (
                <button key={amt} onClick={() => setSelectedAmount(amt)}
                  className={`h-14 rounded-16 text-[14px] font-bold transition-all ${selectedAmount === amt ? 'bg-ink text-cream' : 'bg-sand-2 text-ink'}`}>
                  {amt === 87500 ? 'Parte justa' : fmt(amt)}
                  {amt === 87500 && <span className="block text-[11px] font-semibold opacity-70">{fmt(87500)}</span>}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {['Mercado Pago (demo)', 'Tarjeta de débito o crédito (demo)'].map((m, i) => (
                <label key={m} className="flex items-center gap-3 p-3.5 rounded-16 border border-line cursor-pointer">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${i === 0 ? 'border-ink' : 'border-line'}`}>
                    {i === 0 && <div className="w-2.5 h-2.5 rounded-full bg-ink" />}
                  </div>
                  <span className="text-[14px] text-ink">{m}</span>
                </label>
              ))}
            </div>
            <p className="text-[13px] text-ink-muted text-center">Los demás verán que aportaste, no cuánto.</p>
            <Button variant="primary" size="lg" onClick={handleAporte}>
              Aportar {fmt(selectedAmount)} · demo
            </Button>
          </div>
        )}

        {payStatus === 'pending' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Spinner />
            <h2 className="font-display text-[24px] font-[800]">Pago pendiente</h2>
            <p className="text-[14px] text-ink-muted text-center">Confirmando {fmt(selectedAmount)} con el medio de pago (demo)…</p>
          </div>
        )}

        {payStatus === 'ok' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="font-display text-[24px] font-[800]">Aporte exitoso</h2>
            <p className="text-[14px] text-ink-muted text-center">
              Aportaste {fmt(selectedAmount)}. El grupo lleva {fmt(reunido + selectedAmount)} de {fmt(goal)}.
            </p>
            <Button variant="primary" size="lg" onClick={() => {
              setReunido(r => r + selectedAmount);
              setMembers(prev => prev.map(m => m.id === 'sofia' ? { ...m, status: 'paid' } : m));
              setShowAporte(false);
              setPayStatus('idle');
              setToast(`Aportaste ${fmt(selectedAmount)} al grupo.`);
            }}>
              Listo
            </Button>
          </div>
        )}

        {payStatus === 'fail' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-coral">
              <span className="text-ink font-display text-[28px] font-[800]">!</span>
            </div>
            <h2 className="font-display text-[24px] font-[800]">El pago falló</h2>
            <p className="text-[14px] text-ink-muted text-center">El medio de pago lo rechazó. No se cobró nada y tu lugar en el grupo se mantiene.</p>
            <Button variant="primary" size="lg" onClick={() => setPayStatus('idle')}>Reintentar</Button>
            <button onClick={() => { setShowAporte(false); setPayStatus('idle'); }}
              className="text-[14px] text-ink-muted underline underline-offset-[3px]">Más tarde</button>
          </div>
        )}
      </Sheet>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
