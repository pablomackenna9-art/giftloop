import { useState } from 'react';
import { Home, Compass, Bell, User, Plus, X, Link } from 'lucide-react';
import { Sheet } from './base';

export type NavTab = 'home' | 'explore' | 'activity' | 'profile';

type Props = {
  active: NavTab;
  onChange: (tab: NavTab) => void;
  onNavigate: (screen: string, data?: unknown) => void;
};

export function BottomNav({ active, onChange, onNavigate }: Props) {
  const [showCreate, setShowCreate] = useState(false);

  const items: { id: NavTab; icon: React.ReactNode; label: string; dot?: boolean }[] = [
    { id: 'home', icon: <Home size={23} strokeWidth={1.9} />, label: 'Inicio' },
    { id: 'explore', icon: <Compass size={23} strokeWidth={1.9} />, label: 'Explorar' },
  ];

  const rightItems: { id: NavTab; icon: React.ReactNode; label: string; dot?: boolean }[] = [
    { id: 'activity', icon: <Bell size={23} strokeWidth={1.9} />, label: 'Actividad', dot: true },
    { id: 'profile', icon: <User size={23} strokeWidth={1.9} />, label: 'Mi perfil' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] z-40"
        style={{
          height: 88, display: 'grid', gridTemplateColumns: '1fr 1fr 58px 1fr 1fr',
          padding: '8px 8px 0', borderTop: '1px solid #EAE2D6',
          background: 'rgba(250,247,242,.94)', backdropFilter: 'blur(14px)',
        }}>
        {items.map(item => (
          <button key={item.id} onClick={() => onChange(item.id)}
            className="flex flex-col items-center justify-center h-[52px] gap-1 transition-colors"
            style={{ color: active === item.id ? '#302238' : '#8A7D90' }}>
            {item.icon}
            <span className="text-[11px] font-bold">{item.label}</span>
          </button>
        ))}

        {/* Center Crear button */}
        <div className="flex items-start justify-center">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center justify-center"
            style={{
              width: 58, height: 58, borderRadius: 20,
              background: '#EF7564', marginTop: -18,
              transform: 'rotate(-6deg)',
              boxShadow: '0 10px 22px -8px rgba(239,117,100,.8)',
            }}>
            <Plus size={26} strokeWidth={2.4} className="text-ink" />
          </button>
        </div>

        {rightItems.map(item => (
          <button key={item.id} onClick={() => onChange(item.id)}
            className="flex flex-col items-center justify-center h-[52px] gap-1 transition-colors relative"
            style={{ color: active === item.id ? '#302238' : '#8A7D90' }}>
            <div className="relative">
              {item.icon}
              {item.dot && (
                <div className="absolute -top-0.5 -right-0.5 w-[9px] h-[9px] rounded-full bg-coral border-2 border-cream" />
              )}
            </div>
            <span className="text-[11px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Sheet: Crear */}
      <Sheet open={showCreate} onClose={() => setShowCreate(false)} title="Crear">
        <div className="flex flex-col gap-3">
          {[
            { icon: '🎁', bg: '#EF7564', title: 'Agregar deseo', sub: 'Pega un enlace o crea uno manual', action: () => { setShowCreate(false); onNavigate('add'); } },
            { icon: '✨', bg: '#EAE2F4', title: 'Deseo de experiencia', sub: 'Clases, viajes, panoramas', action: () => { setShowCreate(false); onNavigate('add-exp'); } },
            { icon: '👥', bg: '#EAE2F4', title: 'Regalo grupal', sub: 'Elige el deseo de un amigo', action: () => { setShowCreate(false); onNavigate('friend'); } },
            { icon: '📤', bg: '#F3EDE4', title: 'Compartir mi lista', sub: 'Por WhatsApp o enlace', action: () => { setShowCreate(false); onNavigate('profile'); } },
          ].map((item) => (
            <button key={item.title} onClick={item.action}
              className="flex items-center gap-4 rounded-18 p-3.5 text-left bg-white border border-line">
              <div className="w-11 h-11 rounded-14 flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ background: item.bg }}>
                {item.icon}
              </div>
              <div>
                <p className="text-[15px] font-bold text-ink">{item.title}</p>
                <p className="text-[13px] text-ink-muted">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
