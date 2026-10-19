import { usePurchaseRequests } from '../lib/use-purchase-requests';
import { useState } from 'react';
import { ChevronLeft, ShoppingBag, ExternalLink, AlertCircle, Check } from 'lucide-react';
import { loadWishes, XMAS_GREEN, XMAS_RED, XMAS_GOLD, XMAS_LIGHT, fmtCLP } from './xmas-data';
import type { ChildProfile, XmasWish } from './xmas-data';
import {
  loadStores, loadProducts, loadRequests, saveRequests,
  REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS,
} from './xmas-store-data';
import type { PurchaseRequest, RequestItem, RequestStatus } from './xmas-store-data';

type Props = {
  child: ChildProfile;
  onBack: () => void;
};

type Phase = 'select' | 'review' | 'requests' | 'proposal';

export function AdultPurchaseScreen({ child, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('select');
  const [wishes] = useState<XmasWish[]>(() => loadWishes(child.id));
  const [selected, setSelected] = useState<Set<string>>(new Set(
    wishes.filter(w => !w.isFree && w.adultStatus !== 'none').map(w => w.id)
  ));
  const [requests, setRequests] = usePurchaseRequests();
  const [proposalView, setProposalView] = useState<PurchaseRequest | null>(null);
  const [toast, setToast] = useState('');
  const [sending, setSending] = useState(false);

  const stores = loadStores();
  const products = loadProducts();
  const cartWishes = wishes.filter(w => !w.isFree);
  const freeWishes = wishes.filter(w => w.isFree);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Find store product for a wish
  const findProduct = (wish: XmasWish) => products.find(p => p.id === (wish.productId ?? wish.id) || p.name === wish.name);

  // Group selected wishes by store
  const groupByStore = () => {
    const groups: Record<string, { store: typeof stores[0]; items: Array<{ wish: XmasWish; product: typeof products[0] | undefined }> }> = {};
    selected.forEach(id => {
      const wish = wishes.find(w => w.id === id);
      if (!wish) return;
      const product = findProduct(wish);
      const storeId = product?.storeId ?? 'store-juguetemax'; // default for demo
      if (!groups[storeId]) {
        const store = stores.find(s => s.id === storeId) ?? stores[0];
        groups[storeId] = { store, items: [] };
      }
      groups[storeId].items.push({ wish, product });
    });
    return Object.entries(groups);
  };

  const toggleSelect = (wishId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(wishId) ? next.delete(wishId) : next.add(wishId);
      return next;
    });
  };

  const totalSelected = cartWishes
    .filter(w => selected.has(w.id))
    .reduce((acc, w) => acc + (w.price ?? 0), 0);

  const sendRequests = async () => {
    if (sending) return;
    setSending(true);
    try {
    const now = new Date().toISOString();
    const sendAt = now;
    const newReqs: PurchaseRequest[] = groupByStore().map(([storeId, group]) => {
      const items: RequestItem[] = group.items.map(({ wish }) => ({
        productId: wish.productId ?? wish.id,
        productName: wish.name,
        qty: 1,
        knownPrice: wish.price ?? 0,
        priceDate: new Date().toISOString().slice(0, 10),
        image: wish.image,
      }));
      return {
        id: crypto.randomUUID(),
        childId: child.id,
        childName: '',
        storeId,
        items,
        status: 'sent' as RequestStatus,
        createdAt: now,
        sentAt: sendAt,
        history: [
          { status: 'draft' as RequestStatus, by: 'adult' as const, at: now },
          { status: 'sent' as RequestStatus, by: 'adult' as const, at: now, note: 'Enviada por el adulto' },
        ],
      };
    });

    const all = [...requests, ...newReqs];
    await saveRequests(all); setRequests(all);
    setPhase('requests');
    showToast(`${newReqs.length} solicitudes enviadas ✓`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No pudimos enviar las solicitudes.');
    } finally { setSending(false); }
  };

  // ── PHASE: SELECT ──────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="min-h-screen pb-32" style={{ background: '#FAF7F2' }}>
        <div className="px-4 pt-5 pb-4" style={{ background: XMAS_GREEN }}>
          <button onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <ChevronLeft size={20} className="text-white" />
          </button>
          <p className="text-[12px] font-semibold text-white" style={{ opacity: .7 }}>Selección de compra</p>
          <h1 className="font-display text-[20px] font-[800] text-white">¿Qué vas a comprar?</h1>
          <p className="text-[13px] text-white mt-0.5" style={{ opacity: .8 }}>Marca los regalos que quieres solicitar a las tiendas</p>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="rounded-16 p-3 flex items-start gap-2" style={{ background: `${XMAS_GOLD}18`, border: `1px solid ${XMAS_GOLD}44` }}>
            <AlertCircle size={14} style={{ color: XMAS_GOLD }} className="flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-ink">La carta del niño nunca genera solicitudes automáticamente. Debes marcar y autorizar cada regalo antes de enviarlo a las tiendas.</p>
          </div>

          {cartWishes.length === 0 ? (
            <div className="rounded-18 p-6 text-center bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
              <p className="text-[14px] text-ink-muted">No hay regalos en la carta de {child.name} aún.</p>
            </div>
          ) : (
            <>
              <p className="text-[12px] font-bold text-ink-muted uppercase tracking-wider">Regalos en la carta</p>
              {cartWishes.map(wish => {
                const isSelected = selected.has(wish.id);
                const product = findProduct(wish);
                const store = stores.find(s => s.id === product?.storeId);
                return (
                  <button key={wish.id} onClick={() => toggleSelect(wish.id)}
                    className="rounded-18 p-3 bg-white flex items-center gap-3 w-full text-left transition-all"
                    style={{ border: `1.5px solid ${isSelected ? XMAS_GREEN : '#EAE2D6'}` }}>
                    <div className="w-6 h-6 rounded-6 flex items-center justify-center flex-shrink-0"
                      style={{ background: isSelected ? XMAS_GREEN : '#F0EBE5', border: `1.5px solid ${isSelected ? XMAS_GREEN : '#D9CFC2'}` }}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                    {wish.image && <img src={wish.image} alt="" className="w-12 h-12 rounded-12 object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ink truncate">
                        {wish.isFavorite && <span style={{ color: XMAS_GOLD }}>⭐ </span>}
                        {wish.name}
                      </p>
                      <p className="text-[11px] text-ink-muted">{store ? store.name : 'Tienda por asignar'}</p>
                      {wish.price && <p className="text-[12px] font-bold" style={{ color: XMAS_GREEN }}>{fmtCLP(wish.price)}</p>}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {freeWishes.length > 0 && (
            <div className="rounded-18 p-3 bg-white" style={{ border: '1.5px dashed #E2D8CB' }}>
              <p className="text-[12px] font-bold text-ink-muted mb-2">Deseos libres · requieren cotización</p>
              {freeWishes.map(w => (
                <div key={w.id} className="flex items-center gap-2 py-1.5">
                  <span className="text-[14px]">✏️</span>
                  <p className="text-[13px] text-ink">{w.name}</p>
                  <span className="ml-auto text-[11px] px-2 py-1 rounded-10" style={{ background: '#FBE3DF', color: XMAS_RED }}>Sin precio</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected.size > 0 && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] px-4 pb-6 pt-3"
            style={{ background: 'rgba(250,247,242,.96)', borderTop: '1px solid #EAE2D6' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-ink">{selected.size} regalos · {fmtCLP(totalSelected)} estimado</p>
              <p className="text-[12px] text-ink-muted">Tu presupuesto: {fmtCLP(child.adultBudget)}</p>
            </div>
            {totalSelected > child.adultBudget && (
              <p className="text-[12px] font-semibold mb-2" style={{ color: XMAS_RED }}>
                ⚠ Superas tu presupuesto por {fmtCLP(totalSelected - child.adultBudget)}
              </p>
            )}
            <button onClick={() => setPhase('review')}
              className="w-full h-13 rounded-18 text-[15px] font-bold text-white py-3"
              style={{ background: XMAS_RED }}>
              Revisar y enviar a tiendas →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── PHASE: REVIEW ──────────────────────────────────────────────────────────
  if (phase === 'review') {
    const groups = groupByStore();
    return (
      <div className="min-h-screen pb-32" style={{ background: '#FAF7F2' }}>
        <div className="px-4 pt-5 pb-4" style={{ background: XMAS_GREEN }}>
          <button onClick={() => setPhase('select')}
            className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <ChevronLeft size={20} className="text-white" />
          </button>
          <p className="text-[12px] font-semibold text-white" style={{ opacity: .7 }}>Revisión antes de enviar</p>
          <h1 className="font-display text-[20px] font-[800] text-white">Solicitudes por tienda</h1>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="rounded-16 p-3 flex items-start gap-2" style={{ background: `${XMAS_GREEN}12`, border: `1px solid ${XMAS_GREEN}33` }}>
            <AlertCircle size={14} style={{ color: XMAS_GREEN }} className="flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-ink">Cada tienda confirmará disponibilidad, precio final y entrega. Recibirás una propuesta y un enlace de pago por tienda. Vendido, cobrado y despachado por cada tienda.</p>
          </div>

          {groups.map(([storeId, group]) => {
            const subtotal = group.items.reduce((acc, { wish }) => acc + (wish.price ?? 0), 0);
            return (
              <div key={storeId} className="rounded-20 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[20px]">{group.store.logoEmoji}</span>
                  <div>
                    <h3 className="font-display text-[16px] font-[800] text-ink">{group.store.name}</h3>
                    <p className="text-[11px] text-ink-muted">Responde en {group.store.responseTime}</p>
                  </div>
                </div>
                {group.items.map(({ wish }) => (
                  <div key={wish.id} className="flex items-center gap-2 py-1.5 border-b border-line last:border-0">
                    {wish.image && <img src={wish.image} alt="" className="w-9 h-9 rounded-10 object-cover flex-shrink-0" />}
                    <p className="text-[12px] font-semibold text-ink flex-1 truncate">{wish.name}</p>
                    <p className="text-[12px] font-bold text-ink-muted flex-shrink-0">{fmtCLP(wish.price ?? 0)}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-line">
                  <p className="text-[13px] font-bold text-ink">Subtotal estimado</p>
                  <p className="text-[13px] font-bold text-ink">{fmtCLP(subtotal)}</p>
                </div>
                <p className="text-[11px] text-ink-muted mt-1">Envío: por confirmar · {group.store.deliveryConditions}</p>
              </div>
            );
          })}

          <div className="rounded-18 p-3" style={{ background: XMAS_LIGHT, border: '1.5px solid #EAE2D6' }}>
            <p className="text-[12px] font-bold text-ink-muted mb-2">Datos que recibirá cada tienda</p>
            {['Regalos solicitados (SKU y cantidad)', 'Dirección de despacho (al confirmar pago)', 'Tu nombre y contacto para la solicitud'].map(d => (
              <div key={d} className="flex items-center gap-2 py-1">
                <Check size={12} style={{ color: XMAS_GREEN }} />
                <p className="text-[12px] text-ink">{d}</p>
              </div>
            ))}
            <p className="text-[11px] text-ink-muted mt-2">
              No compartimos el nombre del niño, su edad, intereses ni su carta completa.
            </p>
          </div>

          <p className="text-[12px] font-semibold text-ink-muted text-center">
            Puedes editar o cancelar hasta el envío (hoy ~20:00 hrs)
          </p>
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] px-4 pb-6 pt-3"
          style={{ background: 'rgba(250,247,242,.96)', borderTop: '1px solid #EAE2D6' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-ink">{groups.length} tiendas · {selected.size} regalos</p>
            <p className="text-[14px] font-bold text-ink">{fmtCLP(totalSelected)}</p>
          </div>
          <button disabled={sending} onClick={sendRequests}
            className="w-full h-13 rounded-18 text-[15px] font-bold text-white py-3 flex items-center justify-center gap-2"
            style={{ background: XMAS_RED }}>
            <ShoppingBag size={18} /> Enviar solicitudes a las tiendas
          </button>
        </div>
      </div>
    );
  }

  // ── PHASE: REQUESTS (track) ────────────────────────────────────────────────
  const myRequests = requests.filter(r => r.childId === child.id).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (phase === 'proposal' && proposalView) {
    const p = proposalView.proposal!;
    const budgetExceeded = p.total > child.adultBudget;
    return (
      <div className="min-h-screen pb-8" style={{ background: '#FAF7F2' }}>
        <div className="px-4 pt-5 pb-4" style={{ background: XMAS_GREEN }}>
          <button onClick={() => { setPhase('requests'); setProposalView(null); }}
            className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <ChevronLeft size={20} className="text-white" />
          </button>
          <p className="text-[12px] font-semibold text-white" style={{ opacity: .7 }}>Propuesta de tienda</p>
          <h1 className="font-display text-[20px] font-[800] text-white">
            {stores.find(s => s.id === proposalView.storeId)?.name}
          </h1>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {budgetExceeded && (
            <div className="rounded-14 p-3 flex items-start gap-2" style={{ background: '#FBE3DF', border: `1px solid ${XMAS_RED}33` }}>
              <AlertCircle size={14} style={{ color: XMAS_RED }} className="flex-shrink-0 mt-0.5" />
              <p className="text-[12px] font-semibold" style={{ color: XMAS_RED }}>
                Esta propuesta supera tu presupuesto por {fmtCLP(p.total - child.adultBudget)}. Revisa antes de aceptar.
              </p>
            </div>
          )}

          {p.confirmedItems.length > 0 && (
            <div className="rounded-18 p-3 bg-white" style={{ border: `1.5px solid ${XMAS_GREEN}44` }}>
              <p className="text-[11px] font-bold mb-2" style={{ color: XMAS_GREEN }}>✓ Disponibles</p>
              {p.confirmedItems.map(item => (
                <div key={item.productId} className="flex items-center gap-2 py-1.5 border-b border-line last:border-0">
                  <p className="text-[12px] font-semibold text-ink flex-1">{item.productName}</p>
                  <p className="text-[12px] font-bold text-ink">{fmtCLP(item.unitPrice * item.qty)}</p>
                </div>
              ))}
            </div>
          )}

          {p.rejectedItems.length > 0 && (
            <div className="rounded-18 p-3 bg-white" style={{ border: `1.5px solid ${XMAS_RED}44` }}>
              <p className="text-[11px] font-bold mb-2" style={{ color: XMAS_RED }}>✗ No disponibles</p>
              {p.rejectedItems.map(item => (
                <div key={item.productId} className="flex items-center gap-2 py-1.5 border-b border-line last:border-0">
                  <p className="text-[12px] font-semibold text-ink flex-1">{item.productName}</p>
                  <p className="text-[11px] text-ink-muted">{item.unavailableReason}</p>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-18 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
            {[
              { label: 'Subtotal', val: fmtCLP(p.subtotal) },
              { label: 'Envío', val: p.shipping === 0 ? 'Gratis' : fmtCLP(p.shipping) },
              { label: 'Total final', val: fmtCLP(p.total), bold: true },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-2 border-b border-line last:border-0">
                <p className={`text-[${row.bold ? '14' : '13'}px] ${row.bold ? 'font-bold' : 'font-medium'} text-ink`}>{row.label}</p>
                <p className={`text-[${row.bold ? '14' : '13'}px] font-bold`} style={{ color: row.bold ? XMAS_GREEN : '#302238' }}>{row.val}</p>
              </div>
            ))}
          </div>

          <div className="rounded-18 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
            <p className="text-[12px] font-bold text-ink-muted mb-2">Condiciones de entrega</p>
            <p className="text-[13px] text-ink mb-1">📦 Entrega estimada: <strong>{p.deliveryRange}</strong></p>
            <p className="text-[13px] text-ink mb-1">⏰ Paga antes del {p.paymentDeadline} para cumplir ese plazo</p>
            <p className="text-[12px] text-ink-muted">Propuesta válida hasta: {new Date(p.proposalExpiry).toLocaleDateString('es-CL')}</p>
            <p className="text-[12px] text-ink-muted mt-1">Respondida por: {p.respondedBy}</p>
          </div>

          <div className="rounded-18 p-3 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
            <p className="text-[11px] text-ink-muted">
              Vendido, cobrado y despachado por {stores.find(s => s.id === proposalView.storeId)?.name}. {stores.find(s => s.id === proposalView.storeId)?.returnsPolicy}
            </p>
          </div>

          <button
            onClick={() => {
              const updated = requests.map(r => r.id === proposalView.id
                ? { ...r, status: 'pending_payment' as RequestStatus, history: [...r.history, { status: 'pending_payment' as RequestStatus, by: 'adult' as const, at: new Date().toISOString() }] }
                : r);
              let paymentUrl: URL;
              try {
                paymentUrl = new URL(p.paymentLink);
                if (!['https:', 'http:'].includes(paymentUrl.protocol)) throw new Error();
              } catch { showToast('La tienda debe corregir el enlace de pago.'); return; }
              const paymentWindow = window.open('about:blank', '_blank');
              if (paymentWindow) paymentWindow.opener = null;
              void saveRequests(updated).then(() => {
                setRequests(updated);
                if (paymentWindow) paymentWindow.location.href = paymentUrl.href;
                else showToast('Permite las ventanas emergentes y vuelve a abrir el pago.');
                setPhase('requests'); setProposalView(null);
              }).catch(() => { paymentWindow?.close(); showToast('No pudimos guardar la solicitud. Intenta nuevamente.'); });
            }}
            className="h-13 py-3 rounded-18 text-[15px] font-bold text-white flex items-center justify-center gap-2"
            style={{ background: XMAS_RED }}>
            <ExternalLink size={18} /> Aceptar y pagar en {stores.find(s => s.id === proposalView.storeId)?.name}
          </button>
          <p className="text-[11px] text-ink-muted text-center">Abrir el enlace no confirma la compra. El pago lo verifica la tienda.</p>

          <button onClick={() => { setPhase('requests'); setProposalView(null); }}
            className="h-11 rounded-14 border-[1.5px] border-line text-[13px] font-semibold text-ink bg-white">
            Volver a mis solicitudes
          </button>
        </div>
      </div>
    );
  }

  // Requests list
  return (
    <div className="min-h-screen pb-8" style={{ background: '#FAF7F2' }}>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-20 shadow-lg"
          style={{ background: '#302238', color: 'white', fontSize: 14 }}>
          {toast}
        </div>
      )}
      <div className="px-4 pt-5 pb-4" style={{ background: XMAS_GREEN }}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div>
            <p className="text-[12px] font-semibold text-white" style={{ opacity: .7 }}>Navidad de {child.name}</p>
            <h1 className="font-display text-[20px] font-[800] text-white">Mis solicitudes</h1>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <button onClick={() => setPhase('select')}
          className="h-11 rounded-14 text-[13px] font-bold text-white flex items-center justify-center gap-2"
          style={{ background: XMAS_RED }}>
          <ShoppingBag size={16} /> Nueva solicitud de compra
        </button>

        {myRequests.length === 0 && (
          <div className="rounded-18 p-8 text-center bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
            <p className="text-[14px] text-ink-muted">Aún no has enviado solicitudes para {child.name}.</p>
          </div>
        )}

        {myRequests.map(r => {
          const store = stores.find(s => s.id === r.storeId);
          const hasProposal = r.status === 'proposal_ready' && r.proposal;
          const storeTotal = r.items.reduce((acc, i) => acc + i.knownPrice * i.qty, 0);
          return (
            <div key={r.id} className="rounded-20 p-4 bg-white" style={{ border: `1.5px solid ${hasProposal ? XMAS_RED + '66' : '#E2D8CB'}` }}>
              {hasProposal && (
                <div className="rounded-12 px-3 py-2 mb-3 flex items-center gap-2"
                  style={{ background: `${XMAS_RED}12` }}>
                  <span className="text-[14px]">🔔</span>
                  <p className="text-[12px] font-bold" style={{ color: XMAS_RED }}>Tienes una propuesta nueva de {store?.name}</p>
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">{store?.logoEmoji}</span>
                  <div>
                    <p className="text-[14px] font-bold text-ink">{store?.name}</p>
                    <p className="text-[11px] text-ink-muted">{r.id} · {new Date(r.createdAt).toLocaleDateString('es-CL')}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-1 rounded-10 flex-shrink-0"
                  style={{ background: `${REQUEST_STATUS_COLORS[r.status]}18`, color: REQUEST_STATUS_COLORS[r.status] }}>
                  {REQUEST_STATUS_LABELS[r.status]}
                </span>
              </div>

              <div className="mb-2">
                {r.items.map(item => (
                  <p key={item.productId} className="text-[12px] text-ink-muted">· {item.qty}× {item.productName} — {fmtCLP(item.knownPrice)}</p>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line">
                <p className="text-[12px] text-ink-muted">Estimado: {fmtCLP(storeTotal)}</p>
                {r.scheduledSendAt && r.status === 'scheduled' && (
                  <p className="text-[11px] text-ink-muted">Envío: {new Date(r.scheduledSendAt).toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
                )}
              </div>

              {hasProposal && (
                <button onClick={() => { setProposalView(r); setPhase('proposal'); }}
                  className="w-full h-10 rounded-14 mt-3 text-[13px] font-bold text-white"
                  style={{ background: XMAS_RED }}>
                  Ver propuesta y pagar →
                </button>
              )}

              {r.status === 'dispatched' && r.proposal?.trackingCode && (
                <div className="mt-2 rounded-12 px-3 py-2" style={{ background: `${XMAS_GREEN}12` }}>
                  <p className="text-[12px] font-semibold" style={{ color: XMAS_GREEN }}>📦 Despachado · Tracking: {r.proposal.trackingCode}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
