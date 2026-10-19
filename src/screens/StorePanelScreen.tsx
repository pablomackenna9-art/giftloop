import { usePurchaseRequests } from '../lib/use-purchase-requests';
import { useState } from 'react';
import { ChevronLeft, Check, X, Package } from 'lucide-react';
import {
  loadStores, loadProducts, loadRequests, saveRequests,
  REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS,
} from './xmas-store-data';
import type { PurchaseRequest, StoreProposal, RequestStatus } from './xmas-store-data';
import { fmtCLP, XMAS_GREEN, XMAS_RED, XMAS_GOLD } from './xmas-data';

type Props = {
  storeId: string;
  onBack: () => void;
};

type StoreTab = 'nuevas' | 'en_revision' | 'historial';

function ProposalForm({ request, onConfirm, onCancel }: {
  request: PurchaseRequest;
  onConfirm: (p: StoreProposal) => void;
  onCancel: () => void;
}) {
  const [itemAvail, setItemAvail] = useState<Record<string, boolean>>(
    Object.fromEntries(request.items.map(i => [i.productId, true]))
  );
  const [itemPrices, setItemPrices] = useState<Record<string, number>>(
    Object.fromEntries(request.items.map(i => [i.productId, i.knownPrice]))
  );
  const [shipping, setShipping] = useState('3990');
  const [deliveryRange, setDeliveryRange] = useState('18 al 21 de diciembre');
  const [paymentDeadline, setPaymentDeadline] = useState('10 de diciembre');
  const [paymentLink, setPaymentLink] = useState(`https://tienda-demo.cl/pago/${request.id}`);
  const [expiry, setExpiry] = useState('2026-12-01');
  const [rejected, setRejected] = useState<Record<string, string>>({});

  const confirmedItems = request.items.filter(i => itemAvail[i.productId]);
  const rejectedItems = request.items.filter(i => !itemAvail[i.productId]);
  const subtotal = confirmedItems.reduce((acc, i) => acc + (itemPrices[i.productId] ?? i.knownPrice) * i.qty, 0);
  const shippingNum = parseInt(shipping) || 0;
  const total = subtotal + shippingNum;

  const inp = "w-full h-10 rounded-12 px-3 text-[13px] text-ink outline-none bg-white";
  const inpStyle = { border: '1.5px solid #E2D8CB' };

  const submit = () => {
    const proposal: StoreProposal = {
      confirmedItems: confirmedItems.map(i => ({
        productId: i.productId, productName: i.productName, qty: i.qty,
        unitPrice: itemPrices[i.productId] ?? i.knownPrice, available: true,
      })),
      rejectedItems: rejectedItems.map(i => ({
        productId: i.productId, productName: i.productName, qty: i.qty, unitPrice: 0,
        available: false, unavailableReason: rejected[i.productId] ?? 'Sin stock',
      })),
      shipping: shippingNum, subtotal, total,
      deliveryRange, paymentDeadline, paymentLink,
      proposalExpiry: new Date(expiry).toISOString(),
      respondedAt: new Date().toISOString(),
      respondedBy: 'Tienda (demo)',
    };
    onConfirm(proposal);
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="font-display text-[18px] font-[800] text-ink">Responder solicitud {request.id}</h2>

      <div className="rounded-18 p-3 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
        <p className="text-[12px] font-bold text-ink-muted mb-2">Disponibilidad de productos</p>
        {request.items.map(item => (
          <div key={item.productId} className="py-2 border-b border-line last:border-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-ink truncate">{item.productName}</p>
                <p className="text-[11px] text-ink-muted">{item.qty} ud. · Precio conocido: {fmtCLP(item.knownPrice)}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setItemAvail(a => ({ ...a, [item.productId]: true }))}
                  className="w-8 h-8 rounded-10 flex items-center justify-center"
                  style={{ background: itemAvail[item.productId] ? `${XMAS_GREEN}18` : '#F0EBE5', border: `1.5px solid ${itemAvail[item.productId] ? XMAS_GREEN : '#E2D8CB'}` }}>
                  <Check size={14} style={{ color: itemAvail[item.productId] ? XMAS_GREEN : '#8A7D90' }} />
                </button>
                <button onClick={() => setItemAvail(a => ({ ...a, [item.productId]: false }))}
                  className="w-8 h-8 rounded-10 flex items-center justify-center"
                  style={{ background: !itemAvail[item.productId] ? '#FBE3DF' : '#F0EBE5', border: `1.5px solid ${!itemAvail[item.productId] ? XMAS_RED : '#E2D8CB'}` }}>
                  <X size={14} style={{ color: !itemAvail[item.productId] ? XMAS_RED : '#8A7D90' }} />
                </button>
              </div>
            </div>
            {itemAvail[item.productId] && (
              <div>
                <label className="text-[11px] text-ink-muted">Precio final (CLP)</label>
                <input type="number" value={itemPrices[item.productId] ?? item.knownPrice}
                  onChange={e => setItemPrices(p => ({ ...p, [item.productId]: parseInt(e.target.value) || 0 }))}
                  className={inp} style={inpStyle} />
              </div>
            )}
            {!itemAvail[item.productId] && (
              <div>
                <label className="text-[11px] text-ink-muted">Razón del rechazo</label>
                <input value={rejected[item.productId] ?? 'Sin stock'} placeholder="Motivo..."
                  onChange={e => setRejected(r => ({ ...r, [item.productId]: e.target.value }))}
                  className={inp} style={inpStyle} />
              </div>
            )}
          </div>
        ))}
      </div>

      {[
        { label: 'Envío (CLP, 0 = gratis)', key: 'shipping', val: shipping, set: setShipping },
        { label: 'Rango de entrega', key: 'delivery', val: deliveryRange, set: setDeliveryRange },
        { label: 'Plazo de pago para cumplir entrega', key: 'deadline', val: paymentDeadline, set: setPaymentDeadline },
        { label: 'Link de pago', key: 'link', val: paymentLink, set: setPaymentLink },
        { label: 'Vencimiento de propuesta', key: 'expiry', val: expiry, set: setExpiry },
      ].map(f => (
        <div key={f.key}>
          <label className="text-[12px] font-semibold text-ink-muted mb-1 block">{f.label}</label>
          <input value={f.val} onChange={e => f.set(e.target.value)} className={inp} style={inpStyle} />
        </div>
      ))}

      <div className="rounded-14 p-3" style={{ background: `${XMAS_GREEN}12` }}>
        <div className="flex justify-between text-[13px]"><span className="text-ink-muted">Subtotal</span><span className="font-bold text-ink">{fmtCLP(subtotal)}</span></div>
        <div className="flex justify-between text-[13px]"><span className="text-ink-muted">Envío</span><span className="font-bold text-ink">{shippingNum === 0 ? 'Gratis' : fmtCLP(shippingNum)}</span></div>
        <div className="flex justify-between text-[14px] mt-1 pt-1 border-t border-line"><span className="font-bold text-ink">Total</span><span className="font-bold" style={{ color: XMAS_GREEN }}>{fmtCLP(total)}</span></div>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 h-11 rounded-14 border-[1.5px] border-line text-[13px] font-semibold text-ink">Cancelar</button>
        <button onClick={submit} className="flex-1 h-11 rounded-14 text-[13px] font-bold text-white" style={{ background: XMAS_GREEN }}>
          Enviar propuesta
        </button>
      </div>
    </div>
  );
}

export function StorePanelScreen({ storeId, onBack }: Props) {
  const [tab, setTab] = useState<StoreTab>('nuevas');
  const [requests, setRequests] = usePurchaseRequests();
  const [proposalTarget, setProposalTarget] = useState<PurchaseRequest | null>(null);
  const stores = loadStores();
  const store = stores.find(s => s.id === storeId);

  const myRequests = requests.filter(r => r.storeId === storeId);
  const byTab = {
    nuevas: myRequests.filter(r => r.status === 'sent'),
    en_revision: myRequests.filter(r => r.status === 'in_review'),
    historial: myRequests.filter(r => !['sent','in_review','draft','scheduled'].includes(r.status)),
  };

  const updateStatus = (id: string, status: RequestStatus, note?: string) => {
    const now = new Date().toISOString();
    const updated = requests.map(r => r.id === id
      ? { ...r, status, history: [...r.history, { status, by: 'store' as const, at: now, note }] }
      : r);
    void saveRequests(updated).then(() => setRequests(updated)).catch(() => {});
  };

  const acceptAndReview = (id: string) => updateStatus(id, 'in_review', 'Tienda comenzó revisión');

  const confirmProposal = (req: PurchaseRequest, proposal: StoreProposal) => {
    const now = new Date().toISOString();
    const updated = requests.map(r => r.id === req.id
      ? { ...r, status: 'proposal_ready' as RequestStatus, proposal, history: [...r.history, { status: 'proposal_ready' as RequestStatus, by: 'store' as const, at: now }] }
      : r);
    void saveRequests(updated).then(() => { setRequests(updated); setProposalTarget(null); }).catch(() => {});
  };

  const confirmPaymentDemo = (id: string) => {
    updateStatus(id, 'paid', 'Pago confirmado (demostración desde panel tienda)');
  };

  const addTracking = (id: string) => {
    const code = `DEMO-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const updated = requests.map(r => {
      if (r.id !== id || !r.proposal) return r;
      return {
        ...r,
        status: 'dispatched' as RequestStatus,
        proposal: { ...r.proposal, trackingCode: code, trackingUrl: `https://seguimiento-demo.cl/${code}` },
        history: [...r.history, { status: 'dispatched' as RequestStatus, by: 'store' as const, at: now, note: `Tracking: ${code}` }],
      };
    });
    void saveRequests(updated).then(() => setRequests(updated)).catch(() => {});
  };

  if (proposalTarget) {
    return (
      <div className="min-h-screen pb-8" style={{ background: '#FAF7F2' }}>
        <div className="px-4 pt-5 pb-3" style={{ background: store?.logoEmoji === '🧱' ? '#1E4034' : store?.logoEmoji === '🔬' ? '#1A2A4A' : '#2D2D2D' }}>
          <button onClick={() => setProposalTarget(null)}
            className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <ChevronLeft size={20} className="text-white" />
          </button>
        </div>
        <ProposalForm request={proposalTarget} onConfirm={(p) => confirmProposal(proposalTarget, p)} onCancel={() => setProposalTarget(null)} />
      </div>
    );
  }

  const TABS: { id: StoreTab; label: string; count: number }[] = [
    { id: 'nuevas', label: 'Nuevas', count: byTab.nuevas.length },
    { id: 'en_revision', label: 'En revisión', count: byTab.en_revision.length },
    { id: 'historial', label: 'Historial', count: byTab.historial.length },
  ];

  const displayRequests = byTab[tab];

  return (
    <div className="min-h-screen pb-8" style={{ background: '#FAF7F2' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3" style={{ background: storeId === 'store-lego' ? '#1E4034' : storeId === 'store-explora' ? '#1A2A4A' : '#2D2D2D' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[24px]">{store?.logoEmoji}</span>
            <div>
              <p className="text-[11px] font-semibold text-white" style={{ opacity: .7 }}>Panel de tienda</p>
              <h1 className="font-display text-[18px] font-[800] text-white">{store?.name}</h1>
            </div>
          </div>
          <span className="ml-auto text-[10px] font-bold px-2 py-1 rounded-10" style={{ background: XMAS_GOLD, color: '#302238' }}>
            DEMO
          </span>
        </div>

        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-shrink-0 h-9 px-3 rounded-12 text-[12px] font-bold transition-all flex items-center gap-1.5"
              style={{
                background: tab === t.id ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.08)',
                color: 'white',
                border: tab === t.id ? '1.5px solid rgba(255,255,255,.4)' : '1.5px solid transparent',
              }}>
              {t.label}
              {t.count > 0 && (
                <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: t.id === 'nuevas' ? XMAS_RED : XMAS_GOLD, color: 'white' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {displayRequests.length === 0 && (
          <div className="rounded-18 p-8 text-center bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
            <Package size={32} className="mx-auto mb-2 text-ink-muted" />
            <p className="text-[14px] font-semibold text-ink">Sin solicitudes en esta sección</p>
          </div>
        )}

        {displayRequests.map(r => (
          <div key={r.id} className="rounded-20 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-display text-[15px] font-[800] text-ink">{r.id}</p>
                <p className="text-[12px] text-ink-muted">Navidad de {r.childName} · {new Date(r.createdAt).toLocaleDateString('es-CL')}</p>
                {r.sentAt && <p className="text-[11px] text-ink-muted">Recibida: {new Date(r.sentAt).toLocaleString('es-CL')}</p>}
              </div>
              <span className="text-[11px] font-bold px-2 py-1 rounded-10 flex-shrink-0"
                style={{ background: `${REQUEST_STATUS_COLORS[r.status]}18`, color: REQUEST_STATUS_COLORS[r.status] }}>
                {REQUEST_STATUS_LABELS[r.status]}
              </span>
            </div>

            {/* Items */}
            <div className="rounded-14 p-3 mb-3" style={{ background: '#FAF7F2' }}>
              <p className="text-[11px] font-bold text-ink-muted mb-2">Productos solicitados</p>
              {r.items.map(item => (
                <div key={item.productId} className="flex items-center gap-2 py-1">
                  {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded-8 object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-ink truncate">{item.productName}</p>
                    <p className="text-[11px] text-ink-muted">{item.qty} ud.</p>
                  </div>
                  <p className="text-[12px] font-bold text-ink flex-shrink-0">{fmtCLP(item.knownPrice * item.qty)}</p>
                </div>
              ))}
              <div className="flex justify-between mt-2 pt-2 border-t border-line">
                <p className="text-[12px] font-bold text-ink">Total estimado</p>
                <p className="text-[13px] font-bold text-ink">{fmtCLP(r.items.reduce((a, i) => a + i.knownPrice * i.qty, 0))}</p>
              </div>
            </div>

            {/* Proposal details */}
            {r.proposal && (
              <div className="rounded-14 p-3 mb-3" style={{ background: `${XMAS_GREEN}10` }}>
                <p className="text-[11px] font-bold mb-1" style={{ color: XMAS_GREEN }}>Propuesta enviada</p>
                <p className="text-[12px] text-ink">Total: {fmtCLP(r.proposal.total)} · Entrega: {r.proposal.deliveryRange}</p>
                {r.proposal.trackingCode && (
                  <p className="text-[11px] text-ink-muted mt-1">Tracking: {r.proposal.trackingCode}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {r.status === 'sent' && (
                <button onClick={() => acceptAndReview(r.id)}
                  className="h-10 rounded-14 text-[13px] font-bold text-white"
                  style={{ background: XMAS_GREEN }}>
                  Iniciar revisión
                </button>
              )}
              {r.status === 'in_review' && (
                <button onClick={() => setProposalTarget(r)}
                  className="h-10 rounded-14 text-[13px] font-bold text-white"
                  style={{ background: XMAS_GREEN }}>
                  Enviar propuesta al adulto
                </button>
              )}
              {r.status === 'pending_payment' && (
                <button onClick={() => confirmPaymentDemo(r.id)}
                  className="h-10 rounded-14 text-[13px] font-bold text-white"
                  style={{ background: '#557A65' }}>
                  ✓ Confirmar pago recibido (demo)
                </button>
              )}
              {r.status === 'paid' && (
                <button onClick={() => addTracking(r.id)}
                  className="h-10 rounded-14 text-[13px] font-bold text-white"
                  style={{ background: XMAS_GREEN }}>
                  📦 Agregar seguimiento de despacho
                </button>
              )}
              {(r.status === 'sent' || r.status === 'in_review') && (
                <button onClick={() => updateStatus(r.id, 'rejected', 'Rechazada por tienda')}
                  className="h-10 rounded-14 text-[13px] font-semibold border-[1.5px] text-ink"
                  style={{ borderColor: '#E2D8CB' }}>
                  Rechazar solicitud
                </button>
              )}
            </div>

            {/* History */}
            <div className="mt-3 pt-2 border-t border-line">
              <p className="text-[10px] font-bold text-ink-muted mb-1">Historial</p>
              {r.history.slice(-3).map((h, i) => (
                <p key={i} className="text-[10px] text-ink-muted">
                  {REQUEST_STATUS_LABELS[h.status]} · {h.by} · {new Date(h.at).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {h.note && ` · ${h.note}`}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
