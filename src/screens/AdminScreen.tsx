import { usePurchaseRequests } from '../lib/use-purchase-requests';
import { useState } from 'react';
import { ChevronLeft, Plus, Upload, Download, Check, X, AlertCircle, BarChart2, Store, Package, ShoppingBag, Megaphone, FileText } from 'lucide-react';
import {
  loadStores, saveStores, loadProducts, saveProducts, loadRequests, saveRequests,
  loadCampaigns, saveCampaigns, DEMO_STORES, STORE_CATALOG, DEMO_CAMPAIGNS,
  REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS,
} from './xmas-store-data';
import type { Store as StoreType, StoreProduct, PurchaseRequest, Campaign, RequestStatus } from './xmas-store-data';
import { fmtCLP } from './xmas-data';
import { XMAS_GREEN, XMAS_RED, XMAS_GOLD, XMAS_LIGHT } from './xmas-data';

type AdminTab = 'resumen' | 'tiendas' | 'catalogo' | 'solicitudes' | 'campanas' | 'reportes';

type Props = { onBack: () => void };

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'resumen', label: 'Resumen', icon: <BarChart2 size={16} /> },
  { id: 'tiendas', label: 'Tiendas', icon: <Store size={16} /> },
  { id: 'catalogo', label: 'Catálogo', icon: <Package size={16} /> },
  { id: 'solicitudes', label: 'Solicitudes', icon: <ShoppingBag size={16} /> },
  { id: 'campanas', label: 'Campañas', icon: <Megaphone size={16} /> },
  { id: 'reportes', label: 'Reportes', icon: <FileText size={16} /> },
];

// ── RESUMEN ────────────────────────────────────────────────────────────────────
function TabResumen() {
  const stores = loadStores();
  const products = loadProducts();
  const requests = loadRequests();

  const active = stores.filter(s => s.status === 'active').length;
  const published = products.filter(p => p.status === 'published').length;
  const noStock = products.filter(p => p.status === 'published' && p.stock !== 'unlimited' && Number(p.stock) === 0).length;
  const stale = products.filter(p => {
    const d = new Date(p.updatedAt);
    return (Date.now() - d.getTime()) > 30 * 24 * 3600 * 1000;
  }).length;

  const byStatus = (s: RequestStatus) => requests.filter(r => r.status === s).length;

  const metrics = [
    { label: 'Tiendas activas', val: active, color: XMAS_GREEN, icon: '🏪' },
    { label: 'Productos publicados', val: published, color: XMAS_GREEN, icon: '📦' },
    { label: 'Sin stock', val: noStock, color: noStock > 0 ? XMAS_RED : '#8A7D90', icon: '⚠️' },
    { label: 'Desactualizados (>30d)', val: stale, color: stale > 0 ? XMAS_GOLD : '#8A7D90', icon: '🕐' },
    { label: 'Pendientes de envío', val: byStatus('draft') + byStatus('scheduled'), color: XMAS_GOLD, icon: '📤' },
    { label: 'Esperando respuesta', val: byStatus('sent') + byStatus('in_review'), color: XMAS_GREEN, icon: '⏳' },
    { label: 'Propuesta disponible', val: byStatus('proposal_ready'), color: XMAS_RED, icon: '🔔' },
    { label: 'Pago confirmado', val: byStatus('paid') + byStatus('in_preparation') + byStatus('dispatched') + byStatus('delivered'), color: '#557A65', icon: '✅' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="rounded-18 p-3 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[18px]">{m.icon}</span>
              <span className="font-display text-[24px] font-[800]" style={{ color: m.color }}>{m.val}</span>
            </div>
            <p className="text-[11px] text-ink-muted leading-tight">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-18 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
        <p className="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-3">Solicitudes recientes</p>
        {requests.slice(0, 5).map(r => (
          <div key={r.id} className="flex items-center gap-2 py-2 border-b border-line last:border-0">
            <div>
              <p className="text-[13px] font-semibold text-ink">{r.id} · {r.childName}</p>
              <p className="text-[11px] text-ink-muted">{stores.find(s => s.id === r.storeId)?.name} · {new Date(r.createdAt).toLocaleDateString('es-CL')}</p>
            </div>
            <span className="ml-auto text-[11px] font-bold px-2 py-1 rounded-10 flex-shrink-0"
              style={{ background: `${REQUEST_STATUS_COLORS[r.status]}18`, color: REQUEST_STATUS_COLORS[r.status] }}>
              {REQUEST_STATUS_LABELS[r.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TIENDAS ────────────────────────────────────────────────────────────────────
function TabTiendas() {
  const [stores, setStores] = useState<StoreType[]>(loadStores);
  const [editing, setEditing] = useState<StoreType | null>(null);
  const [showForm, setShowForm] = useState(false);

  const save = (s: StoreType) => {
    const updated = stores.find(x => x.id === s.id)
      ? stores.map(x => x.id === s.id ? s : x)
      : [...stores, { ...s, id: `store-${Date.now()}` }];
    setStores(updated); saveStores(updated); setShowForm(false); setEditing(null);
  };

  const toggleStatus = (id: string) => {
    const updated = stores.map(s => s.id === id
      ? { ...s, status: s.status === 'active' ? 'paused' as const : 'active' as const }
      : s);
    setStores(updated); saveStores(updated);
  };

  if (showForm) {
    const s: StoreType = editing ?? {
      id: '', name: '', legalName: '', logoEmoji: '🏪',
      contactName: '', contactEmail: '', website: '',
      deliveryZones: ['Región Metropolitana'], deliveryConditions: '',
      returnsPolicy: '', responseTime: '24 horas hábiles', status: 'active',
    };
    return <StoreForm store={s} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />;
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <button onClick={() => { setEditing(null); setShowForm(true); }}
        className="h-11 rounded-14 text-[13px] font-bold text-white flex items-center justify-center gap-2"
        style={{ background: XMAS_GREEN }}>
        <Plus size={16} /> Agregar tienda
      </button>
      {stores.map(store => (
        <div key={store.id} className="rounded-20 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-14 flex items-center justify-center text-[24px] flex-shrink-0"
              style={{ background: XMAS_LIGHT }}>
              {store.logoEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-[16px] font-[800] text-ink">{store.name}</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-10"
                  style={{ background: store.status === 'active' ? `${XMAS_GREEN}18` : '#F0EBE5', color: store.status === 'active' ? XMAS_GREEN : '#8A7D90' }}>
                  {store.status === 'active' ? 'Activa' : 'Pausada'}
                </span>
              </div>
              <p className="text-[12px] text-ink-muted">{store.legalName}</p>
              <p className="text-[12px] text-ink-muted">{store.contactEmail} · {store.website}</p>
              <p className="text-[12px] text-ink-muted mt-0.5">Responde en {store.responseTime}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => { setEditing(store); setShowForm(true); }}
              className="flex-1 h-9 rounded-12 text-[13px] font-semibold border-[1.5px] border-line text-ink bg-white">
              Editar
            </button>
            <button onClick={() => toggleStatus(store.id)}
              className="flex-1 h-9 rounded-12 text-[13px] font-semibold text-ink"
              style={{ background: store.status === 'active' ? '#FBE3DF' : `${XMAS_GREEN}18`, color: store.status === 'active' ? XMAS_RED : XMAS_GREEN }}>
              {store.status === 'active' ? 'Pausar' : 'Activar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StoreForm({ store, onSave, onCancel }: { store: StoreType; onSave: (s: StoreType) => void; onCancel: () => void }) {
  const [s, setS] = useState<StoreType>(store);
  const inp = "w-full h-11 rounded-12 px-3 text-[13px] text-ink outline-none bg-white";
  const inpStyle = { border: '1.5px solid #E2D8CB' };
  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="font-display text-[18px] font-[800] text-ink">{store.id ? 'Editar tienda' : 'Nueva tienda'}</h2>
      {[
        { key: 'name', label: 'Nombre comercial' }, { key: 'legalName', label: 'Razón social' },
        { key: 'logoEmoji', label: 'Emoji logo' }, { key: 'contactName', label: 'Contacto comercial' },
        { key: 'contactEmail', label: 'Email para solicitudes' }, { key: 'website', label: 'Sitio web' },
        { key: 'responseTime', label: 'Plazo de respuesta' },
      ].map(f => (
        <div key={f.key}>
          <label className="text-[12px] font-semibold text-ink-muted mb-1 block">{f.label}</label>
          <input value={(s as unknown as Record<string, string>)[f.key] ?? ''} onChange={e => setS({ ...s, [f.key]: e.target.value })}
            className={inp} style={inpStyle} />
        </div>
      ))}
      <div>
        <label className="text-[12px] font-semibold text-ink-muted mb-1 block">Condiciones de entrega</label>
        <textarea value={s.deliveryConditions} onChange={e => setS({ ...s, deliveryConditions: e.target.value })}
          className="w-full rounded-12 px-3 py-2.5 text-[13px] text-ink outline-none bg-white resize-none"
          style={inpStyle} rows={2} />
      </div>
      <div>
        <label className="text-[12px] font-semibold text-ink-muted mb-1 block">Política de cambios y devoluciones</label>
        <textarea value={s.returnsPolicy} onChange={e => setS({ ...s, returnsPolicy: e.target.value })}
          className="w-full rounded-12 px-3 py-2.5 text-[13px] text-ink outline-none bg-white resize-none"
          style={inpStyle} rows={2} />
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={onCancel} className="flex-1 h-11 rounded-14 border-[1.5px] border-line text-[13px] font-semibold text-ink">Cancelar</button>
        <button onClick={() => onSave(s)} className="flex-1 h-11 rounded-14 text-[13px] font-bold text-white" style={{ background: XMAS_GREEN }}>Guardar</button>
      </div>
    </div>
  );
}

// ── CATÁLOGO ───────────────────────────────────────────────────────────────────
function TabCatalogo() {
  const [products, setProducts] = useState<StoreProduct[]>(loadProducts);
  const stores = loadStores();
  const [filterStore, setFilterStore] = useState('all');
  const [importMode, setImportMode] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<StoreProduct[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importDone, setImportDone] = useState(false);

  const filtered = filterStore === 'all' ? products : products.filter(p => p.storeId === filterStore);

  const parseCSV = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) { setErrors(['El archivo necesita encabezados y al menos una fila de datos.']); return; }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const errs: string[] = [];
    const parsed: StoreProduct[] = [];
    const existingSkus = new Map(products.map(p => [`${p.storeId}|${p.sku}`, p.id]));

    lines.slice(1).forEach((line, idx) => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });

      if (!row['sku']) errs.push(`Fila ${idx + 2}: SKU vacío`);
      if (!row['nombre'] && !row['name']) errs.push(`Fila ${idx + 2}: Nombre vacío`);
      if (!row['precio'] && !row['price']) errs.push(`Fila ${idx + 2}: Precio vacío o inválido`);
      const price = parseFloat(row['precio'] ?? row['price'] ?? '');
      if (isNaN(price)) errs.push(`Fila ${idx + 2}: Precio inválido (${row['precio'] ?? row['price']})`);
      if (!row['tienda'] && !row['storeid']) errs.push(`Fila ${idx + 2}: Tienda vacía`);

      if (!errs.length || errs.length === 0) {
        const storeId = row['tienda'] ?? row['storeid'] ?? stores[0]?.id ?? '';
        const sku = row['sku'] ?? '';
        const existId = existingSkus.get(`${storeId}|${sku}`);
        parsed.push({
          id: existId ?? `sp-csv-${Date.now()}-${idx}`,
          storeId, sku, brand: row['marca'] ?? row['brand'] ?? '',
          name: row['nombre'] ?? row['name'] ?? '',
          description: row['descripcion'] ?? row['description'] ?? '',
          images: [(row['imagen'] ?? row['image'] ?? '')].filter(Boolean),
          category: row['categoria'] ?? row['category'] ?? 'general',
          minAge: row['edad_min'] ? parseInt(row['edad_min']) : undefined,
          price: isNaN(price) ? 0 : price,
          currency: 'CLP',
          stock: parseInt(row['stock'] ?? '') || 'unknown',
          interests: (row['intereses'] ?? '').split('|').filter(Boolean),
          updatedAt: new Date().toISOString().slice(0, 10),
          status: 'draft',
        });
      }
    });

    setErrors(errs);
    if (errs.length === 0) setPreview(parsed);
  };

  const confirmImport = () => {
    const updated = [...products, ...preview.filter(p => !products.find(x => x.id === p.id))];
    preview.filter(p => products.find(x => x.id === p.id)).forEach(p => {
      const i = updated.findIndex(x => x.id === p.id);
      if (i >= 0) updated[i] = p;
    });
    setProducts(updated); saveProducts(updated);
    setImportDone(true); setPreview([]); setCsvText('');
  };

  const TEMPLATE = 'tienda,sku,marca,nombre,descripcion,precio,categoria,edad_min,stock,intereses,imagen\nstore-juguetemax,JM-NUEVO-001,MiMarca,Nombre del producto,Descripción corta,24990,juegos,6,10,juegos|deportes,https://url-imagen.jpg';

  const toggleStatus = (id: string) => {
    const updated = products.map(p => p.id === id
      ? { ...p, status: p.status === 'published' ? 'paused' as const : 'published' as const }
      : p);
    setProducts(updated); saveProducts(updated);
  };

  if (importMode) {
    return (
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => { setImportMode(false); setErrors([]); setPreview([]); setImportDone(false); }}
            className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(48,34,56,.08)' }}>
            <ChevronLeft size={18} className="text-ink" />
          </button>
          <h2 className="font-display text-[17px] font-[800] text-ink">Importar catálogo CSV</h2>
        </div>

        <div className="rounded-14 p-3 flex items-start gap-2" style={{ background: `${XMAS_GOLD}18`, border: `1px solid ${XMAS_GOLD}44` }}>
          <AlertCircle size={14} style={{ color: XMAS_GOLD }} className="flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-ink">Este prototipo soporta CSV. Los archivos Excel (.xlsx) requieren integración adicional. Descarga la plantilla para ver el formato esperado.</p>
        </div>

        <button onClick={() => {
          const a = document.createElement('a');
          a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`;
          a.download = 'plantilla-catalogo.csv'; a.click();
        }} className="h-11 rounded-14 text-[13px] font-semibold text-ink border-[1.5px] border-line bg-white flex items-center justify-center gap-2">
          <Download size={16} /> Descargar plantilla CSV
        </button>

        {importDone && (
          <div className="rounded-14 p-3 flex items-center gap-2" style={{ background: `${XMAS_GREEN}18` }}>
            <Check size={16} style={{ color: XMAS_GREEN }} />
            <p className="text-[13px] font-semibold" style={{ color: XMAS_GREEN }}>Importación completada. Productos en estado borrador, publícalos desde el catálogo.</p>
          </div>
        )}

        <div>
          <label className="text-[12px] font-semibold text-ink-muted mb-1 block">Pega el contenido CSV aquí</label>
          <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
            rows={6} placeholder="tienda,sku,nombre,precio,..."
            className="w-full rounded-12 px-3 py-2.5 text-[12px] font-mono text-ink outline-none resize-none"
            style={{ border: '1.5px solid #E2D8CB', background: '#FAF7F2' }} />
        </div>

        <button onClick={parseCSV} className="h-11 rounded-14 text-[13px] font-bold text-white" style={{ background: XMAS_GREEN }}>
          Analizar y previsualizar
        </button>

        {errors.length > 0 && (
          <div className="rounded-14 p-3" style={{ background: '#FBE3DF', border: '1px solid #EF756433' }}>
            <p className="text-[12px] font-bold mb-1" style={{ color: XMAS_RED }}>Errores encontrados ({errors.length})</p>
            {errors.slice(0, 5).map((e, i) => (
              <p key={i} className="text-[11px] text-ink-muted">• {e}</p>
            ))}
            {errors.length > 5 && <p className="text-[11px] text-ink-muted">…y {errors.length - 5} más</p>}
          </div>
        )}

        {preview.length > 0 && (
          <div>
            <p className="text-[12px] font-bold text-ink-muted mb-2">{preview.length} productos listos para importar</p>
            {preview.map(p => (
              <div key={p.id} className="rounded-12 p-3 mb-2 bg-white flex items-center gap-2" style={{ border: '1.5px solid #E2D8CB' }}>
                <Check size={14} style={{ color: XMAS_GREEN }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-ink truncate">{p.name}</p>
                  <p className="text-[11px] text-ink-muted">{p.sku} · {fmtCLP(p.price)} · {stores.find(s => s.id === p.storeId)?.name}</p>
                </div>
              </div>
            ))}
            <button onClick={confirmImport}
              className="w-full h-11 rounded-14 text-[13px] font-bold text-white mt-1"
              style={{ background: XMAS_GREEN }}>
              Confirmar importación de {preview.length} productos
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex gap-2">
        <button onClick={() => setImportMode(true)}
          className="flex-1 h-11 rounded-14 text-[13px] font-semibold border-[1.5px] border-line bg-white flex items-center justify-center gap-2 text-ink">
          <Upload size={16} /> Importar CSV
        </button>
        <button className="flex-1 h-11 rounded-14 text-[13px] font-bold text-white flex items-center justify-center gap-2"
          style={{ background: XMAS_GREEN }}>
          <Plus size={16} /> Agregar
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {[{ id: 'all', label: 'Todos' }, ...stores.map(s => ({ id: s.id, label: s.name }))].map(opt => (
          <button key={opt.id} onClick={() => setFilterStore(opt.id)}
            className="flex-shrink-0 h-8 px-3 rounded-20 text-[12px] font-semibold border-[1.5px] transition-all"
            style={{
              background: filterStore === opt.id ? XMAS_GREEN : 'white',
              color: filterStore === opt.id ? 'white' : '#302238',
              borderColor: filterStore === opt.id ? XMAS_GREEN : '#E2D8CB',
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      <p className="text-[12px] text-ink-muted">{filtered.length} productos</p>

      {filtered.map(p => (
        <div key={p.id} className="rounded-18 p-3 bg-white flex items-center gap-3" style={{ border: '1.5px solid #E2D8CB' }}>
          {p.images[0] && <img src={p.images[0]} alt="" className="w-12 h-12 rounded-12 object-cover flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-ink truncate">{p.name}</p>
            <p className="text-[11px] text-ink-muted">{p.sku} · {p.brand} · {fmtCLP(p.price)}</p>
            <p className="text-[11px] text-ink-muted">{stores.find(s => s.id === p.storeId)?.name} · Stock: {p.stock}</p>
          </div>
          <button onClick={() => toggleStatus(p.id)}
            className="text-[11px] font-bold px-2 py-1 rounded-10 flex-shrink-0"
            style={{
              background: p.status === 'published' ? `${XMAS_GREEN}18` : p.status === 'draft' ? `${XMAS_GOLD}18` : '#F0EBE5',
              color: p.status === 'published' ? XMAS_GREEN : p.status === 'draft' ? XMAS_GOLD : '#8A7D90',
            }}>
            {p.status === 'published' ? 'Publicado' : p.status === 'draft' ? 'Borrador' : 'Pausado'}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── SOLICITUDES ────────────────────────────────────────────────────────────────
function TabSolicitudes() {
  const [requests, setRequests] = usePurchaseRequests();
  const stores = loadStores();
  const [filterStatus, setFilterStatus] = useState<RequestStatus | 'all'>('all');

  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus);

  const sendBatch = () => {
    const now = new Date().toISOString();
    const updated = requests.map(r =>
      r.status === 'scheduled' ? { ...r, status: 'sent' as RequestStatus, sentAt: now, history: [...r.history, { status: 'sent' as RequestStatus, by: 'system' as const, at: now, note: 'Lote manual de demostración' }] } : r
    );
    void saveRequests(updated).then(() => setRequests(updated)).catch(() => {});
  };

  const scheduled = requests.filter(r => r.status === 'scheduled').length;

  return (
    <div className="p-4 flex flex-col gap-3">
      {scheduled > 0 && (
        <div className="rounded-16 p-3 flex items-center gap-3" style={{ background: `${XMAS_GOLD}18`, border: `1px solid ${XMAS_GOLD}44` }}>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-ink">{scheduled} solicitudes pendientes de envío manual</p>
            <p className="text-[11px] text-ink-muted">Envía el lote para que aparezca en los paneles de las tiendas.</p>
          </div>
          <button onClick={sendBatch}
            className="flex-shrink-0 h-9 px-3 rounded-12 text-[12px] font-bold text-white"
            style={{ background: XMAS_GOLD }}>
            Enviar lote
          </button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {[{ id: 'all', label: 'Todas' }, { id: 'pending_payment', label: 'Por pagar' }, { id: 'proposal_ready', label: 'Propuesta' }, { id: 'in_review', label: 'En revisión' }, { id: 'sent', label: 'Enviadas' }].map(opt => (
          <button key={opt.id} onClick={() => setFilterStatus(opt.id as RequestStatus | 'all')}
            className="flex-shrink-0 h-8 px-3 rounded-20 text-[12px] font-semibold border-[1.5px] transition-all"
            style={{
              background: filterStatus === opt.id ? XMAS_GREEN : 'white',
              color: filterStatus === opt.id ? 'white' : '#302238',
              borderColor: filterStatus === opt.id ? XMAS_GREEN : '#E2D8CB',
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.map(r => (
        <div key={r.id} className="rounded-18 p-3 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[13px] font-bold text-ink">{r.id}</p>
              <p className="text-[11px] text-ink-muted">{r.childName} · {stores.find(s => s.id === r.storeId)?.name}</p>
              <p className="text-[11px] text-ink-muted">{new Date(r.createdAt).toLocaleDateString('es-CL')}</p>
            </div>
            <span className="text-[11px] font-bold px-2 py-1 rounded-10"
              style={{ background: `${REQUEST_STATUS_COLORS[r.status]}18`, color: REQUEST_STATUS_COLORS[r.status] }}>
              {REQUEST_STATUS_LABELS[r.status]}
            </span>
          </div>
          {r.items.map(item => (
            <div key={item.productId} className="flex items-center gap-1 text-[11px] text-ink-muted">
              <span>·</span><span>{item.qty}× {item.productName}</span><span className="ml-auto">{fmtCLP(item.knownPrice * item.qty)}</span>
            </div>
          ))}
          {r.history.length > 0 && (
            <p className="text-[10px] text-ink-muted mt-2 pt-2 border-t border-line">
              Última actualización: {r.history[r.history.length - 1].by} · {new Date(r.history[r.history.length - 1].at).toLocaleString('es-CL')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── CAMPAÑAS ───────────────────────────────────────────────────────────────────
function TabCampanas() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(loadCampaigns);
  const stores = loadStores();

  const toggleStatus = (id: string) => {
    const updated = campaigns.map(c => c.id === id
      ? { ...c, status: c.status === 'active' ? 'ended' as const : 'active' as const }
      : c);
    setCampaigns(updated); saveCampaigns(updated);
  };

  const STATUS_COLORS: Record<string, string> = {
    draft: '#8A7D90', scheduled: XMAS_GOLD, active: XMAS_GREEN, ended: '#8A7D90',
  };
  const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador', scheduled: 'Programada', active: 'Activa', ended: 'Finalizada',
  };
  const LOCATION_LABELS: Record<string, string> = {
    adult_panel_featured: 'Panel adulto destacado',
    adult_explore: 'Exploración adulto',
    adult_brand_banner: 'Banner de marca',
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="rounded-14 p-3 flex items-start gap-2" style={{ background: `${XMAS_GREEN}12`, border: `1px solid ${XMAS_GREEN}33` }}>
        <AlertCircle size={14} style={{ color: XMAS_GREEN }} className="flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-ink">El taller infantil no acepta posiciones pagadas. Las campañas aplican solo en el área del adulto y respetan todos los filtros de edad, precio y disponibilidad.</p>
      </div>

      {campaigns.map(c => {
        const store = stores.find(s => s.id === c.storeId);
        return (
          <div key={c.id} className="rounded-20 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-display text-[15px] font-[800] text-ink">{c.name}</h3>
                <p className="text-[12px] text-ink-muted">{store?.name} · Prioridad {c.priority}</p>
                <p className="text-[12px] text-ink-muted">{c.startDate} → {c.endDate}</p>
              </div>
              <span className="text-[11px] font-bold px-2 py-1 rounded-10"
                style={{ background: `${STATUS_COLORS[c.status]}18`, color: STATUS_COLORS[c.status] }}>
                {STATUS_LABELS[c.status]}
              </span>
            </div>
            <div className="flex gap-1 flex-wrap mb-2">
              {c.locations.map(loc => (
                <span key={loc} className="text-[10px] font-semibold px-2 py-0.5 rounded-10 text-ink" style={{ background: `${XMAS_GOLD}20` }}>
                  📍 {LOCATION_LABELS[loc]}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: 'Impresiones', val: c.stats.impressions },
                { label: 'Clics', val: c.stats.clicks },
                { label: 'Seleccionados', val: c.stats.selected },
                { label: 'Pagos confirmados', val: c.stats.paymentConfirmed },
              ].map(s => (
                <div key={s.label} className="text-center rounded-10 py-1.5" style={{ background: '#FAF7F2' }}>
                  <p className="font-display text-[16px] font-[800] text-ink">{s.val}</p>
                  <p className="text-[9px] text-ink-muted">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-line">
              <p className="text-[11px] text-ink-muted">Monto: {fmtCLP(c.commercialAmount)} (solo admin)</p>
              <button onClick={() => toggleStatus(c.id)}
                className="h-8 px-3 rounded-12 text-[11px] font-bold text-ink"
                style={{ background: c.status === 'active' ? '#FBE3DF' : `${XMAS_GREEN}18`, color: c.status === 'active' ? XMAS_RED : XMAS_GREEN }}>
                {c.status === 'active' ? 'Pausar' : 'Activar'}
              </button>
            </div>
          </div>
        );
      })}

      <button className="h-11 rounded-14 text-[13px] font-bold text-white flex items-center justify-center gap-2"
        style={{ background: XMAS_GREEN }}>
        <Plus size={16} /> Nueva campaña
      </button>
    </div>
  );
}

// ── REPORTES ───────────────────────────────────────────────────────────────────
function TabReportes() {
  const requests = loadRequests();
  const products = loadProducts();
  const stores = loadStores();

  const totalRequests = requests.length;
  const paid = requests.filter(r => ['paid','in_preparation','dispatched','delivered'].includes(r.status));
  const totalRevenue = paid.flatMap(r => r.items).reduce((acc, i) => acc + i.knownPrice * i.qty, 0);
  const avgItems = totalRequests > 0 ? (requests.flatMap(r => r.items).length / totalRequests).toFixed(1) : '0';

  const byStore = stores.map(s => {
    const reqs = requests.filter(r => r.storeId === s.id);
    const rev = reqs.filter(r => paid.find(p => p.id === r.id)).flatMap(r => r.items).reduce((acc, i) => acc + i.knownPrice * i.qty, 0);
    return { store: s, reqs: reqs.length, revenue: rev };
  });

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="rounded-18 p-3 flex items-start gap-2" style={{ background: `${XMAS_GOLD}12` }}>
        <AlertCircle size={14} style={{ color: XMAS_GOLD }} className="flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-ink">Los reportes muestran datos del prototipo. "Venta confirmada" requiere que el pago haya sido verificado por la tienda, no solo que el adulto haya abierto el enlace de pago.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total solicitudes', val: totalRequests, icon: '📋' },
          { label: 'Pagos confirmados', val: paid.length, icon: '✅' },
          { label: 'Facturación confirmada', val: fmtCLP(totalRevenue), icon: '💰' },
          { label: 'Ítems por solicitud', val: avgItems, icon: '📦' },
        ].map(m => (
          <div key={m.label} className="rounded-18 p-3 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
            <div className="flex items-center gap-1 mb-1">
              <span>{m.icon}</span>
              <span className="font-display text-[20px] font-[800] text-ink">{m.val}</span>
            </div>
            <p className="text-[11px] text-ink-muted">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-18 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
        <p className="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-3">Por tienda</p>
        {byStore.map(row => (
          <div key={row.store.id} className="flex items-center gap-2 py-2 border-b border-line last:border-0">
            <span className="text-[18px]">{row.store.logoEmoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-ink">{row.store.name}</p>
              <p className="text-[11px] text-ink-muted">{row.reqs} solicitudes</p>
            </div>
            <p className="text-[13px] font-bold text-ink">{fmtCLP(row.revenue)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-18 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
        <p className="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-3">Productos más solicitados</p>
        {Object.entries(
          requests.flatMap(r => r.items).reduce((acc, i) => ({ ...acc, [i.productName]: (acc[i.productName] ?? 0) + i.qty }), {} as Record<string, number>)
        ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => (
          <div key={name} className="flex items-center gap-2 py-1.5 border-b border-line last:border-0">
            <p className="text-[12px] text-ink flex-1 truncate">{name}</p>
            <p className="text-[12px] font-bold text-ink-muted flex-shrink-0">{qty} ud.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export function AdminScreen({ onBack }: Props) {
  const [tab, setTab] = useState<AdminTab>('resumen');

  return (
    <div className="min-h-screen pb-4" style={{ background: '#FAF7F2' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3" style={{ background: XMAS_GREEN }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div>
            <p className="text-[11px] font-semibold text-white" style={{ opacity: .7 }}>Panel de administración</p>
            <h1 className="font-display text-[20px] font-[800] text-white">GiftLoop Navidad</h1>
          </div>
          <span className="ml-auto text-[10px] font-bold px-2 py-1 rounded-10" style={{ background: `${XMAS_GOLD}`, color: '#302238' }}>
            DEMO
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-12 text-[12px] font-bold transition-all"
              style={{
                background: tab === t.id ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.08)',
                color: 'white',
                border: tab === t.id ? '1.5px solid rgba(255,255,255,.4)' : '1.5px solid transparent',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'resumen' && <TabResumen />}
      {tab === 'tiendas' && <TabTiendas />}
      {tab === 'catalogo' && <TabCatalogo />}
      {tab === 'solicitudes' && <TabSolicitudes />}
      {tab === 'campanas' && <TabCampanas />}
      {tab === 'reportes' && <TabReportes />}
    </div>
  );
}
