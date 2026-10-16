import { useState } from 'react';
import { Users, MessageCircle, Plus } from 'lucide-react';
import { Button, IconButton, GiftBox3D, HERO_BOX, EMPTY_HOME_BOX, Toast, fmt } from '../components/base';
import { FRIENDS_LIST, CAMILA, EXPLORE_CATALOG } from '../components/data';
import type { AppUser } from '../App';

type Props = {
  currentUser: AppUser;
  onNavigate: (screen: string, data?: unknown) => void;
};

export function HomeScreen({ currentUser, onNavigate }: Props) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  const showToast = (m: string) => { setToast(m); };

  const heroFriend = CAMILA;

  const today = new Date();
  const dayName = today.toLocaleDateString('es-CL', { weekday: 'long' });
  const dateStr = `${today.getDate()} de ${today.toLocaleDateString('es-CL', { month: 'long' })}`;

  return (
    <div className="flex flex-col pb-[120px] lg:pb-8" style={{ gap: 28, paddingTop: 8 }}>
      {/* Header — mobile: logo + icons; desktop: date + greeting + search */}
      <div className="px-5">
        {/* Mobile header */}
        <div className="flex items-center justify-between lg:hidden">
          <div>
            <h1 className="font-display text-[24px] font-[800] tracking-[-0.02em] text-ink">GiftLoop</h1>
            <p className="text-[13px] text-ink-muted">Hola, {currentUser.name.split(' ')[0]}</p>
          </div>
          <div className="flex gap-2">
            <IconButton onClick={() => onNavigate('friends')} badge="2">
              <Users size={20} strokeWidth={1.9} className="text-ink" />
            </IconButton>
            <IconButton onClick={() => onNavigate('messages')} badge="3">
              <MessageCircle size={20} strokeWidth={1.9} className="text-ink" />
            </IconButton>
          </div>
        </div>
        {/* Desktop header */}
        <div className="hidden lg:flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] text-ink-muted capitalize">{dayName} {dateStr}</p>
            <h1 className="font-display text-[28px] font-[800] tracking-[-0.02em] text-ink leading-tight">
              Hola, {currentUser.name.split(' ')[0]}
            </h1>
          </div>
          <div className="flex items-center gap-3 h-11 bg-white rounded-16 px-4 flex-1 max-w-[240px]"
            style={{ border: '1.5px solid #E2D8CB' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A7D90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Busca amigos, listas o ideas"
              className="text-[13px] text-ink bg-transparent outline-none flex-1 min-w-0 placeholder:text-ink-muted"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.length >= 2) {
                  onNavigate('friends');
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Christmas section */}
      <div className="px-4">
        <button
          onClick={() => onNavigate('christmas')}
          className="w-full rounded-[24px] overflow-hidden text-left relative"
          style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1A3A28 100%)', minHeight: 110 }}>
          {/* Snowflakes */}
          {[15, 35, 62, 82].map((x, i) => (
            <span key={x} className="absolute text-white select-none pointer-events-none"
              style={{ left: `${x}%`, top: `${12 + i * 14}%`, fontSize: 13 + i * 3, opacity: 0.12 }}>❄</span>
          ))}
          <div className="px-5 py-5 flex items-center gap-4">
            {/* Pine icon */}
            <div className="w-14 h-14 rounded-22 flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,.12)', border: '1.5px solid rgba(255,255,255,.2)' }}>
              <span style={{ fontSize: 30 }}>🎄</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[11px] font-semibold uppercase tracking-[.08em] mb-0.5"
                style={{ opacity: .7 }}>Edición especial · Navidad</p>
              <p className="text-white font-display text-[18px] font-[800] leading-tight">La magia de Navidad<br/>empieza con su carta</p>
              <p className="text-white text-[12px] mt-1" style={{ opacity: .7 }}>Prepara el saludo del Viejo Pascuero</p>
            </div>
          </div>
          {/* Bottom CTA bar */}
          <div className="flex items-center justify-between px-5 py-3"
            style={{ background: 'rgba(0,0,0,.2)', borderTop: '1px solid rgba(255,255,255,.1)' }}>
            <p className="text-white text-[13px]" style={{ opacity: .8 }}>🎁 Listas · presupuestos · tiendas</p>
            <span className="px-3.5 py-1.5 rounded-20 text-[13px] font-bold text-ink flex-shrink-0"
              style={{ background: '#C9A227' }}>Preparar →</span>
          </div>
        </button>
      </div>

      {/* Hero card */}
      <div className="px-4">
        <button
          onClick={() => onNavigate('friend', heroFriend)}
          className="w-full rounded-[28px] bg-ink overflow-hidden text-left relative"
          style={{ boxShadow: '0 18px 40px -18px rgba(48,34,56,.6)' }}>
          <img src={heroFriend.cover} alt="" className="w-full h-[330px] object-cover" style={{ objectPosition: 'center 20%' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(48,34,56,0) 35%,rgba(48,34,56,.92) 100%)' }} />
          {/* Top chips */}
          <div className="absolute top-4 left-4 flex gap-1.5">
            <span className="bg-coral text-ink text-[13px] font-bold px-3 py-[7px] rounded-20">En 6 días</span>
            <span className="text-[13px] font-semibold px-3 py-[7px] rounded-20" style={{ background: 'rgba(250,247,242,.92)' }}>Jue 22 oct</span>
          </div>
          {/* GiftBox top right */}
          <div className="absolute top-4 right-[22px]">
            <GiftBox3D palette={HERO_BOX} />
          </div>
          {/* Bottom text */}
          <div className="absolute left-5 right-5 bottom-[72px]">
            <p className="text-[13px] font-semibold uppercase tracking-[.06em] text-cream" style={{ opacity: .9 }}>PRÓXIMA CELEBRACIÓN</p>
            <h2 className="font-display text-[36px] font-[800] tracking-[-0.02em] text-cream leading-none mt-1">Camila cumple 29</h2>
            <p className="text-[15px] text-cream mt-1">Le gusta la montaña, el café y los vinilos</p>
          </div>
          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 py-3.5" style={{ background: 'rgba(48,34,56,1)', borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <div className="flex items-center gap-2">
              <div className="flex">
                {FRIENDS_LIST.slice(1, 4).map((f, i) => (
                  <img key={f.id} src={f.avatar} alt="" className="w-[30px] h-[30px] rounded-full object-cover border-2 border-ink" style={{ marginLeft: i > 0 ? -9 : 0 }} />
                ))}
              </div>
              <div>
                <p className="text-[13px] text-cream"><strong>3 amigos</strong> arman un regalo grupal</p>
                <p className="text-[13px] text-cream" style={{ opacity: .8 }}>Camila no lo ve</p>
              </div>
            </div>
            <span className="bg-cream text-ink text-[14px] font-bold px-3.5 py-2.5 rounded-14">Ver lista</span>
          </div>
        </button>
      </div>

      {/* Próximas celebraciones */}
      <div style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="font-display text-[20px] font-[700]">Próximas celebraciones</h2>
          <button onClick={() => onNavigate('calendar')} className="text-[14px] font-semibold text-coral-text">Calendario</button>
        </div>
        <div className="flex gap-3.5 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
          {FRIENDS_LIST.map(f => {
            const soon = f.daysUntil <= 7;
            const label = f.daysUntil <= 7 ? `${f.daysUntil} días` : f.daysUntil <= 30 ? `${f.daysUntil} días` : '1 mes+';
            return (
              <button key={f.id} onClick={() => onNavigate('friend', f)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5" style={{ width: 74 }}>
                <div className="rounded-full p-[3px]" style={{ background: soon ? '#EF7564' : '#E2D8CB' }}>
                  <img src={f.avatar} alt="" className="w-[62px] h-[62px] rounded-full object-cover border-[3px] border-cream" />
                </div>
                <p className="text-[13px] font-semibold text-ink truncate w-full text-center">{f.name.split(' ')[0]}</p>
                <p className="text-[12px] text-ink-muted">{label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tus amigos andan pidiendo */}
      <div className="px-5 flex flex-col gap-3">
        <h2 className="font-display text-[20px] font-[700]">Tus amigos andan pidiendo</h2>
        {/* Card with mosaic */}
        <div className="bg-white rounded-22 p-3.5" style={{ boxShadow: '0 2px 14px rgba(48,34,56,.06)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <img src={FRIENDS_LIST[1].avatar} alt="" className="w-[38px] h-[38px] rounded-full object-cover" />
            <p className="text-[14px] text-ink"><strong>Tomás</strong> armó la lista <strong>Viaje a Japón</strong></p>
          </div>
          <p className="text-[13px] text-ink-muted mb-2.5">hace 2 h · 4 deseos nuevos</p>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: '2fr 1fr', gridTemplateRows: '80px 80px' }}>
            <div className="row-span-2 rounded-14 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=200&h=170&fit=crop&auto=format" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-14 overflow-hidden"><img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&h=80&fit=crop&auto=format" alt="" className="w-full h-full object-cover" /></div>
            <div className="rounded-14 overflow-hidden"><img src="https://images.unsplash.com/photo-1511499767150-a7a1371514e5?w=100&h=80&fit=crop&auto=format" alt="" className="w-full h-full object-cover" /></div>
          </div>
        </div>
        {/* Green success strip */}
        <div className="rounded-18 px-3.5 py-3 flex items-center gap-3" style={{ background: '#E3ECE5' }}>
          <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#557A65' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p className="text-[14px] text-ink">El grupo de <strong>Valentina</strong> completó su meta. Bicicleta lista para su cumple.</p>
        </div>
        {/* Simple row */}
        <div className="flex items-center gap-3">
          <img src={FRIENDS_LIST[5].avatar} alt="" className="w-[38px] h-[38px] rounded-full object-cover flex-shrink-0" />
          <p className="text-[14px] text-ink flex-1"><strong>Ignacio</strong> guardó <strong>Kit de café de especialidad</strong></p>
          <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=48&h=48&fit=crop&auto=format" alt="" className="w-12 h-12 rounded-12 object-cover flex-shrink-0" />
        </div>
      </div>

      {/* Ideas para tu lista */}
      <div>
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="font-display text-[20px] font-[700]">Ideas para tu lista</h2>
          <button onClick={() => onNavigate('explore')} className="text-[14px] font-semibold text-coral-text">Explorar</button>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
          {EXPLORE_CATALOG.map(item => {
            const saved = savedIds.has(item.id);
            return (
              <div key={item.id} className="flex-shrink-0" style={{ width: 150 }}>
                <div className="relative rounded-20 overflow-hidden" style={{ height: 170 }}>
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setSavedIds(prev => { const s = new Set(prev); s.has(item.id) ? s.delete(item.id) : s.add(item.id); return s; });
                      if (!saved) showToast('Guardado en Cumple 30');
                    }}
                    className="absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: saved ? '#557A65' : '#FAF7F2', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
                    {saved
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <Plus size={16} className="text-ink" />}
                  </button>
                </div>
                <p className="text-[14px] font-semibold text-ink mt-2 leading-tight line-clamp-2">{item.name}</p>
                <p className="text-[14px] font-bold text-ink mt-0.5">{fmt(item.price)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saldo recibido */}
      <div className="px-5">
        <div className="rounded-18 px-4 py-3.5 flex items-center justify-between bg-lilac">
          <div>
            <p className="text-[12px] font-semibold text-ink-soft">Saldo recibido</p>
            <p className="font-display text-[18px] font-[700] text-ink">$42.000</p>
          </div>
          <Button variant="outline" size="sm" fullWidth={false}>Revisar</Button>
        </div>
      </div>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
