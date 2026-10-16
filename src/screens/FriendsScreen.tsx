import { useState } from 'react';
import { ChevronLeft, Search, UserCheck, UserX } from 'lucide-react';
import { Toast, SectionLabel } from '../components/base';
import { FRIEND_REQUESTS, SUGGESTED_FRIENDS, FRIENDS_LIST } from '../components/data';
import type { FollowStatus } from '../App';

// All users pool: merge friends list + suggestions, deduplicated
const ALL_USERS = [
  ...FRIENDS_LIST,
  ...SUGGESTED_FRIENDS.filter(s => !FRIENDS_LIST.some(f => f.id === s.id)),
  { id: 'user_ana', name: 'Ana Martínez', username: 'ana.mtz', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop', mutual: 2 },
  { id: 'user_pedro', name: 'Pedro Gómez', username: 'pedro_g', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop', mutual: 0 },
  { id: 'user_lucia', name: 'Lucía Torres', username: 'lu_torres', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop', mutual: 1 },
];

type Props = {
  onBack: () => void;
  followStatus: Record<string, FollowStatus>;
  onFollow: (userId: string) => void;
  onAccept: (userId: string) => void;
  onReject: (userId: string) => void;
  onNavigate: (screen: string, data?: unknown) => void;
};

export function FriendsScreen({ onBack, followStatus, onFollow, onAccept, onReject, onNavigate }: Props) {
  const [requests, setRequests] = useState(FRIEND_REQUESTS);
  const [toast, setToast] = useState('');
  const [q, setQ] = useState('');

  const filtered = q.length >= 2
    ? ALL_USERS.filter(u =>
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.username.toLowerCase().includes(q.toLowerCase())
      )
    : [];

  const friends = FRIENDS_LIST.filter(f => followStatus[f.id] === 'friends');
  const suggestions = SUGGESTED_FRIENDS.filter(s => !followStatus[s.id] || followStatus[s.id] === 'none' || followStatus[s.id] === 'pending');

  function getFollowLabel(userId: string) {
    const st = followStatus[userId] ?? 'none';
    if (st === 'friends') return 'Siguiendo';
    if (st === 'pending') return 'Pendiente';
    return 'Seguir';
  }
  function getFollowClass(userId: string) {
    const st = followStatus[userId] ?? 'none';
    if (st === 'friends') return 'bg-transparent border-ink text-ink';
    if (st === 'pending') return 'bg-sand text-ink-muted border-[#D9CFC2]';
    return 'bg-ink text-cream border-ink';
  }

  const handleAccept = (r: typeof FRIEND_REQUESTS[0]) => {
    onAccept(r.id);
    setRequests(prev => prev.filter(x => x.id !== r.id));
    setToast(`Ahora eres amiga de ${r.name} 🎉`);
  };
  const handleReject = (r: typeof FRIEND_REQUESTS[0]) => {
    onReject(r.id);
    setRequests(prev => prev.filter(x => x.id !== r.id));
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 sticky top-0 bg-cream z-10" style={{ borderBottom: '1px solid #EAE2D6' }}>
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center">
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <h1 className="font-display text-[22px] font-[800] text-ink">Amigos</h1>
      </div>

      {/* Search */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-3 h-12 bg-white rounded-16 px-4" style={{ border: '1.5px solid #E2D8CB' }}>
          <Search size={17} className="text-ink-muted flex-shrink-0" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar personas por nombre o @usuario…"
            className="flex-1 text-[14px] text-ink outline-none bg-transparent" />
          {q && (
            <button onClick={() => setQ('')} className="text-ink-muted text-[18px] leading-none">×</button>
          )}
        </div>
      </div>

      {/* Search results */}
      {q.length >= 2 && (
        <div className="px-5 pb-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <Search size={32} className="text-ink-muted" />
              <p className="text-[14px] text-ink-muted">Sin resultados para "{q}"</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 mt-3">
              <SectionLabel>RESULTADOS · {filtered.length}</SectionLabel>
              {filtered.map(u => (
                <div key={u.id} className="flex items-center gap-3 py-3 border-b border-line">
                  <button onClick={() => onNavigate('friend', { ...u, cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=200&fit=crop', friendCount: 24, bio: '', likes: [] })}
                    className="flex items-center gap-3 flex-1 text-left">
                    <img src={u.avatar} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-ink truncate">{u.name}</p>
                      <p className="text-[12px] text-ink-muted">@{u.username}{u.mutual ? ` · ${u.mutual} en común` : ''}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => onFollow(u.id)}
                    className={`h-9 px-3.5 rounded-12 text-[13px] font-bold border transition-all ${getFollowClass(u.id)}`}>
                    {getFollowLabel(u.id)}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content when not searching */}
      {!q && (
        <div className="px-5 flex flex-col gap-6 pt-3">
          {/* Pending requests */}
          {requests.length > 0 && (
            <div className="flex flex-col gap-3">
              <SectionLabel>SOLICITUDES · {requests.length}</SectionLabel>
              {requests.map(r => (
                <div key={r.id} className="bg-white rounded-18 p-3.5 flex items-center gap-3"
                  style={{ border: '1px solid #EAE2D6' }}>
                  <img src={r.avatar} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-ink">{r.name}</p>
                    <p className="text-[12px] text-ink-muted">{r.mutual} amigos en común</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(r)}
                      className="h-9 w-9 rounded-12 bg-ink text-cream flex items-center justify-center">
                      <UserCheck size={16} />
                    </button>
                    <button onClick={() => handleReject(r)}
                      className="h-9 w-9 rounded-12 border border-ink text-ink flex items-center justify-center">
                      <UserX size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-3">
              <SectionLabel>QUIZÁS CONOCES</SectionLabel>
              {suggestions.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <button onClick={() => onNavigate('friend', { ...s, cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=200&fit=crop', friendCount: 18, bio: '', likes: [] })}
                    className="flex items-center gap-3 flex-1 text-left">
                    <img src={s.avatar} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-ink">{s.name}</p>
                      <p className="text-[12px] text-ink-muted">{s.mutual} amigos en común</p>
                    </div>
                  </button>
                  <button
                    onClick={() => onFollow(s.id)}
                    className={`h-9 px-3.5 rounded-12 text-[13px] font-bold border transition-all ${getFollowClass(s.id)}`}>
                    {getFollowLabel(s.id)}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* My friends */}
          {friends.length > 0 && (
            <div className="flex flex-col gap-3">
              <SectionLabel>MIS AMIGOS · {friends.length}</SectionLabel>
              {friends.map(f => (
                <div key={f.id} className="flex items-center gap-3">
                  <button onClick={() => onNavigate('friend', f)}
                    className="flex items-center gap-3 flex-1 text-left">
                    <img src={f.avatar} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-ink">{f.name}</p>
                      <p className="text-[12px] text-ink-muted">@{f.username}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => onFollow(f.id)}
                    className={`h-9 px-3.5 rounded-12 text-[13px] font-bold border transition-all ${getFollowClass(f.id)}`}>
                    {getFollowLabel(f.id)}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {requests.length === 0 && suggestions.length === 0 && friends.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center text-3xl">👥</div>
              <p className="text-[16px] font-bold text-ink">Busca amigos</p>
              <p className="text-[13px] text-ink-muted text-center max-w-[240px]">
                Escribe un nombre o @usuario en el buscador para encontrar personas
              </p>
            </div>
          )}
        </div>
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
