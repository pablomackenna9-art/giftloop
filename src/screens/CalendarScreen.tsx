import { ChevronLeft, Gift, Calendar as CalendarIcon } from 'lucide-react';
import { FRIENDS_LIST } from '../components/data';

export type CalendarEvent = {
  id: string;
  title: string;
  subtitle?: string;
  date: string; // 'MM-DD'
  type: 'birthday' | 'event';
  avatar?: string;
};

type Props = {
  onBack: () => void;
  onNavigate: (screen: string, data?: unknown) => void;
  extraEvents?: CalendarEvent[];
};

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTH_SHORT = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

function parseMMDD(mmdd: string): { month: number; day: number } {
  const [m, d] = mmdd.split('-').map(Number);
  return { month: m, day: d };
}

function dateLabel(mmdd: string): string {
  const { month, day } = parseMMDD(mmdd);
  return `${day} de ${MONTH_NAMES[month - 1]}`;
}

function isSoon(mmdd: string, days = 7): boolean {
  const today = new Date();
  const { month, day } = parseMMDD(mmdd);
  const target = new Date(today.getFullYear(), month - 1, day);
  if (target < today) target.setFullYear(today.getFullYear() + 1);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return diff <= days;
}

function daysUntilMMDD(mmdd: string): number {
  const today = new Date();
  const { month, day } = parseMMDD(mmdd);
  const target = new Date(today.getFullYear(), month - 1, day);
  if (target < today) target.setFullYear(today.getFullYear() + 1);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function CalendarScreen({ onBack, onNavigate, extraEvents = [] }: Props) {
  // Build events from friends birthdays
  const friendEvents: CalendarEvent[] = FRIENDS_LIST
    .filter(f => f.birthday)
    .map(f => ({
      id: `bday_${f.id}`,
      title: `Cumpleaños de ${f.name.split(' ')[0]}`,
      subtitle: f.name,
      date: f.birthday,
      type: 'birthday' as const,
      avatar: f.avatar,
    }));

  const allEvents = [...friendEvents, ...extraEvents]
    .filter(e => e.date)
    .sort((a, b) => daysUntilMMDD(a.date) - daysUntilMMDD(b.date));

  // Group by month
  const grouped: Record<number, CalendarEvent[]> = {};
  for (const ev of allEvents) {
    const { month } = parseMMDD(ev.date);
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(ev);
  }

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const months = Object.keys(grouped).map(Number).sort((a, b) => {
    const da = a >= currentMonth ? a - currentMonth : a + 12 - currentMonth;
    const db = b >= currentMonth ? b - currentMonth : b + 12 - currentMonth;
    return da - db;
  });

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <button onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(48,34,56,.08)' }}>
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <h1 className="font-display text-[22px] font-[800] tracking-[-0.02em] text-ink">Calendario</h1>
      </div>

      {/* Month groups */}
      <div className="px-5 flex flex-col gap-6">
        {months.map(month => (
          <div key={month}>
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon size={14} className="text-coral" />
              <p className="text-[13px] font-bold text-ink uppercase tracking-[.06em]">
                {MONTH_NAMES[month - 1]}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {grouped[month].map(ev => {
                const { day } = parseMMDD(ev.date);
                const soon = isSoon(ev.date);
                const daysLeft = daysUntilMMDD(ev.date);
                const friend = FRIENDS_LIST.find(f => ev.id === `bday_${f.id}`);
                return (
                  <button
                    key={ev.id}
                    onClick={() => friend && onNavigate('friend', friend)}
                    className="flex items-center gap-3 rounded-18 p-3.5 bg-white text-left w-full hover:bg-sand transition-colors"
                    style={{ boxShadow: '0 1px 8px rgba(48,34,56,.05)', border: soon ? '1.5px solid #EF7564' : '1.5px solid #EAE2D6' }}>
                    {/* Date box */}
                    <div className="w-12 rounded-12 flex flex-col items-center py-1.5 flex-shrink-0"
                      style={{ background: soon ? '#EF7564' : '#EAE2D6', height: 52 }}>
                      <p className="text-[10px] font-bold uppercase" style={{ color: soon ? '#302238' : '#8A7D90' }}>
                        {MONTH_SHORT[month - 1]}
                      </p>
                      <p className="font-display text-[22px] font-[800] leading-none" style={{ color: '#302238' }}>{day}</p>
                    </div>
                    {/* Avatar */}
                    {ev.avatar ? (
                      <img src={ev.avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-lilac flex items-center justify-center flex-shrink-0">
                        <Gift size={16} className="text-ink" />
                      </div>
                    )}
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-ink truncate">{ev.title}</p>
                      <p className="text-[12px] text-ink-muted">{dateLabel(ev.date)}</p>
                    </div>
                    {/* Days left */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      {daysLeft === 0
                        ? <span className="text-[13px] font-bold text-coral">¡Hoy!</span>
                        : daysLeft <= 7
                          ? <span className="text-[12px] font-bold text-coral">en {daysLeft}d</span>
                          : <span className="text-[12px] text-ink-muted">en {daysLeft}d</span>
                      }
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {allEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <CalendarIcon size={40} className="text-ink-muted" />
            <p className="text-[15px] text-ink-muted text-center">Aún no hay eventos en tu calendario</p>
          </div>
        )}
      </div>
    </div>
  );
}
