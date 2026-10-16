import { ChevronLeft } from 'lucide-react';
import { MESSAGES } from '../components/data';

type Props = { onBack: () => void; onNavigate: (screen: string, data?: unknown) => void };

export function MessagesScreen({ onBack, onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-cream">
      <div className="flex items-center gap-3 px-5 py-4">
        <button onClick={onBack} className="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center">
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <h1 className="font-display text-[24px] font-[800] text-ink">Mensajes</h1>
      </div>
      <div className="flex flex-col gap-0.5 px-5">
        {MESSAGES.map(m => (
          <button key={m.id} onClick={() => m.isGroup && onNavigate('group')}
            className="flex items-center gap-3 py-4 border-b border-line text-left w-full">
            {m.isGroup ? (
              <img src={m.image} alt="" className="w-[52px] h-[52px] rounded-14 object-cover flex-shrink-0" />
            ) : (
              <img src={m.avatar} alt="" className="w-[52px] h-[52px] rounded-full object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[15px] font-bold text-ink truncate">{m.name}</p>
                <p className="text-[12px] text-ink-muted flex-shrink-0 ml-2">{m.time}</p>
              </div>
              <p className="text-[13px] text-ink-muted truncate">{m.last}</p>
            </div>
            {m.unread > 0 && (
              <div className="w-5 h-5 rounded-full bg-coral flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-ink">{m.unread}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
