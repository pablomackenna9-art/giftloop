import { useState } from 'react';
import { Home, Compass, Bell, User, Plus, Gift, MessageCircle, Users } from 'lucide-react';
import { Sheet } from './base';

export type NavTab = 'home' | 'explore' | 'activity' | 'profile';

type Props = {
  active: NavTab;
  onChange: (tab: NavTab) => void;
  onNavigate: (screen: string, data?: unknown) => void;
  currentScreen?: string;
  activityBadge?: number;
  messagesBadge?: number;
};

const BOTTOM_NAV_ITEMS = [
  { id: 'home' as NavTab, icon: <Home size={23} strokeWidth={1.9} />, label: 'Inicio' },
  { id: 'explore' as NavTab, icon: <Compass size={23} strokeWidth={1.9} />, label: 'Explorar' },
  { id: 'activity' as NavTab, icon: <Bell size={23} strokeWidth={1.9} />, label: 'Actividad' },
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
export function BottomNav({ active, onChange, onNavigate, activityBadge }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const left = BOTTOM_NAV_ITEMS.slice(0, 2);
  const right = BOTTOM_NAV_ITEMS.slice(2);

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
              {item.id === 'activity' && (activityBadge ?? 0) > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-[9px] h-[9px] rounded-full bg-coral border-2 border-cream" />
              )}
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
const SIDEBAR_ITEMS = [
  { id: 'home', icon: <Home size={20} strokeWidth={1.9} />, label: 'Inicio' },
  { id: 'explore', icon: <Compass size={20} strokeWidth={1.9} />, label: 'Explorar' },
  { id: 'activity', icon: <Bell size={20} strokeWidth={1.9} />, label: 'Actividad' },
  { id: 'messages', icon: <MessageCircle size={20} strokeWidth={1.9} />, label: 'Mensajes' },
  { id: 'friends', icon: <Users size={20} strokeWidth={1.9} />, label: 'Amigos' },
  { id: 'profile', icon: <User size={20} strokeWidth={1.9} />, label: 'Mi perfil' },
];

export function SidebarNav({ active, onChange, onNavigate, currentScreen, activityBadge, messagesBadge }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const activeId = currentScreen ?? active;

  return (
    <>
      <aside className="hidden lg:flex flex-col gap-0.5 sticky top-8 w-[200px] flex-shrink-0 h-fit">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-5">
          <div className="w-8 h-8 rounded-10 bg-coral flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: '0 4px 12px rgba(239,117,100,.4)' }}>
            <Gift size={16} className="text-ink" />
          </div>
          <span className="font-display text-[20px] font-[800] tracking-[-0.02em] text-ink">giftloop</span>
        </div>

        {SIDEBAR_ITEMS.map(item => {
          const isActive = activeId === item.id;
          return (
            <button key={item.id}
              onClick={() => {
                if (item.id === 'home' || item.id === 'explore' || item.id === 'activity' || item.id === 'profile') {
                  onChange(item.id as NavTab);
                } else {
                  onNavigate(item.id);
                }
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-12 text-left transition-all w-full ${
                isActive ? 'bg-ink text-cream font-bold' : 'text-ink hover:bg-sand font-medium'
              }`}>
              <div className="relative w-5 flex-shrink-0">
                {item.icon}
              </div>
              <span className="text-[14px] flex-1">{item.label}</span>
              {item.id === 'activity' && (activityBadge ?? 0) > 0 && (
                <span className="text-[12px] font-bold px-1.5 py-0.5 rounded-20 bg-coral text-ink">
                  {activityBadge}
                </span>
              )}
              {item.id === 'messages' && (messagesBadge ?? 0) > 0 && (
                <span className="text-[12px] font-bold px-1.5 py-0.5 rounded-20 bg-coral text-ink">
                  {messagesBadge}
                </span>
              )}
            </button>
          );
        })}

        {/* Crear button */}
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-12 mt-3 font-bold text-[14px] text-ink transition-all w-full"
          style={{ background: '#EF7564', boxShadow: '0 4px 14px rgba(239,117,100,.35)' }}>
          <Plus size={20} strokeWidth={2.4} />
          + Crear deseo
        </button>

        {/* Navidad card — bottom of sidebar */}
        <button
          onClick={() => onNavigate('christmas')}
          className="mt-4 w-full rounded-16 overflow-hidden text-left"
          style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1E4034 100%)' }}>
          <div className="px-3 py-3 flex items-center gap-2.5">
            <span className="text-[22px] flex-shrink-0">🎄</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[10px] font-semibold uppercase tracking-[.06em] leading-none mb-0.5" style={{ opacity: .7 }}>Edición especial</p>
              <p className="text-white text-[13px] font-bold leading-tight">Navidad en GiftLoop</p>
            </div>
          </div>
          <div className="px-3 py-1.5 flex items-center justify-between"
            style={{ background: 'rgba(0,0,0,.2)', borderTop: '1px solid rgba(255,255,255,.1)' }}>
            <p className="text-white text-[10px]" style={{ opacity: .7 }}>Cartas · listas · tiendas</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-20"
              style={{ background: '#C9A227', color: '#302238' }}>→</span>
          </div>
        </button>
      </aside>

      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} onNavigate={onNavigate} />
    </>
  );
}
