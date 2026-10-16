import { useState } from 'react';
import { Plus, Share } from 'lucide-react';
import { Button, Chip, Sheet, Toast, GiftBox3D, EMPTY_PROFILE_BOX, fmt } from '../components/base';
import { MY_LISTS, MY_WISHES } from '../components/data';
import type { AppUser } from '../App';

type Props = {
  currentUser: AppUser;
  onNavigate: (screen: string, data?: unknown) => void;
  onLogout: () => void;
};

export function ProfileScreen({ currentUser, onNavigate, onLogout }: Props) {
  const [showShare, setShowShare] = useState(false);
  const [visibility, setVisibility] = useState<'link' | 'friends' | 'private'>('link');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const wishes = MY_WISHES;

  const hasContent = wishes.length > 0;

  return (
    <div className="flex flex-col pb-[120px]" style={{ gap: 22, paddingTop: 20 }}>
      {/* Avatar & name */}
      <div className="px-5 flex flex-col gap-3">
        <div className="relative self-start">
          <img src={currentUser.avatar} alt="" className="w-[88px] h-[88px] rounded-full object-cover" />
          <span className="absolute bottom-0 right-0 w-[30px] h-[30px] rounded-10 bg-coral flex items-center justify-center text-ink text-[11px] font-[800]">30</span>
        </div>
        <div>
          <h1 className="font-display text-[26px] font-[800] text-ink">{currentUser.name}</h1>
          <p className="text-[14px] text-ink-muted">@{currentUser.username} · cumple 14 nov</p>
          <p className="text-[14px] text-ink-muted mt-0.5"><strong className="text-ink">86</strong> amigos · <strong className="text-ink">{wishes.length}</strong> deseos</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => setShowShare(true)}
            className="flex-[2] h-[50px] rounded-18 bg-ink text-cream text-[15px] font-bold flex items-center justify-center gap-2">
            <Share size={16} />
            Compartir mi lista
          </button>
          <button className="flex-1 h-[50px] rounded-18 border border-ink text-ink text-[15px] font-semibold">
            Editar
          </button>
        </div>
      </div>

      {/* Mis listas */}
      <div>
        <p className="font-display text-[18px] font-[700] px-5 mb-3">Mis listas</p>
        <div className="flex gap-4 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
          {MY_LISTS.map(l => {
            const visLabel = { link: 'Con enlace', friends: 'Amigos', private: 'Privada' }[l.visibility];
            return (
              <div key={l.id} className="flex-shrink-0 flex flex-col gap-2" style={{ width: 148 }}>
                <div className="relative" style={{ height: 178 }}>
                  {/* Stack effect */}
                  <div className="absolute rounded-20 bg-lilac" style={{ inset: '8px 6px -4px 10px', transform: 'rotate(4deg)', zIndex: 0 }} />
                  <img src={l.cover} alt="" className="relative rounded-20 w-full h-full object-cover"
                    style={{ zIndex: 1, boxShadow: '0 4px 16px rgba(48,34,56,.12)' }} />
                  <span className="absolute top-2 left-2 text-[11px] font-bold px-2 py-1 rounded-10 z-10"
                    style={{ background: 'rgba(250,247,242,.94)' }}>
                    {visLabel}
                  </span>
                </div>
                <p className="text-[15px] font-bold text-ink">{l.name}</p>
                <p className="text-[13px] text-ink-muted">{l.count} deseos</p>
              </div>
            );
          })}
          <div className="flex-shrink-0 flex flex-col gap-2" style={{ width: 148 }}>
            <div className="rounded-20 border-2 border-dashed border-line-2 flex items-center justify-center" style={{ height: 178 }}>
              <div className="flex flex-col items-center gap-1.5">
                <Plus size={24} className="text-ink-muted" />
                <p className="text-[13px] font-semibold text-ink-muted">Nueva lista</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gustos */}
      <div className="px-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-display text-[18px] font-[700]">Mis gustos</p>
          <p className="text-[13px] text-ink-muted">Ayudan a tus amigos a acertar</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Fotografía', 'Café', 'Lectura', 'Naturaleza'].map(tag => <Chip key={tag} label={tag} variant="tag" />)}
          <span className="inline-flex items-center px-3 py-[7px] rounded-20 bg-lilac text-ink text-[13px] font-semibold">Prefiero experiencias</span>
          <span className="inline-flex items-center px-3 py-[7px] rounded-20 text-[13px] font-semibold" style={{ background: '#FBE3DF', color: '#8E3427' }}>Mejor no: chocolates</span>
        </div>
      </div>

      {/* Wishes */}
      <div className="px-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-display text-[18px] font-[700]">Deseos</p>
          <button onClick={() => onNavigate('add')} className="text-[14px] font-semibold text-coral-text">+ Agregar</button>
        </div>

        {!hasContent ? (
          <div className="rounded-22 p-9 bg-white flex flex-col items-center gap-4" style={{ boxShadow: '0 2px 14px rgba(48,34,56,.06)' }}>
            <GiftBox3D palette={EMPTY_PROFILE_BOX} />
            <p className="font-display text-[22px] font-[800] text-center">Tu lista está esperando</p>
            <p className="text-[14px] text-ink-muted text-center">Agrega 3 deseos antes de compartirla: con eso tus amigos ya pueden elegir.</p>
            <Button variant="primary" size="md" onClick={() => onNavigate('add')}>Agregar primer deseo</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {wishes.map(w => (
              <div key={w.id} className="bg-white rounded-18 p-2.5 flex items-center gap-3 border border-line">
                <img src={w.image} alt="" className="w-16 h-16 rounded-14 object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-ink leading-tight line-clamp-2">{w.name}</p>
                  <p className="text-[13px] text-ink-muted mt-0.5">
                    <strong className="text-ink">{fmt(w.price)}</strong> · {w.list}
                  </p>
                  {w.kind === 'experience' && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-10 bg-ink text-cream text-[11px] font-bold">Experiencia</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5">
        <p className="text-[13px] text-ink-muted text-center">Las reservas de tus amigos son sorpresa: no verás quién eligió qué.</p>
      </div>

      {/* Logout */}
      <div className="px-5">
        <button onClick={onLogout} className="w-full text-[13px] text-ink-muted underline underline-offset-2 py-2">
          Cerrar sesión
        </button>
      </div>

      {/* Sheet: Compartir */}
      <Sheet open={showShare} onClose={() => setShowShare(false)} title="Compartir Cumple 30">
        <div className="flex flex-col gap-3 mb-5">
          {(['private', 'friends', 'link'] as const).map(v => {
            const labels = { private: 'Privada', friends: 'Amigos', link: 'Con enlace' };
            const descs = {
              private: 'Solo tú la ves. Útil mientras la armas.',
              friends: 'Tus 86 amigos la verán en tu perfil y recibirán un aviso 7 días antes de tu cumple.',
              link: 'Cualquiera con el enlace, sin cuenta.',
            };
            return (
              <button key={v} onClick={() => setVisibility(v)}
                className={`flex items-start gap-3 p-4 rounded-18 border-[1.5px] text-left transition-all ${visibility === v ? 'border-ink' : 'border-line'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${visibility === v ? 'border-ink' : 'border-line'}`}>
                  {visibility === v && <div className="w-2.5 h-2.5 rounded-full bg-ink" />}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-ink">{labels[v]}</p>
                  <p className="text-[13px] text-ink-muted mt-0.5">{descs[v]}</p>
                </div>
              </button>
            );
          })}
        </div>

        {visibility === 'link' && (
          <div className="mb-5">
            {/* WhatsApp preview */}
            <div className="rounded-16 p-4 mb-4" style={{ background: '#ECE5DD' }}>
              <div className="max-w-[80%] rounded-[16px_16px_16px_4px] p-3" style={{ background: '#D9F2D0' }}>
                <p className="text-[14px] text-ink">¡Se viene mi cumple 30! Les dejo mi lista por si quieren ideas: <strong>giftloop.cl/sofi/cumple30</strong></p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <a href="https://wa.me/?text=¡Se viene mi cumple 30! Les dejo mi lista: giftloop.cl/sofi/cumple30" target="_blank" rel="noopener noreferrer"
                className="w-full h-[46px] rounded-18 flex items-center justify-center gap-2 text-[15px] font-bold text-white"
                style={{ background: '#557A65' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Enviar por WhatsApp
              </a>
              <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1800); setToast('Enlace copiado'); }}
                className="w-full h-[46px] rounded-18 border border-ink text-ink text-[15px] font-semibold">
                {copied ? 'Enlace copiado' : 'Copiar enlace'}
              </button>
            </div>
          </div>
        )}
      </Sheet>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
