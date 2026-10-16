import { useState } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { Toast, SectionLabel } from '../components/base';
import { FRIEND_REQUESTS, SUGGESTED_FRIENDS, FRIENDS_LIST } from '../components/data';

type Props = { onBack: () => void };

export function FriendsScreen({ onBack }: Props) {
  const [requests, setRequests] = useState(FRIEND_REQUESTS);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');
  const [q, setQ] = useState('');

  const filtered = FRIENDS_LIST.filter(f => f.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="flex items-center gap-3 px-5 py-4">
        <button onClick={onBack} className="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center">
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <h1 className="font-display text-[24px] font-[800] text-ink">Amigos</h1>
      </div>

      <div className="px-5 flex flex-col gap-5">
        {/* Search */}
        <div className="flex items-center gap-3 h-12 bg-white rounded-16 px-4" style={{ border: '1.5px solid #E2D8CB' }}>
          <Search size={17} className="text-ink-muted flex-shrink-0" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar amigos…" className="flex-1 text-[14px] text-ink outline-none bg-transparent" />
        </div>

        {/* Friend requests */}
        {requests.length > 0 && (
          <div className="flex flex-col gap-3">
            <SectionLabel>SOLICITUDES</SectionLabel>
            {requests.map(r => (
              <div key={r.id} className="flex items-center gap-3">
                <img src={r.avatar} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-ink">{r.name}</p>
                  <p className="text-[12px] text-ink-muted">{r.mutual} amigos en común</p>
                </div>
                <button onClick={() => { setRequests(prev => prev.filter(x => x.id !== r.id)); setToast(`Ahora eres amiga de ${r.name}`); }}
                  className="h-9 px-3.5 rounded-12 bg-ink text-cream text-[13px] font-bold">
                  Aceptar
                </button>
                <button onClick={() => setRequests(prev => prev.filter(x => x.id !== r.id))}
                  className="w-[38px] h-[38px] rounded-12 border border-ink text-ink text-[16px] font-bold flex items-center justify-center">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        <div className="flex flex-col gap-3">
          <SectionLabel>QUIZÁS CONOCES</SectionLabel>
          {SUGGESTED_FRIENDS.map(s => (
            <div key={s.id} className="flex items-center gap-3">
              <img src={s.avatar} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-ink">{s.name}</p>
                <p className="text-[12px] text-ink-muted">{s.mutual} amigos en común</p>
              </div>
              <button onClick={() => setFollowing(prev => { const s2 = new Set(prev); s2.has(s.id) ? s2.delete(s.id) : s2.add(s.id); return s2; })}
                className={`h-9 px-3.5 rounded-12 text-[13px] font-bold border transition-all ${following.has(s.id) ? 'bg-lilac text-ink border-lilac' : 'bg-ink text-cream border-ink'}`}>
                {following.has(s.id) ? 'Siguiendo' : 'Seguir'}
              </button>
            </div>
          ))}
        </div>

        {/* Friends list */}
        {q && (
          <div className="flex flex-col gap-3">
            <SectionLabel>RESULTADOS</SectionLabel>
            {filtered.map(f => (
              <div key={f.id} className="flex items-center gap-3">
                <img src={f.avatar} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-ink">{f.name}</p>
                  <p className="text-[12px] text-ink-muted">@{f.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
