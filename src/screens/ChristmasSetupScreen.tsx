import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { INTERESTS, EXCLUSIONS, loadChildren, saveChildren, XMAS_RED, XMAS_GREEN, XMAS_GOLD, fmtCLP } from './xmas-data';
import type { ChildProfile } from './xmas-data';

type Props = {
  existing?: ChildProfile | null;
  onBack: () => void;
  onDone: (child: ChildProfile) => void;
};

const COUNTRIES = ['Chile', 'Argentina', 'México', 'España', 'Colombia', 'Perú', 'Uruguay'];
const SANTA_BY_COUNTRY: Record<string, string> = {
  Chile: 'Viejo Pascuero',
  Argentina: 'Papá Noel',
  México: 'Santa Claus',
  España: 'Papá Noel',
  Colombia: 'Papá Noel',
  Perú: 'Papá Noel',
  Uruguay: 'Papá Noel',
};

const STEPS = ['Personalización', 'Gustos', 'Presupuesto', 'Revisar'];

export function ChristmasSetupScreen({ existing, onBack, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(existing?.name ?? '');
  const [age, setAge] = useState(existing?.age ?? 7);
  const [country, setCountry] = useState(existing?.country ?? 'Chile');
  const [santaName, setSantaName] = useState(existing?.santaName ?? 'Viejo Pascuero');
  const [parentMessage, setParentMessage] = useState(existing?.parentMessage ?? '');
  const [interests, setInterests] = useState<string[]>(existing?.interests ?? []);
  const [exclusions, setExclusions] = useState<string[]>(existing?.exclusions ?? []);
  const [customInterest, setCustomInterest] = useState('');
  const [maxGift, setMaxGift] = useState(existing?.maxGiftPrice ?? 30000);
  const [budget, setBudget] = useState(existing?.adultBudget ?? 500000);

  const toggleInterest = (id: string) => {
    setInterests(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };
  const toggleExclusion = (id: string) => {
    setExclusions(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const handleCountry = (c: string) => {
    setCountry(c);
    setSantaName(SANTA_BY_COUNTRY[c] ?? 'Papá Noel');
  };

  const canContinue = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return interests.length >= 1;
    if (step === 2) return maxGift > 0 && budget > 0;
    return true;
  };

  const finish = () => {
    const id = existing?.id ?? `child_${Date.now()}`;
    const child: ChildProfile = {
      id, name: name.trim(), age, country, santaName,
      parentMessage: parentMessage.trim() || undefined,
      interests, exclusions, maxGiftPrice: maxGift,
      adultBudget: budget, setupDone: true, letterSent: false,
    };
    const all = loadChildren();
    const idx = all.findIndex(c => c.id === id);
    if (idx >= 0) all[idx] = child; else all.push(child);
    saveChildren(all);
    onDone(child);
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: '#FAF7F2' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <button onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(48,34,56,.08)' }}>
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <h1 className="font-display text-[22px] font-[800] text-ink">Preparar Navidad</h1>
        <p className="text-[13px] text-ink-muted mt-0.5">Paso {step + 1} de {STEPS.length}</p>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-6">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: i <= step ? XMAS_GREEN : '#E2D8CB' }} />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {STEPS.map((s, i) => (
            <p key={s} className="text-[10px] font-semibold"
              style={{ color: i === step ? XMAS_GREEN : '#8A7D90' }}>{s}</p>
          ))}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">

        {/* STEP 0: Personalization */}
        {step === 0 && (
          <>
            <div>
              <label className="text-[12px] font-bold text-ink-muted uppercase tracking-wider">Nombre del niño</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Ej: Pablo"
                className="w-full h-12 rounded-14 px-4 mt-1.5 text-[16px] font-semibold text-ink outline-none"
                style={{ border: '1.5px solid #E2D8CB', background: 'white' }} />
              <p className="text-[12px] text-ink-muted mt-1">Este nombre lo usará {santaName} para saludarlo</p>
            </div>

            <div>
              <label className="text-[12px] font-bold text-ink-muted uppercase tracking-wider">Edad</label>
              <div className="flex items-center gap-4 mt-2">
                <button onClick={() => setAge(a => Math.max(1, a - 1))}
                  className="w-10 h-10 rounded-full border-[1.5px] border-line flex items-center justify-center text-[20px] font-bold text-ink">−</button>
                <span className="font-display text-[32px] font-[800] text-ink w-12 text-center">{age}</span>
                <button onClick={() => setAge(a => Math.min(12, a + 1))}
                  className="w-10 h-10 rounded-full border-[1.5px] border-line flex items-center justify-center text-[20px] font-bold text-ink">+</button>
                <span className="text-[15px] text-ink-muted">años</span>
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-ink-muted uppercase tracking-wider">País</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COUNTRIES.map(c => (
                  <button key={c} onClick={() => handleCountry(c)}
                    className="h-9 px-4 rounded-20 text-[13px] font-semibold border-[1.5px] transition-all"
                    style={{
                      background: country === c ? XMAS_GREEN : 'white',
                      color: country === c ? 'white' : '#302238',
                      borderColor: country === c ? XMAS_GREEN : '#E2D8CB',
                    }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-ink-muted uppercase tracking-wider">¿Cómo llamamos a Santa?</label>
              <input value={santaName} onChange={e => setSantaName(e.target.value)}
                className="w-full h-12 rounded-14 px-4 mt-1.5 text-[15px] text-ink outline-none"
                style={{ border: '1.5px solid #E2D8CB', background: 'white' }} />
            </div>

            <div>
              <label className="text-[12px] font-bold text-ink-muted uppercase tracking-wider">Mensaje cariñoso (opcional)</label>
              <textarea value={parentMessage} onChange={e => setParentMessage(e.target.value)}
                placeholder={`Puedes agregar un mensaje que ${santaName} incluirá en el saludo`}
                rows={3}
                className="w-full rounded-14 px-4 py-3 mt-1.5 text-[14px] text-ink outline-none resize-none"
                style={{ border: '1.5px solid #E2D8CB', background: 'white' }} />
            </div>
          </>
        )}

        {/* STEP 1: Interests */}
        {step === 1 && (
          <>
            <div>
              <h2 className="font-display text-[18px] font-[700] text-ink mb-1">¿Qué le gusta a {name || 'el niño'}?</h2>
              <p className="text-[13px] text-ink-muted mb-4">Selecciona todo lo que le apasione (al menos uno)</p>
              <div className="grid grid-cols-3 gap-2">
                {INTERESTS.map(int => {
                  const active = interests.includes(int.id);
                  return (
                    <button key={int.id} onClick={() => toggleInterest(int.id)}
                      className="rounded-18 p-3 flex flex-col items-center gap-1 text-center transition-all relative"
                      style={{
                        background: active ? `${XMAS_GREEN}15` : 'white',
                        border: `2px solid ${active ? XMAS_GREEN : '#E2D8CB'}`,
                      }}>
                      {active && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: XMAS_GREEN }}>
                          <Check size={11} className="text-white" />
                        </div>
                      )}
                      <span className="text-[22px]">{int.emoji}</span>
                      <span className="text-[11px] font-semibold text-ink leading-tight">{int.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {customInterest.length > 0 || true ? (
              <div>
                <label className="text-[12px] font-bold text-ink-muted uppercase tracking-wider">¿Otro interés?</label>
                <div className="flex gap-2 mt-1.5">
                  <input value={customInterest} onChange={e => setCustomInterest(e.target.value)}
                    placeholder="Escribe aquí..."
                    className="flex-1 h-10 rounded-12 px-3 text-[14px] text-ink outline-none"
                    style={{ border: '1.5px solid #E2D8CB', background: 'white' }} />
                  {customInterest.trim() && (
                    <button onClick={() => { toggleInterest(`custom_${customInterest.trim()}`); setCustomInterest(''); }}
                      className="h-10 px-4 rounded-12 text-[13px] font-bold text-white"
                      style={{ background: XMAS_GREEN }}>
                      Agregar
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="text-[13px] font-bold text-ink-muted uppercase tracking-wider mb-2">¿Algo que preferiría excluir?</h3>
              <div className="flex flex-col gap-2">
                {EXCLUSIONS.map(exc => {
                  const active = exclusions.includes(exc.id);
                  return (
                    <button key={exc.id} onClick={() => toggleExclusion(exc.id)}
                      className="flex items-center gap-3 rounded-14 px-3.5 py-3 text-left transition-all"
                      style={{
                        background: active ? '#FBE3DF' : 'white',
                        border: `1.5px solid ${active ? XMAS_RED : '#E2D8CB'}`,
                      }}>
                      <div className="w-5 h-5 rounded-6 border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: active ? XMAS_RED : '#D9CFC2', background: active ? XMAS_RED : 'white' }}>
                        {active && <Check size={11} className="text-white" />}
                      </div>
                      <span className="text-[14px] text-ink">{exc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* STEP 2: Budget */}
        {step === 2 && (
          <>
            <div className="rounded-18 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
              <h3 className="font-display text-[17px] font-[700] text-ink mb-1">Mostrar regalos que cuesten menos de…</h3>
              <p className="text-[13px] text-ink-muted mb-3">
                Con {fmtCLP(maxGift)}, {name || 'el niño'} verá productos con precio inferior a ese valor. Los de mayor precio no aparecerán en su catálogo.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-ink">$</span>
                <input
                  type="number"
                  value={maxGift}
                  onChange={e => setMaxGift(Number(e.target.value))}
                  className="flex-1 h-12 rounded-12 px-3 text-[18px] font-bold text-ink outline-none"
                  style={{ border: '1.5px solid #E2D8CB', background: '#FAF7F2' }} />
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {[15000, 20000, 30000, 50000].map(v => (
                  <button key={v} onClick={() => setMaxGift(v)}
                    className="h-8 px-3 rounded-10 text-[12px] font-bold transition-all"
                    style={{
                      background: maxGift === v ? XMAS_GREEN : '#EAE2D6',
                      color: maxGift === v ? 'white' : '#302238',
                    }}>
                    {fmtCLP(v)}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-18 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
              <h3 className="font-display text-[17px] font-[700] text-ink mb-1">Mi presupuesto total</h3>
              <p className="text-[13px] text-ink-muted mb-3">
                Cuánto quieres gastar tú en los regalos de {name || 'el niño'}. No se muestra al niño.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-ink">$</span>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                  className="flex-1 h-12 rounded-12 px-3 text-[18px] font-bold text-ink outline-none"
                  style={{ border: '1.5px solid #E2D8CB', background: '#FAF7F2' }} />
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {[100000, 250000, 500000, 1000000].map(v => (
                  <button key={v} onClick={() => setBudget(v)}
                    className="h-8 px-3 rounded-10 text-[12px] font-bold transition-all"
                    style={{
                      background: budget === v ? XMAS_GREEN : '#EAE2D6',
                      color: budget === v ? 'white' : '#302238',
                    }}>
                    {fmtCLP(v)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            <div className="rounded-22 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
              <p className="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-3">Resumen</p>
              {[
                { label: 'Nombre', val: name },
                { label: 'Edad', val: `${age} años` },
                { label: 'País', val: country },
                { label: 'Llama a Santa', val: santaName },
                { label: 'Regalos hasta', val: fmtCLP(maxGift) },
                { label: 'Mi presupuesto', val: fmtCLP(budget) },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                  <p className="text-[13px] text-ink-muted">{row.label}</p>
                  <p className="text-[14px] font-semibold text-ink">{row.val}</p>
                </div>
              ))}
            </div>

            <div className="rounded-18 p-4" style={{ background: `${XMAS_GREEN}10`, border: `1.5px solid ${XMAS_GREEN}30` }}>
              <p className="text-[13px] font-semibold" style={{ color: XMAS_GREEN }}>
                Intereses seleccionados: {interests.length}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {interests.map(id => {
                  const int = INTERESTS.find(i => i.id === id);
                  return (
                    <span key={id} className="px-2.5 py-1 rounded-20 text-[12px] font-semibold"
                      style={{ background: `${XMAS_GREEN}20`, color: XMAS_GREEN }}>
                      {int ? `${int.emoji} ${int.label}` : id}
                    </span>
                  );
                })}
              </div>
            </div>

            {parentMessage && (
              <div className="rounded-18 p-4 bg-white" style={{ border: '1.5px solid #E2D8CB' }}>
                <p className="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-1">Tu mensaje</p>
                <p className="text-[14px] text-ink italic">"{parentMessage}"</p>
              </div>
            )}

            <div className="rounded-18 px-4 py-3 flex items-start gap-2"
              style={{ background: `${XMAS_GOLD}18`, border: `1px solid ${XMAS_GOLD}44` }}>
              <span className="text-[16px]">ℹ️</span>
              <p className="text-[12px] text-ink leading-snug">
                El saludo es una demostración: el guion se personaliza con el nombre de {name || 'el niño'}, pero no incluye un video generado con voz real.
              </p>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="h-12 px-5 rounded-16 border-[1.5px] border-line text-[15px] font-semibold text-ink bg-white flex items-center gap-2">
              <ChevronLeft size={18} /> Volver
            </button>
          )}
          <button
            onClick={() => step < 3 ? setStep(s => s + 1) : finish()}
            disabled={!canContinue()}
            className="flex-1 h-12 rounded-16 text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: canContinue() ? (step === 3 ? XMAS_RED : XMAS_GREEN) : '#D9CFC2',
            }}>
            {step === 3 ? '🎅 Preparar el saludo' : 'Siguiente'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
