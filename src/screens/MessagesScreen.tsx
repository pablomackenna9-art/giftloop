import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Trash2 } from 'lucide-react';
import { MESSAGES } from '../components/data';
import type { ChatMessage } from '../App';

type Props = {
  onBack: () => void;
  onNavigate: (screen: string, data?: unknown) => void;
  conversations: Record<string, ChatMessage[]>;
  // Chat mode props
  openChatId?: string;
  openChatName?: string;
  openChatAvatar?: string;
  onSend?: (text: string) => void;
  onDelete?: (msgId: string) => void;
};

// ─── CONVERSATION LIST ────────────────────────────────────────────────────────
function ConversationList({
  onBack,
  onNavigate,
  conversations,
}: {
  onBack: () => void;
  onNavigate: (screen: string, data?: unknown) => void;
  conversations: Record<string, ChatMessage[]>;
}) {
  // Merge static messages with dynamic conversations
  const merged = MESSAGES.map(m => {
    const userId = m.id;
    const msgs = conversations[userId] ?? [];
    const last = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    return {
      ...m,
      last: last ? last.text : m.last,
      time: last ? last.time : m.time,
      unread: last && last.mine ? 0 : m.unread,
    };
  });

  return (
    <div className="min-h-screen bg-cream">
      <div className="flex items-center gap-3 px-5 py-4 sticky top-0 bg-cream z-10" style={{ borderBottom: '1px solid #EAE2D6' }}>
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center">
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <h1 className="font-display text-[22px] font-[800] text-ink">Mensajes</h1>
      </div>
      <div className="flex flex-col divide-y divide-line px-5">
        {merged.map(m => (
          <button
            key={m.id}
            onClick={() => {
              if (m.isGroup) {
                onNavigate('group');
              } else {
                onNavigate('chat', { userId: m.id, name: m.name, avatar: m.avatar });
              }
            }}
            className="flex items-center gap-3 py-4 text-left w-full hover:bg-sand/40 -mx-5 px-5 transition-colors">
            <div className="relative flex-shrink-0">
              {m.isGroup ? (
                <img src={m.image} alt="" className="w-[52px] h-[52px] rounded-14 object-cover" />
              ) : (
                <img src={m.avatar} alt="" className="w-[52px] h-[52px] rounded-full object-cover" />
              )}
              {m.unread > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-coral flex items-center justify-center">
                  <span className="text-[11px] font-bold text-ink">{m.unread}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-0.5">
                <p className={`text-[15px] truncate ${m.unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>{m.name}</p>
                <p className="text-[12px] text-ink-muted flex-shrink-0 ml-2">{m.time}</p>
              </div>
              <p className={`text-[13px] truncate ${m.unread > 0 ? 'text-ink' : 'text-ink-muted'}`}>{m.last}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CHAT THREAD ─────────────────────────────────────────────────────────────
function ChatThread({
  userId,
  name,
  avatar,
  messages,
  onBack,
  onSend,
  onDelete,
}: {
  userId: string;
  name: string;
  avatar: string;
  messages: ChatMessage[];
  onBack: () => void;
  onSend: (text: string) => void;
  onDelete: (msgId: string) => void;
}) {
  const [text, setText] = useState('');
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-screen bg-cream">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0 bg-cream"
        style={{ borderBottom: '1px solid #EAE2D6' }}>
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center">
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[15px] font-bold text-ink">{name}</p>
          <p className="text-[12px] text-ink-muted">En línea ahora</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
            <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
            <p className="text-[15px] font-bold text-ink">{name}</p>
            <p className="text-[13px] text-ink-muted">Empieza la conversación con {name.split(' ')[0]} 👋</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}
            onClick={() => setSelectedMsg(selectedMsg === msg.id ? null : msg.id)}>
            <div className="max-w-[75%]">
              <div
                className={`px-4 py-2.5 rounded-[18px] text-[14px] leading-snug cursor-pointer select-none ${
                  msg.mine
                    ? 'bg-ink text-cream rounded-br-[4px]'
                    : 'bg-white text-ink rounded-bl-[4px]'
                }`}
                style={msg.mine ? {} : { border: '1px solid #EAE2D6' }}>
                {msg.text}
              </div>
              <div className={`flex items-center gap-1.5 mt-1 ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                <span className="text-[11px] text-ink-muted">{msg.time}</span>
                {selectedMsg === msg.id && msg.mine && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(msg.id); setSelectedMsg(null); }}
                    className="flex items-center gap-0.5 text-[11px] text-danger-text bg-danger-bg rounded-8 px-2 py-0.5">
                    <Trash2 size={10} />
                    Borrar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 bg-cream" style={{ borderTop: '1px solid #EAE2D6' }}>
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white rounded-20 px-4 py-3" style={{ border: '1.5px solid #E2D8CB', minHeight: 44 }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Mensaje para ${name.split(' ')[0]}…`}
              rows={1}
              className="w-full text-[14px] text-ink outline-none bg-transparent resize-none leading-snug"
              style={{ maxHeight: 120 }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: text.trim() ? '#302238' : '#EAE2D6',
              opacity: text.trim() ? 1 : 0.7,
            }}>
            <Send size={18} className="text-cream" />
          </button>
        </div>
        <p className="text-[11px] text-ink-muted text-center mt-2">Toca un mensaje tuyo para borrarlo</p>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export function MessagesScreen({
  onBack,
  onNavigate,
  conversations,
  openChatId,
  openChatName,
  openChatAvatar,
  onSend,
  onDelete,
}: Props) {
  if (openChatId && openChatName && openChatAvatar && onSend && onDelete) {
    return (
      <ChatThread
        userId={openChatId}
        name={openChatName}
        avatar={openChatAvatar}
        messages={conversations[openChatId] ?? []}
        onBack={onBack}
        onSend={onSend}
        onDelete={onDelete}
      />
    );
  }

  return (
    <ConversationList
      onBack={onBack}
      onNavigate={onNavigate}
      conversations={conversations}
    />
  );
}
