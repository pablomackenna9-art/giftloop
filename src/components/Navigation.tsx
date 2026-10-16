import { useState } from 'react';
import { Home, Compass, Bell, User, Plus, Gift } from 'lucide-react';
import { Sheet } from './base';

export type NavTab = 'home' | 'explore' | 'activity' | 'profile';

type Props = {
  active: NavTab;
  onChange: (tab: NavTab) => void;
  onNavigate: (screen: string, data?: unknown) => void;
};

const NAV_ITEMS = [
  { id: 'home' as NavTab, icon: <Home size={23} strokeWidth={1.9} />, label: 'Inicio' },
  { id: 'explore' as NavTab, icon: <Compass size={23} strokeWidth={1.9} />, label: 'Explorar' },
  { id: 'activity' as NavTab, icon: <Bell size={23} strokeWidth={1.9} />, label: 'Actividad', dot: true },
  { id: 'profile' as NavTab, icon: <User size={23} strokeWidth={1.9} />, label: 'Mi perfil' },
];

function CreateSheet({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (s: string) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Crear">
      <div className="flex flex-col gap-3">
        {[
          { bg: '#EF7564', icon: '🎁', title: 'Agregar deseo', sub: 'Pega un enlace o crea uno manual', screen: 'add' },
          { bg: '#EAE2F4', icon: '✨', title: 'Deseo de experiencia', sub: 'Clases, viajes, panoramas', screen: 'add-exp' },
          { bg: '#EAE2F4', icon: '👥', title: 'Regalo grupal', sub: 'Elige el deseo de un amigo', screen: 'friend' },
          { bg: '#F3EDE4', icon: '📤', title: 'Compartir mi lista', sub: 'Por WhatsApp o enlace', screen: 'profile' },
        ].map(item => (
          <button key={item.title} onClick={() => { onClose(); onNavigate(item.screen); }}
            className="flex items-center gap-4 rounded-18 p-3.5 text-left bg-white border border-line hover:bg-sand transition-colors">
            <div className="w-11 h-11 rounded-14 flex items-center justify-center text-[22px] flex-shrink-0" style={{ background: item.bg }}>
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
  );
}

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────
export function BottomNav({ active, onChange, onNavigate }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const left = NAV_ITEMS.slice(0, 2);
  const right = NAV_ITEMS.slice(2);

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] z-40 lg:hidden"
        style={{
          height: 88, display: 'grid', gridTemplateColumns: '1fr 1fr 58px 1fr 1fr',
          padding: '8px 8px 0', borderTop: '1px solid #EAE2D6',
          background: 'rgba(250,247,242,.94)', backdropFilter: 'blur(14px)',
        }}>
        {left.map(item => (
          <button key={item.id} onClick={() => onChange(item.id)}
            className="flex flex-col items-center justify-center h-[52px] gap-1"
            style={{ color: active === item.id ? '#302238' : '#8A7D90' }}>
            {item.icon}
            <span className="text-[11px] font-bold">{item.label}</span>
          </button>
        ))}
        <div className="flex items-start justify-center">
          <button onClick={() => setShowCreate(true)} style={{
            width: 58, height: 58, borderRadius: 20, background: '#EF7564',
            marginTop: -18, transform: 'rotate(-6deg)',
            boxShadow: '0 10px 22px -8px rgba(239,117,100,.8)',
          }} className="flex items-center justify-center">
            <Plus size={26} strokeWidth={2.4} className="text-ink" />
          </button>
        </div>
        {right.map(item => (
          <button key={item.id} onClick={() => onChange(item.id)}
            className="flex flex-col items-center justify-center h-[52px] gap-1 relative"
            style={{ color: active === item.id ? '#302238' : '#8A7D90' }}>
            <div className="relative">
              {item.icon}
              {item.dot && <div className="absolute -top-0.5 -right-0.5 w-[9px] h-[9px] rounded-full bg-coral border-2 border-cream" />}
            </div>
            <span className="text-[11px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} onNavigate={onNavigate} />
    </>
  );
}

// ─── DESKTOP SIDEBAR NAV ──────────────────────────────────────────────────────
export function SidebarNav({ active, onChange, onNavigate }: Props) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <aside className="hidden lg:flex flex-col gap-1 sticky top-8 w-[220px] flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-4">
          <div className="w-9 h-9 rounded-12 bg-coral flex items-center justify-center" style={{ boxShadow: '0 4px 12px rgba(239,117,100,.4)' }}>
            <Gift size={18} className="text-ink" />
          </div>
          <span className="font-display text-[22px] font-[800] tracking-[-0.02em] text-ink">GiftLoop</span>
        </div>

        {/* Nav items */}
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onChange(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-16 text-left transition-all ${active === item.id ? 'bg-sand text-ink font-bold' : 'text-ink-muted hover:bg-sand hover:text-ink'}`}>
            <div className="relative w-6 flex-shrink-0">
              {item.icon}
              {item.dot && <div className="absolute -top-0.5 -right-0.5 w-[9px] h-[9px] rounded-full bg-coral border-2 border-cream" />}
            </div>
            <span className="text-[15px] font-semibold">{item.label}</span>
          </button>
        ))}

        {/* Crear button */}
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-3 px-3 py-3 rounded-18 mt-2 font-bold text-[15px] text-ink transition-all"
          style={{ background: '#EF7564', boxShadow: '0 6px 16px rgba(239,117,100,.35)' }}>
          <Plus size={22} strokeWidth={2.4} />
          Crear
        </button>
      </aside>

      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} onNavigate={onNavigate} />
    </>
  );
}
