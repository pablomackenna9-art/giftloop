import { useState, useEffect, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Eye, EyeOff, Gift } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { BottomNav, SidebarNav } from './components/Navigation';
import type { NavTab } from './components/Navigation';
import { HomeScreen } from './screens/HomeScreen';
import { FriendScreen } from './screens/FriendScreen';
import { WishScreen } from './screens/WishScreen';
import { GroupScreen } from './screens/GroupScreen';
import { AddScreen } from './screens/AddScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import type { CalendarEvent } from './screens/CalendarScreen';
import { ChristmasScreen } from './screens/ChristmasScreen';
import { ChristmasSetupScreen } from './screens/ChristmasSetupScreen';
import { ChristmasChildScreen } from './screens/ChristmasChildScreen';
import { ChristmasAdultScreen } from './screens/ChristmasAdultScreen';
import type { ChildProfile } from './screens/xmas-data';
import type { Friend, Wish, FollowStatus, ChatMessage } from './components/data';

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
function simpleHash(s: string): string {
  let h = 0;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return String(Math.abs(h));
}

export type AppUser = {
  id: string; name: string; username: string;
  email: string; passwordHash: string;
  avatar: string; bio: string;
};

function mapSupabaseUser(
  user: SupabaseUser,
  profile?: { name?: string; username?: string; avatar?: string; bio?: string } | null
): AppUser {
  const email = user.email ?? '';
  const meta = user.user_metadata ?? {};
  const name = profile?.name ?? String(meta['name'] ?? email.split('@')[0]);
  const username = profile?.username ?? String(meta['username'] ?? email.split('@')[0].toLowerCase().replace(/\s/g, '_'));
  const avatar = profile?.avatar
    ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=EF7564&textColor=302238`;
  return { id: user.id, name, username, email, passwordHash: '', bio: profile?.bio ?? '', avatar };
}

function getStoredUsers(): AppUser[] {
  try { return JSON.parse(localStorage.getItem('gl_users') ?? '[]'); } catch { return []; }
}
function saveStoredUsers(u: AppUser[]) { localStorage.setItem('gl_users', JSON.stringify(u)); }
function getStoredCurrent(): AppUser | null {
  try { return JSON.parse(localStorage.getItem('gl_current') ?? 'null'); } catch { return null; }
}
function setStoredCurrent(u: AppUser | null) {
  if (u) localStorage.setItem('gl_current', JSON.stringify(u));
  else localStorage.removeItem('gl_current');
}
const CACHE_KEY = 'gl_user_cache';
function getCachedUser(): AppUser | null {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null'); } catch { return null; }
}
function setCachedUser(u: AppUser | null) {
  if (u) localStorage.setItem(CACHE_KEY, JSON.stringify(u));
  else localStorage.removeItem(CACHE_KEY);
}

// ─── ERROR BOUNDARY ──────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('GiftLoop error:', error, info.componentStack); }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 bg-danger-bg rounded-20 flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="font-display text-[22px] font-[800] text-ink mb-2">Algo salió mal</h2>
          <p className="text-[14px] text-ink-muted mb-5 max-w-xs">{(this.state.error as Error).message}</p>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="bg-ink text-cream px-6 py-3 rounded-18 font-bold text-[15px]">
            Recargar app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (u: AppUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        if (mode === 'login') {
          const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
          if (err) {
            const users = getStoredUsers();
            const found = users.find(u => u.email === email && u.passwordHash === simpleHash(password));
            if (!found) { setError('Email o contraseña incorrectos.'); return; }
            onAuth(found); return;
          }
          if (data.user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            onAuth(mapSupabaseUser(data.user, profile));
          }
        } else {
          const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=EF7564&textColor=302238`;
          const { data, error: err } = await supabase.auth.signUp({ email, password });
          if (err) {
            const users = getStoredUsers();
            if (users.find(u => u.email === email)) { setError('Ya existe una cuenta con ese email.'); return; }
            const newUser: AppUser = { id: String(Date.now()), name: name.trim(), username: username.toLowerCase(), email, passwordHash: simpleHash(password), avatar: avatarUrl, bio: '' };
            saveStoredUsers([...users, newUser]); onAuth(newUser); return;
          }
          if (data.user) {
            await supabase.from('profiles').insert({ id: data.user.id, name: name.trim(), username: username.toLowerCase(), avatar: avatarUrl, bio: '' });
            onAuth(mapSupabaseUser(data.user, { name: name.trim(), username: username.toLowerCase(), avatar: avatarUrl, bio: '' }));
          }
        }
        return;
      }
      if (mode === 'login') {
        const found = getStoredUsers().find(u => u.email === email && u.passwordHash === simpleHash(password));
        if (!found) { setError('Email o contraseña incorrectos.'); return; }
        setStoredCurrent(found); onAuth(found);
      } else {
        const users = getStoredUsers();
        if (users.find(u => u.email === email)) { setError('Ya existe una cuenta con ese email.'); return; }
        if (users.find(u => u.username === username.toLowerCase())) { setError('Ese usuario ya existe.'); return; }
        const newUser: AppUser = {
          id: String(Date.now()), name: name.trim(), username: username.toLowerCase(),
          email, passwordHash: simpleHash(password),
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=EF7564&textColor=302238`,
          bio: '',
        };
        saveStoredUsers([...users, newUser]); setStoredCurrent(newUser); onAuth(newUser);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido.');
    } finally { setLoading(false); }
  };

  const inp = "w-full h-[50px] rounded-14 px-4 text-[14px] text-ink outline-none bg-sand";
  const inpStyle = { border: '1.5px solid #D9CFC2' };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-coral rounded-[28px] flex items-center justify-center mx-auto mb-4"
            style={{ boxShadow: '0 10px 24px -10px rgba(239,117,100,.8)' }}>
            <Gift size={36} className="text-ink" />
          </div>
          <h1 className="font-display text-[32px] font-[800] tracking-[-0.02em] text-ink">GiftLoop</h1>
          <p className="text-[15px] text-ink-muted mt-1">Tu wishlist social</p>
        </div>

        <div className="grid grid-cols-2 p-1 rounded-16 mb-6" style={{ background: '#EFE8DE' }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              className={`h-10 rounded-12 text-[14px] font-bold transition ${mode === m ? 'bg-white text-ink' : 'text-ink-muted'}`}
              style={mode === m ? { boxShadow: '0 1px 4px rgba(48,34,56,.12)' } : {}}>
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" className={inp} style={inpStyle} />
              <input value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, '_').toLowerCase())}
                placeholder="@usuario" className={inp} style={inpStyle} />
            </>
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Correo electrónico" className={inp} style={inpStyle} />
          <div className="relative">
            <input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? 'text' : 'password'}
              placeholder="Contraseña" className={`${inp} pr-12`} style={inpStyle} />
            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div className="rounded-14 px-4 py-2.5 bg-danger-bg">
              <p className="text-[13px] text-danger-text text-center">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-14 rounded-18 bg-ink text-cream text-[17px] font-bold flex items-center justify-center gap-2 mt-1"
            style={{ opacity: loading ? 0.7 : 1 }}>
            {loading && <div className="w-5 h-5 rounded-full border-2 border-cream border-t-transparent animate-spin" />}
            {loading
              ? (mode === 'login' ? 'Ingresando…' : 'Creando cuenta…')
              : (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta')}
          </button>
        </form>

        <p className="text-[12px] text-ink-muted mt-8 text-center">
          Al continuar aceptas los Términos de servicio y Política de privacidad de GiftLoop
        </p>
      </div>
    </div>
  );
}

// ─── RIGHT PANEL (desktop only) ──────────────────────────────────────────────
import { FRIENDS_LIST } from './components/data';

function RightPanel({ currentUser, onNavigate }: { currentUser: AppUser; onNavigate: (s: string, d?: unknown) => void }) {
  const upcoming = FRIENDS_LIST.filter(f => f.daysUntil <= 60).slice(0, 4);
  return (
    <aside className="hidden lg:flex flex-col gap-4 w-[260px] flex-shrink-0 sticky top-8 h-fit">
      {/* Tus regalos en curso */}
      <div className="bg-white rounded-20 p-4 border border-line">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-bold text-ink">Tus regalos en curso</p>
          <button className="text-[12px] text-coral font-semibold">Solo tú los ves</button>
        </div>
        {[
          { name: 'Audífonos · Sofía', sub: 'Reservado · falta comprar', btn: 'Ver reserva', screen: 'wish', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=40&h=40&fit=crop' },
          { name: 'Bicicleta · Sofía', sub: 'Organiza · cierra el martes', btn: 'Ver grupo', screen: 'group', img: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=40&h=40&fit=crop' },
        ].map(g => (
          <button key={g.name} onClick={() => onNavigate(g.screen)}
            className="flex items-center gap-2.5 py-2.5 border-t border-line w-full text-left hover:bg-sand -mx-1 px-1 rounded-10 transition-colors">
            <img src={g.img} alt="" className="w-9 h-9 rounded-10 object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-ink truncate">{g.name}</p>
              <p className="text-[11px] text-ink-muted truncate">{g.sub}</p>
            </div>
            <span className="text-[11px] font-bold text-coral flex-shrink-0">{g.btn}</span>
          </button>
        ))}
      </div>

      {/* Se vienen */}
      <div className="bg-white rounded-20 p-4 border border-line">
        <p className="text-[13px] font-bold text-ink mb-3">Se vienen</p>
        <div className="flex flex-col gap-2">
          {upcoming.map(f => {
            const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
            const d = new Date(); d.setDate(d.getDate() + f.daysUntil);
            const mon = months[d.getMonth()]; const day = d.getDate();
            return (
              <button key={f.id} onClick={() => onNavigate('friend', f)} className="flex items-center gap-2.5 hover:bg-sand -mx-1 px-1 rounded-10 py-1 transition-colors">
                <div className="w-9 h-9 rounded-10 bg-sand flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-coral leading-none">{mon}</span>
                  <span className="text-[14px] font-bold text-ink leading-none">{day}</span>
                </div>
                <img src={f.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-ink truncate">{f.name.split(' ')[0]}</p>
                </div>
                <p className="text-[11px] text-ink-muted flex-shrink-0">en {f.daysUntil} días</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ideas para tu lista */}
      <div className="bg-white rounded-20 p-4 border border-line">
        <p className="text-[13px] font-bold text-ink mb-3">Ideas para tu lista</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Zapatillas running', price: '$64.990', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=80&fit=crop' },
            { name: 'Pack de novelas', price: '$32.990', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=100&h=80&fit=crop' },
          ].map(i => (
            <div key={i.name} className="rounded-14 overflow-hidden bg-sand">
              <img src={i.img} alt="" className="w-full h-[60px] object-cover" />
              <div className="p-2">
                <p className="text-[11px] font-semibold text-ink leading-tight">{i.name}</p>
                <p className="text-[11px] font-bold text-coral">{i.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saldo */}
      <div className="bg-white rounded-20 p-4 border border-line flex items-center justify-between">
        <div>
          <p className="text-[11px] text-ink-muted font-medium">Saldo recibido</p>
          <p className="text-[18px] font-bold text-ink">$42.500</p>
        </div>
        <button className="h-9 px-4 rounded-12 text-[13px] font-bold text-cream"
          style={{ background: '#302238' }}>Revisar</button>
      </div>
    </aside>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
type Screen = 'home' | 'explore' | 'activity' | 'profile' | 'friend' | 'wish' | 'group' | 'add' | 'add-exp' | 'messages' | 'friends' | 'chat' | 'calendar' | 'christmas' | 'xmas-setup' | 'xmas-child' | 'xmas-adult';
const NAV_TABS: NavTab[] = ['home', 'explore', 'activity', 'profile'];

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [screenData, setScreenData] = useState<Friend | Wish | unknown>(null);

  // Notification badges — cleared when user visits the screen
  const [activityBadge, setActivityBadge] = useState(4);
  const [messagesBadge, setMessagesBadge] = useState(2);

  // Calendar events added from activity invitations
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const addCalendarEvent = (ev: CalendarEvent) => {
    setCalendarEvents(prev => prev.find(e => e.id === ev.id) ? prev : [...prev, ev]);
  };

  // Friend follow state: userId → 'none' | 'pending' | 'friends'
  const [followStatus, setFollowStatus] = useState<Record<string, FollowStatus>>({
    'camila': 'friends',
  });

  // Conversations: userId → ChatMessage[] (keys match MESSAGES[].id)
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({
    'camila': [
      { id: '1', text: '¡Hola! Vi que te gustó mi lista 🎁', mine: false, time: '10:32' },
      { id: '2', text: 'Sí! Quería preguntarte por los aretes 😍', mine: true, time: '10:35' },
      { id: '3', text: 'Son de Awka, te paso el link', mine: false, time: '10:36' },
    ],
    'tomas': [
      { id: '1', text: '¿Qué vas a regalar a Camila?', mine: false, time: 'Mar' },
    ],
  });

  const [appUser, setAppUser] = useState<AppUser | null>(() => {
    const cached = getCachedUser();
    if (cached) return cached;
    if (!isSupabaseConfigured) return getStoredCurrent();
    return null;
  });

  const [authLoading, setAuthLoading] = useState(() =>
    isSupabaseConfigured && !getCachedUser()
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const applySession = async (supaUser: SupabaseUser | null) => {
      if (!supaUser) {
        const localUser = getStoredCurrent();
        if (localUser) { setCachedUser(localUser); setAppUser(localUser); setAuthLoading(false); return; }
        setCachedUser(null); setAppUser(null); setAuthLoading(false); return;
      }
      const cached = getCachedUser();
      if (cached && cached.id === supaUser.id) {
        setAppUser(cached); setAuthLoading(false);
        supabase!.from('profiles').select('*').eq('id', supaUser.id).single()
          .then(({ data: profile }) => { const fresh = mapSupabaseUser(supaUser, profile); setCachedUser(fresh); setAppUser(fresh); });
        return;
      }
      const { data: profile } = await supabase!.from('profiles').select('*').eq('id', supaUser.id).single();
      const user = mapSupabaseUser(supaUser, profile);
      setCachedUser(user); setAppUser(user); setAuthLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { setCachedUser(null); setAppUser(null); setAuthLoading(false); return; }
      if (session?.user) applySession(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const navigate = (s: string, data?: unknown) => {
    setScreenData(data ?? null);
    if (NAV_TABS.includes(s as NavTab)) {
      setActiveTab(s as NavTab);
      setScreen(s as Screen);
    } else {
      setScreen(s as Screen);
    }
    // Clear badges when visiting their screens
    if (s === 'activity') setActivityBadge(0);
    if (s === 'messages' || s === 'chat') setMessagesBadge(0);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    setScreen(activeTab);
    setScreenData(null);
    window.scrollTo(0, 0);
  };

  const handleAuth = (user: AppUser) => {
    setAppUser(user); setCachedUser(user);
    setStoredCurrent(user);
  };

  const handleLogout = async () => {
    setCachedUser(null);
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
    else setStoredCurrent(null);
    setAppUser(null); setScreen('home');
  };

  const handleFollow = (userId: string) => {
    setFollowStatus(prev => {
      const cur = prev[userId] ?? 'none';
      if (cur === 'none') return { ...prev, [userId]: 'pending' };
      if (cur === 'pending') return { ...prev, [userId]: 'none' }; // cancel request
      return { ...prev, [userId]: 'none' }; // unfollow
    });
  };

  const handleAcceptFollow = (userId: string) => {
    setFollowStatus(prev => ({ ...prev, [userId]: 'friends' }));
  };

  const handleRejectFollow = (userId: string) => {
    setFollowStatus(prev => ({ ...prev, [userId]: 'none' }));
  };

  const sendMessage = (toUserId: string, text: string) => {
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const msg: ChatMessage = { id: String(Date.now()), text, mine: true, time };
    setConversations(prev => ({
      ...prev,
      [toUserId]: [...(prev[toUserId] ?? []), msg],
    }));
  };

  const deleteMessage = (toUserId: string, msgId: string) => {
    setConversations(prev => ({
      ...prev,
      [toUserId]: (prev[toUserId] ?? []).filter(m => m.id !== msgId),
    }));
  };

  if (authLoading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-coral rounded-[22px] flex items-center justify-center"
          style={{ boxShadow: '0 10px 22px -8px rgba(239,117,100,.8)' }}>
          <Gift size={26} className="text-ink" />
        </div>
        <div className="w-[56px] h-[56px] rounded-full border-[5px] border-lilac"
          style={{ borderTopColor: '#302238', animation: 'spin .8s linear infinite' }} />
      </div>
    </div>
  );

  if (!appUser) return <AuthScreen onAuth={handleAuth} />;

  const currentUser = appUser;
  const showNav = NAV_TABS.includes(screen as NavTab);

  // Chat data for 'chat' screen
  const chatTarget = screenData as { userId: string; name: string; avatar: string } | null;

  const friendId = (screenData as Friend)?.id ?? 'camila';

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-cream">

        {/* ─── Desktop layout (≥1024px): always sidebar + content + right panel ── */}
        <div className="lg:flex lg:max-w-[1100px] lg:mx-auto lg:px-6 lg:gap-8 lg:py-8">

          {/* Sidebar — always visible on desktop */}
          <div className="hidden lg:block">
            <SidebarNav
              active={activeTab}
              onChange={(tab) => navigate(tab)}
              onNavigate={navigate}
              currentScreen={screen}
              activityBadge={activityBadge}
              messagesBadge={messagesBadge}
            />
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0 lg:max-w-[540px]">
            {screen === 'home' && <HomeScreen currentUser={currentUser} onNavigate={navigate} />}
            {screen === 'explore' && <ExploreScreen onNavigate={navigate} />}
            {screen === 'activity' && <ActivityScreen onNavigate={navigate} onAddCalendarEvent={addCalendarEvent} />}
            {screen === 'profile' && <ProfileScreen currentUser={currentUser} onNavigate={navigate} onLogout={handleLogout} />}
            {screen === 'friend' && (
              <FriendScreen
                friend={screenData as Friend | undefined}
                onBack={goBack}
                onNavigate={navigate}
                followStatus={followStatus[friendId] ?? 'friends'}
                onFollow={() => handleFollow(friendId)}
              />
            )}
            {screen === 'wish' && <WishScreen wish={screenData as Wish | undefined} onBack={goBack} onNavigate={navigate} />}
            {screen === 'group' && <GroupScreen onBack={goBack} onNavigate={navigate} />}
            {screen === 'add' && <AddScreen onBack={goBack} onNavigate={navigate} />}
            {screen === 'add-exp' && <AddScreen onBack={goBack} onNavigate={navigate} isExperience />}
            {screen === 'messages' && (
              <MessagesScreen onBack={goBack} onNavigate={navigate} conversations={conversations} />
            )}
            {screen === 'chat' && chatTarget && (
              <MessagesScreen
                onBack={goBack}
                onNavigate={navigate}
                conversations={conversations}
                openChatId={chatTarget.userId}
                openChatName={chatTarget.name}
                openChatAvatar={chatTarget.avatar}
                onSend={(text) => sendMessage(chatTarget.userId, text)}
                onDelete={(msgId) => deleteMessage(chatTarget.userId, msgId)}
              />
            )}
            {screen === 'friends' && (
              <FriendsScreen
                onBack={goBack}
                followStatus={followStatus}
                onFollow={handleFollow}
                onAccept={handleAcceptFollow}
                onReject={handleRejectFollow}
                onNavigate={navigate}
              />
            )}
            {screen === 'calendar' && (
              <CalendarScreen onBack={goBack} onNavigate={navigate} extraEvents={calendarEvents} />
            )}
            {screen === 'christmas' && (
              <ChristmasScreen onBack={goBack} onNavigate={navigate} />
            )}
            {screen === 'xmas-setup' && (
              <ChristmasSetupScreen
                existing={(screenData as ChildProfile) ?? null}
                onBack={goBack}
                onDone={(child) => navigate('xmas-child', child)}
              />
            )}
            {screen === 'xmas-child' && (screenData as ChildProfile)?.id && (
              <ChristmasChildScreen child={screenData as ChildProfile} onBack={() => navigate('christmas')} />
            )}
            {screen === 'xmas-adult' && (screenData as ChildProfile)?.id && (
              <ChristmasAdultScreen child={screenData as ChildProfile} onBack={() => navigate('christmas')} />
            )}
          </main>

          {/* Right panel — desktop only */}
          <RightPanel currentUser={currentUser} onNavigate={navigate} />
        </div>

        {/* Bottom nav — mobile only, tab screens only */}
        {showNav && (
          <BottomNav active={activeTab} onChange={(tab) => navigate(tab)} onNavigate={navigate} activityBadge={activityBadge} messagesBadge={messagesBadge} />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
