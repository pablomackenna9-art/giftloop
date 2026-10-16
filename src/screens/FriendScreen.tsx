import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button, Chip, StatusBadge, PrivacyNote, fmt } from '../components/base';
import type { Friend, Wish } from '../components/data';
import { CAMILA, CAMILA_WISHES } from '../components/data';

type Props = {
  friend?: Friend;
  onBack: () => void;
  onNavigate: (screen: string, data?: unknown) => void;
  viewMode?: 'normal' | 'from_link' | 'recipient';
};

export function FriendScreen({ friend = CAMILA, onBack, onNavigate, viewMode = 'normal' }: Props) {
  const [activeList, setActiveList] = useState('cumple29');
  const [following, setFollowing] = useState(false);

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Cover */}
      <div className="relative" style={{ height: 190 }}>
        <img src={friend.cover} alt="" className="w-full h-full object-cover" />
        <button onClick={onBack}
          className="absolute top-3 left-3.5 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(250,247,242,.94)' }}>
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <span className="absolute top-3.5 right-4 bg-coral text-ink text-[13px] font-bold px-3 py-[7px] rounded-20">
          Cumple en 6 días
        </span>
      </div>

      {/* Content */}
      <div className="px-5 flex flex-col" style={{ marginTop: -50, gap: 14 }}>
        {/* Avatar */}
        <img src={friend.avatar} alt="" className="w-[100px] h-[100px] rounded-full object-cover border-[5px] border-cream" />

        {/* Name & bio */}
        <div>
          <h1 className="font-display text-[30px] font-[800] tracking-[-0.02em] text-ink leading-none">{friend.name}</h1>
          <p className="text-[14px] text-ink-muted mt-1">@{friend.username} · {friend.location} · {friend.friendCount} amigos</p>
          <p className="text-[15px] text-ink mt-2 leading-snug">{friend.bio}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5">
          <Button onClick={() => onNavigate('messages')} size="md" className="flex-1 rounded-14">Mensaje</Button>
          <button onClick={() => setFollowing(f => !f)}
            className={`flex-1 h-[46px] rounded-14 text-[14px] font-semibold border transition-all ${following ? 'bg-transparent border-ink text-ink' : 'bg-ink text-cream border-ink'}`}>
            {following ? 'Siguiendo' : 'Seguir'}
          </button>
        </div>

        {/* Link notice */}
        {viewMode === 'from_link' && (
          <div className="rounded-16 border border-dashed border-ink p-3.5 flex items-start gap-2.5 bg-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#302238" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <p className="text-[14px] text-ink">Abriste la lista <strong>Cumple 29</strong> desde un enlace que compartió Camila. Elige un deseo para reservarlo.</p>
          </div>
        )}

        {/* Privacy note */}
        {viewMode !== 'recipient' && (
          <PrivacyNote text={<>Reservas y regalos grupales son <strong>secretos</strong>: Camila no los ve.</>} />
        )}

        {/* Recipient view notice */}
        {viewMode === 'recipient' && (
          <div className="rounded-16 px-4 py-3 bg-ink text-cream text-[13px] leading-snug">
            Así ve Camila su lista: sin reservas, compras ni grupos. La sorpresa queda intacta.
          </div>
        )}

        {/* Lo que le gusta */}
        <div className="bg-white rounded-22 p-4 flex flex-col gap-3">
          <h3 className="font-display text-[18px] font-[700]">Lo que le gusta</h3>
          <div className="flex flex-wrap gap-2">
            {friend.likes?.map(tag => <Chip key={tag} label={tag} variant="tag" />)}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[['Ropa', 'M'], ['Calzado', '38'], ['Colores', 'Tierra']].map(([label, val]) => (
              <div key={label} className="bg-cream rounded-14 p-2.5 text-center">
                <p className="text-[12px] text-ink-muted">{label}</p>
                <p className="text-[14px] font-bold text-ink">{val}</p>
              </div>
            ))}
          </div>
          {friend.avoid && (
            <p className="text-[14px] text-ink"><strong>Mejor no:</strong> {friend.avoid}.</p>
          )}
        </div>

        {/* List chips */}
        <div className="flex gap-2">
          {[{ id: 'cumple29', label: 'Cumple 29', count: 6 }, { id: 'navidad', label: 'Navidad', count: 3 }].map(l => (
            <button key={l.id} onClick={() => setActiveList(l.id)}
              className={`h-10 px-4 rounded-20 text-[14px] font-semibold border-[1.5px] transition-all ${activeList === l.id ? 'bg-ink text-cream border-ink' : 'border-[#D9CFC2] text-ink bg-transparent'}`}>
              {l.label} · {l.count}
            </button>
          ))}
        </div>

        {/* Wish grid */}
        <div className="grid grid-cols-2 gap-3">
          {CAMILA_WISHES.map((wish, i) => (
            <button
              key={wish.id}
              onClick={() => onNavigate('wish', wish)}
              className={`text-left rounded-20 overflow-hidden bg-white ${i === 0 ? 'col-span-2' : ''}`}
              style={{ opacity: wish.status === 'reserved_other' ? 0.6 : 1 }}>
              <div className="relative" style={{ height: i === 0 ? 240 : 170 }}>
                <img src={wish.image} alt="" className="w-full h-full object-cover"
                  style={{ filter: wish.status === 'reserved_other' ? 'grayscale(.7)' : 'none' }} />
                {wish.kind === 'experience' && (
                  <span className="absolute top-2 left-2 bg-ink text-cream text-[12px] font-bold px-2.5 py-1.5 rounded-10">Experiencia</span>
                )}
                {viewMode !== 'recipient' && <StatusBadge status={wish.status} pct={wish.groupPct} />}
              </div>
              <div className="p-3">
                <p className="text-[14px] font-semibold text-ink leading-snug line-clamp-2">{wish.name}</p>
                <p className="text-[13px] text-ink-muted mt-0.5">
                  <strong className="text-ink">{fmt(wish.price)}</strong>
                  {wish.store ? ` · ${wish.store}` : ' · Experiencia'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
