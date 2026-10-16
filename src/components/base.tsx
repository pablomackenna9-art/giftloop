import { useState, useEffect } from 'react';

// ─── GIFT BOX 3D ──────────────────────────────────────────────────────────────
type GiftBoxPalette = { a: string; b: string; t: string; r: string; size: number };
export function GiftBox3D({ palette, className = '' }: { palette: GiftBoxPalette; className?: string }) {
  const { a, b, t, r, size } = palette;
  const h = size / 2;
  const ribbon = `linear-gradient(90deg, transparent 42%, ${r} 42% 58%, transparent 58%)`;
  const faceStyle = (bg: string, transform: string): React.CSSProperties => ({
    position: 'absolute', width: size, height: size, background: bg,
    borderRadius: 4, transform,
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.06)',
    backgroundImage: ribbon, backgroundSize: '100% 100%',
  });
  return (
    <div className={`animate-float ${className}`} style={{ width: size * 1.35, height: size * 1.77, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ perspective: 600, width: size, height: size }}>
        <div className="animate-giftspin" style={{ width: size, height: size, position: 'relative', transformStyle: 'preserve-3d' }}>
          <div style={faceStyle(a, `translateZ(${h}px)`)} />
          <div style={faceStyle(a, `rotateY(180deg) translateZ(${h}px)`)} />
          <div style={faceStyle(b, `rotateY(90deg) translateZ(${h}px)`)} />
          <div style={faceStyle(b, `rotateY(-90deg) translateZ(${h}px)`)} />
          <div style={faceStyle(b, `rotateX(-90deg) translateZ(${h}px)`)} />
          <div style={{
            ...faceStyle(t, `rotateX(90deg) translateZ(${h}px)`),
            backgroundImage: `linear-gradient(90deg, transparent 42%, ${r} 42% 58%, transparent 58%), linear-gradient(0deg, transparent 42%, ${r} 42% 58%, transparent 58%)`,
          }} />
        </div>
      </div>
    </div>
  );
}

export const HERO_BOX: GiftBoxPalette = { a: '#EF7564', b: '#D9604F', t: '#F59384', r: '#EAE2F4', size: 62 };
export const EMPTY_HOME_BOX: GiftBoxPalette = { a: '#FAF7F2', b: '#E9DFD1', t: '#FFFFFF', r: '#EF7564', size: 70 };
export const EMPTY_PROFILE_BOX: GiftBoxPalette = { a: '#EAE2F4', b: '#D6CAE6', t: '#F3EEF9', r: '#EF7564', size: 56 };

// ─── SPINNER ──────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      border: '5px solid #EAE2F4', borderTopColor: '#302238',
      animation: 'spin .8s linear infinite',
    }} />
  );
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'coral' | 'outline' | 'link' | 'success';
type BtnSize = 'lg' | 'md' | 'sm';
export function Button({
  variant = 'primary', size = 'md', children, onClick, disabled, className = '', subtitle, fullWidth = true,
}: {
  variant?: BtnVariant; size?: BtnSize; children: React.ReactNode;
  onClick?: () => void; disabled?: boolean; className?: string; subtitle?: string; fullWidth?: boolean;
}) {
  const base = 'font-sans font-bold transition-all flex items-center justify-center rounded-18';
  const sizes: Record<BtnSize, string> = {
    lg: 'h-14 px-5 text-[17px]',
    md: 'h-12 px-4 text-[15px]',
    sm: 'h-10 px-3 text-[13px] rounded-14',
  };
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-ink text-cream',
    coral: 'bg-coral text-ink',
    outline: 'border border-ink bg-transparent text-ink font-semibold',
    link: 'underline underline-offset-[3px] bg-transparent text-ink',
    success: 'bg-green text-white',
  };
  if (subtitle) {
    return (
      <button onClick={onClick} disabled={disabled}
        className={`${fullWidth ? 'w-full' : ''} flex flex-col items-start px-[18px] py-[14px] rounded-18 transition-all ${variants[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}>
        <span className="text-[17px] font-bold leading-tight">{children}</span>
        <span className="text-[13px] opacity-85 leading-tight mt-0.5">{subtitle}</span>
      </button>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} ${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}>
      {children}
    </button>
  );
}

// ─── ICON BUTTON ──────────────────────────────────────────────────────────────
export function IconButton({ children, onClick, badge, className = '' }: {
  children: React.ReactNode; onClick?: () => void; badge?: string | number; className?: string;
}) {
  return (
    <button onClick={onClick} className={`relative w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center ${className}`}>
      {children}
      {badge !== undefined && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-[9px] bg-coral text-ink text-[11px] font-bold flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── CHIP ─────────────────────────────────────────────────────────────────────
export function Chip({ label, active, variant = 'filter', onClick }: {
  label: string; active?: boolean; variant?: 'filter' | 'budget' | 'tag'; onClick?: () => void;
}) {
  if (variant === 'tag') return (
    <span className="inline-flex items-center px-3 py-[7px] rounded-20 bg-sand text-ink text-[13px] font-semibold">{label}</span>
  );
  if (variant === 'budget') return (
    <button onClick={onClick} className={`h-10 px-3 rounded-12 text-[13px] font-semibold transition-all ${active ? 'bg-ink text-cream' : 'bg-sand-2 text-ink'}`}>
      {label}
    </button>
  );
  return (
    <button onClick={onClick} className={`h-10 px-4 rounded-20 text-[13px] font-semibold border-[1.5px] transition-all ${active ? 'bg-ink text-cream border-ink' : 'border-ink text-ink bg-transparent'}`}>
      {label}
    </button>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
type WishStatus = 'free' | 'reserved_me' | 'bought_me' | 'reserved_other' | 'group';
export function StatusBadge({ status, pct }: { status: WishStatus; pct?: number }) {
  const styles: Record<WishStatus, string> = {
    free: 'hidden',
    reserved_me: 'bg-green text-white',
    bought_me: 'bg-green text-white',
    reserved_other: 'bg-cream text-ink',
    group: 'bg-coral text-ink',
  };
  const labels: Record<WishStatus, string> = {
    free: '',
    reserved_me: 'Reservado por ti',
    bought_me: 'Comprado por ti',
    reserved_other: 'Ya reservado',
    group: `Grupal · ${pct ?? 0}%`,
  };
  if (status === 'free') return null;
  return (
    <span className={`absolute bottom-2 left-2 px-[10px] py-[6px] rounded-12 text-[12px] font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── PARTICIPANT BADGE ────────────────────────────────────────────────────────
type ParticipantStatus = 'paid' | 'pending' | 'invited' | 'organizer';
export function ParticipantBadge({ status }: { status: ParticipantStatus }) {
  const styles: Record<ParticipantStatus, string> = {
    paid: 'bg-green text-white',
    pending: 'bg-lilac text-ink',
    invited: 'border-[1.5px] border-lilac-line text-ink bg-transparent',
    organizer: 'bg-ink text-cream',
  };
  const labels: Record<ParticipantStatus, string> = {
    paid: 'Aportó', pending: 'Pendiente', invited: 'Invitado', organizer: 'Organizas',
  };
  return (
    <span className={`px-2 py-1 rounded-10 text-[12px] font-semibold ${styles[status]}`}>{labels[status]}</span>
  );
}

// ─── SHEET ────────────────────────────────────────────────────────────────────
export function Sheet({ open, onClose, children, title }: {
  open: boolean; onClose: () => void; children: React.ReactNode; title?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}
      style={{ background: 'rgba(29,21,32,.45)' }}>
      <div className="w-full bg-cream overflow-y-auto" onClick={e => e.stopPropagation()}
        style={{ borderRadius: '30px 30px 0 0', maxHeight: '88%', padding: '10px 20px 34px' }}>
        <div className="flex justify-center mb-4">
          <div style={{ width: 40, height: 5, borderRadius: 3, background: '#D9CFC2' }} />
        </div>
        {title && <h2 className="font-display text-[24px] font-[800] leading-tight mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div className="fixed left-5 right-5 z-[60] pointer-events-none"
      style={{ bottom: 104, background: '#302238', borderRadius: 16, padding: '14px 16px', boxShadow: '0 12px 28px -10px rgba(29,21,32,.6)' }}>
      <p className="text-cream text-[14px] font-semibold text-center">{message}</p>
    </div>
  );
}

// ─── PRIVACY NOTE ─────────────────────────────────────────────────────────────
export function PrivacyNote({ text }: { text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-lilac rounded-16 px-[14px] py-3">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#302238" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <p className="text-[14px] text-ink leading-snug">{text}</p>
    </div>
  );
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: string }) {
  return <p className="text-[13px] font-bold uppercase tracking-[.06em] text-ink-muted">{children}</p>;
}

// ─── fmt helper ───────────────────────────────────────────────────────────────
export const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;
