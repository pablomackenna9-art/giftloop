import { useState } from 'react';
import { SectionLabel, Toast } from '../components/base';
import { ACTIVITY_PAYMENTS } from '../components/data';
import type { CalendarEvent } from './CalendarScreen';

type Props = {
  onNavigate: (screen: string, data?: unknown) => void;
  onAddCalendarEvent?: (ev: CalendarEvent) => void;
};

export function ActivityScreen({ onNavigate, onAddCalendarEvent }: Props) {
  const [eventAccepted, setEventAccepted] = useState<boolean | null>(null);
  const [groupAccepted, setGroupAccepted] = useState<boolean | null>(null);
  const [toast, setToast] = useState('');
  const [reserved, setReserved] = useState(false);

  return (
    <div className="flex flex-col pb-[120px]" style={{ gap: 24, padding: '8px 20px 120px' }}>
      <h1 className="font-display text-[30px] font-[800] tracking-[-0.02em] text-ink">Actividad</h1>

      {/* Invitations */}
      <div className="flex flex-col gap-3">
        <SectionLabel>INVITACIONES</SectionLabel>

        {/* Group invite */}
        {groupAccepted === null && (
          <div className="rounded-22 p-4 bg-coral">
            <div className="flex items-start gap-3 mb-3">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=44&h=44&fit=crop&auto=format" alt=""
                className="w-11 h-11 rounded-full object-cover border-2 border-cream flex-shrink-0" />
              <p className="text-[14px] text-ink">
                <strong>Tomás</strong> te invitó al regalo grupal para <strong>Camila</strong>: audífonos, 60% reunido.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {
                  setGroupAccepted(true);
                  setToast('¡Participas en el regalo de Camila! 🎁');
                  onNavigate('group');
                }}
                className="flex-1 h-12 rounded-18 bg-ink text-cream text-[15px] font-bold">
                Participar
              </button>
              <button onClick={() => {
                  setGroupAccepted(false);
                  setToast('Declinaste la invitación.');
                }}
                className="h-12 px-4 rounded-18 text-ink text-[14px] font-semibold"
                style={{ background: 'rgba(255,255,255,.5)' }}>
                No, gracias
              </button>
            </div>
          </div>
        )}
        {groupAccepted === true && (
          <div className="rounded-22 p-4 bg-white" style={{ boxShadow: '0 2px 14px rgba(48,34,56,.06)', border: '1.5px solid #E2D8CB' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E3ECE5' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-ink">Regalo grupal de Camila</p>
                <p className="text-[13px] text-ink-muted">Participas · audífonos · 60% reunido</p>
              </div>
              <button onClick={() => onNavigate('group')}
                className="h-9 px-3 rounded-12 text-[13px] font-bold text-cream flex-shrink-0"
                style={{ background: '#302238' }}>
                Ver grupo
              </button>
            </div>
          </div>
        )}
        {groupAccepted === false && (
          <div className="rounded-22 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
            <p className="text-[13px] text-ink-muted">Declinaste la invitación al regalo grupal de Camila.</p>
          </div>
        )}

        {/* Event invite */}
        {eventAccepted === null && (
          <div className="rounded-22 p-4 bg-white" style={{ boxShadow: '0 2px 14px rgba(48,34,56,.06)' }}>
            <p className="text-[14px] text-ink mb-3">
              <strong>Joaquín</strong> te invitó a la once de cumpleaños de <strong>Javiera</strong>, sáb 7 nov.
            </p>
            <div className="flex gap-2">
              <button onClick={() => {
                  setEventAccepted(true);
                  setToast('¡Vas a la once de Javiera! Se agregó al calendario 🎉');
                  onAddCalendarEvent?.({
                    id: 'once_javiera',
                    title: 'Once de Javiera',
                    subtitle: 'Invitado por Joaquín',
                    date: '11-07',
                    type: 'event',
                  });
                }}
                className="flex-1 h-11 rounded-16 bg-ink text-cream text-[14px] font-bold">
                Voy
              </button>
              <button onClick={() => setEventAccepted(false)}
                className="flex-1 h-11 rounded-16 border border-ink text-ink text-[14px] font-semibold">
                Ahora no
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reminders */}
      <div className="flex flex-col gap-3">
        <SectionLabel>RECORDATORIOS</SectionLabel>

        <button onClick={() => onNavigate('friend')}
          className="rounded-18 p-3.5 bg-lilac flex items-center gap-3 text-left w-full">
          <div className="flex-shrink-0 w-12 rounded-12 flex flex-col items-center py-1.5 bg-cream" style={{ height: 52 }}>
            <p className="text-[11px] font-bold text-coral-text uppercase">OCT</p>
            <p className="font-display text-[20px] font-[800] text-ink leading-none">22</p>
          </div>
          <p className="text-[14px] text-ink">
            Cumple de <strong>Camila</strong> en 6 días.{' '}
            {reserved
              ? 'Ya tienes regalo reservado.'
              : 'Aún no eliges regalo.'}
          </p>
        </button>

        {reserved && (
          <div className="rounded-18 p-3.5 border border-line flex items-center gap-3">
            <div className="w-12 h-12 rounded-12 bg-green-bg flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#557A65" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-[14px] text-ink">Tu reserva de <strong>Zapatillas urbanas</strong> vence el jue 22. ¿Ya lo compraste?</p>
          </div>
        )}
      </div>

      {/* Payments */}
      <div className="flex flex-col gap-3">
        <SectionLabel>PAGOS · DEMOSTRACIÓN</SectionLabel>
        {ACTIVITY_PAYMENTS.map(p => {
          const styles = {
            ok: { bg: '#E3ECE5', text: '#2F4B3B', label: 'Exitoso' },
            pending: { bg: '#EAE2F4', text: '#302238', label: 'Pendiente' },
            fail: { bg: '#FBE3DF', text: '#8E3427', label: 'Fallido' },
          }[p.status];
          return (
            <div key={p.id} className="flex items-center gap-3 rounded-18 p-3.5 border border-line bg-white">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.status === 'ok' ? '#557A65' : p.status === 'pending' ? '#C9BCD6' : '#EF7564' }} />
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-ink">{p.title}</p>
                <p className="text-[13px] text-ink-muted">{p.subtitle}</p>
              </div>
              <span className="px-2.5 py-1 rounded-10 text-[12px] font-bold" style={{ background: styles.bg, color: styles.text }}>
                {styles.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* News */}
      <div className="flex flex-col gap-3">
        <SectionLabel>NOVEDADES</SectionLabel>
        <div className="flex items-center gap-3 rounded-18 p-3.5 bg-white border border-line">
          <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=44&h=44&fit=crop&auto=format" alt=""
            className="w-11 h-11 rounded-full object-cover" />
          <p className="text-[14px] text-ink flex-1">Fernanda agregó gustos nuevos: cerámica, jazz</p>
        </div>
        <div className="flex items-center gap-3 rounded-18 p-3.5 bg-white border border-line">
          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=44&h=44&fit=crop&auto=format" alt=""
            className="w-11 h-11 rounded-full object-cover" />
          <div className="flex-1">
            <p className="text-[14px] text-ink"><strong>Matías</strong> empezó a seguirte</p>
          </div>
          <button className="h-9 px-4 rounded-12 bg-ink text-cream text-[13px] font-bold">Seguir</button>
        </div>
      </div>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
