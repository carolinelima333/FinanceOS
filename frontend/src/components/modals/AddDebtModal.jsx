import { useState } from "react";
import { fmt } from "../../constants.js";

const DEFAULT_CATS = ["Moradia","Empréstimo","Vestuário","Família","Transporte","Comunicação","Saúde","Acessórios","Presentes","Outros"];
const DEFAULT_FORS = ["Minha","Bia","Joel","Ana K"];

function loadCustom(key, defaults) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    const merged = [...defaults];
    saved.forEach(v => { if (!merged.includes(v)) merged.push(v); });
    return merged;
  } catch { return defaults; }
}

function saveCustom(key, defaults, options) {
  const custom = options.filter(v => !defaults.includes(v));
  localStorage.setItem(key, JSON.stringify(custom));
}

function CreatableSelect({ label, value, options, defaults, storageKey, onChange, onOptionsChange, inpStyle, t }) {
  const [adding, setAdding] = useState(false);
  const [draft,  setDraft]  = useState("");

  const confirm = () => {
    const v = draft.trim();
    if (!v) { setAdding(false); return; }
    if (!options.includes(v)) {
      const next = [...options, v];
      saveCustom(storageKey, defaults, next);
      onOptionsChange(next);
    }
    onChange(v);
    setDraft("");
    setAdding(false);
  };

  const handleKey = e => {
    if (e.key === "Enter") { e.preventDefault(); confirm(); }
    if (e.key === "Escape") { setAdding(false); setDraft(""); }
  };

  const handleSelect = e => {
    if (e.target.value === "__add__") { setAdding(true); setDraft(""); }
    else onChange(e.target.value);
  };

  const removeCustom = (v) => {
    const next = options.filter(o => o !== v);
    saveCustom(storageKey, defaults, next);
    onOptionsChange(next);
    if (value === v) onChange(defaults[0]);
  };

  return (
    <div style={{ marginBottom:13 }}>
      <div style={{ fontSize:12, color:t.muted, marginBottom:5, fontWeight:500 }}>{label}</div>

      {adding ? (
        <div style={{ display:"flex", gap:6 }}>
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Digite e pressione Enter"
            style={{ ...inpStyle, flex:1 }}
          />
          <button onClick={confirm} style={{ padding:"0 12px", borderRadius:9, border:"none", background:t.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>✓</button>
          <button onClick={() => { setAdding(false); setDraft(""); }} style={{ padding:"0 10px", borderRadius:9, border:`1px solid ${t.border}`, background:"transparent", color:t.muted, fontSize:16, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>×</button>
        </div>
      ) : (
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <select value={value} onChange={handleSelect} style={{ ...inpStyle, flex:1, padding:"10px 12px" }}>
            {options.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
            <option value="__add__">➕ Adicionar novo...</option>
          </select>
          {!defaults.includes(value) && (
            <button
              onClick={() => removeCustom(value)}
              title="Remover esta opção"
              style={{ padding:"0 10px", borderRadius:9, border:`1px solid ${t.border}`, background:"rgba(239,68,68,0.08)", color:"#EF4444", fontSize:14, cursor:"pointer", fontFamily:"inherit", flexShrink:0, height:38 }}
            >×</button>
          )}
        </div>
      )}
    </div>
  );
}

export function AddDebtModal({ t, onSave, onClose, editing }) {
  const [cats, setCats] = useState(() => loadCustom("fos-cats", DEFAULT_CATS));
  const [fors, setFors] = useState(() => loadCustom("fos-fors", DEFAULT_FORS));

  const [form, setForm] = useState({
    creditor: editing?.creditor  || "",
    category: editing?.cat       || "Outros",
    for_:     editing?.for_      || "Minha",
    monthly:  editing?.monthly   || "",
    ti:       editing?.ti        || "",
    paid:     editing?.paid      || "0",
    due:      editing?.due       || "",
    status:   editing?.status    || "active",
    priority: editing?.priority  || "Média",
    note:     editing?.note      || "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]:v }));
  const rem      = Math.max(0, Number(form.ti) - Number(form.paid));
  const totalRem = Number(form.monthly) * rem;
  const valid    = form.creditor.trim() && Number(form.monthly) > 0 && Number(form.ti) > 0;

  const save = () => {
    if (!valid) return;
    onSave({
      creditor: form.creditor.trim(),
      cat:      form.category,
      for_:     form.for_,
      monthly:  Number(form.monthly),
      ti:       Number(form.ti),
      paid:     Number(form.paid),
      rem,
      total:    totalRem,
      due:      Number(form.due) || null,
      status:   form.status,
      priority: form.priority,
      note:     form.note,
    });
  };

  const inpStyle = {
    width:"100%", padding:"10px 12px", borderRadius:9,
    border:`1px solid ${t.border}`, background:t.surface, color:t.text,
    fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit",
  };

  const fld = (label, key, type, ph, hint, req) => (
    <div style={{ marginBottom:13 }}>
      <div style={{ fontSize:12, color:t.muted, marginBottom:5, fontWeight:500 }}>
        {label}{req && <span style={{ color:"#EF4444", marginLeft:2 }}>*</span>}
      </div>
      <input type={type||"text"} value={form[key]} onChange={e => set(key, e.target.value)}
        placeholder={ph||""} style={inpStyle}/>
      {hint && <div style={{ fontSize:10, color:t.muted, marginTop:3 }}>{hint}</div>}
    </div>
  );

  const sl = (label, key, opts) => (
    <div style={{ marginBottom:13 }}>
      <div style={{ fontSize:12, color:t.muted, marginBottom:5, fontWeight:500 }}>{label}</div>
      <select value={form[key]} onChange={e => set(key, e.target.value)}
        style={{ ...inpStyle, padding:"10px 12px" }}>
        {opts.map(o => <option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:20, padding:"26px 30px", width:"100%", maxWidth:530, maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div style={{ fontSize:17, fontWeight:700, color:t.text }}>{editing ? "✏️ Editar dívida" : "➕ Nova dívida"}</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:24, lineHeight:1, fontFamily:"inherit" }}>×</button>
        </div>

        {valid && (
          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:12, padding:"13px 16px", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{form.creditor}</div>
                <div style={{ fontSize:11, color:t.muted }}>{rem}x restantes · {form.for_}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:17, fontWeight:800, color:"#EF4444" }}>{fmt(totalRem)}</div>
                <div style={{ fontSize:10, color:t.muted }}>total restante</div>
              </div>
            </div>
            <div style={{ height:5, background:t.border, borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:(Number(form.ti)>0 ? Math.round(Number(form.paid)/Number(form.ti)*100) : 0)+"%", background:"#10B981", borderRadius:99 }}/>
            </div>
            <div style={{ fontSize:10, color:t.muted, marginTop:3 }}>{form.paid}/{form.ti} parcelas pagas · {fmt(Number(form.monthly))}/mês</div>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
          <div style={{ gridColumn:"1/-1" }}>{fld("Nome do credor / dívida","creditor","text","Ex: Banco Inter, Renner...",null,true)}</div>

          <CreatableSelect
            label="Categoria"
            value={form.category}
            options={cats}
            defaults={DEFAULT_CATS}
            storageKey="fos-cats"
            onChange={v => set("category", v)}
            onOptionsChange={setCats}
            inpStyle={inpStyle}
            t={t}
          />
          <CreatableSelect
            label="Para quem"
            value={form.for_}
            options={fors}
            defaults={DEFAULT_FORS}
            storageKey="fos-fors"
            onChange={v => set("for_", v)}
            onOptionsChange={setFors}
            inpStyle={inpStyle}
            t={t}
          />

          {fld("💰 Valor da parcela (R$)","monthly","number","0,00","Valor de cada parcela",true)}
          {fld("📅 Total de parcelas","ti","number","12","Quantas parcelas no total",true)}
          {fld("✅ Já pagas","paid","number","0","Parcelas já quitadas")}
          {fld("📆 Dia de vencimento","due","number","10","Dia do mês (1-31)")}
          {sl("Status","status",[{v:"active",l:"Ativa"},{v:"negotiating",l:"Negociando"},{v:"paused",l:"Pausada"},{v:"overdue",l:"Atrasada"}])}
          {sl("Prioridade","priority",["Alta","Média","Baixa"])}
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:t.muted, marginBottom:5, fontWeight:500 }}>Observação</div>
          <textarea value={form.note} onChange={e => set("note", e.target.value)}
            placeholder="Taxa de juros, motivo, observação..."
            style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:`1px solid ${t.border}`, background:t.surface, color:t.text, fontSize:13, outline:"none", resize:"vertical", minHeight:52, fontFamily:"inherit", boxSizing:"border-box" }}/>
        </div>

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"10px 20px", borderRadius:9, border:`1px solid ${t.border}`, cursor:"pointer", fontSize:13, fontWeight:600, background:"transparent", color:t.muted, fontFamily:"inherit" }}>Cancelar</button>
          <button onClick={save} disabled={!valid} style={{ padding:"10px 22px", borderRadius:9, border:"none", cursor:valid?"pointer":"not-allowed", fontSize:13, fontWeight:700, background:valid?"#6366F1":"#333", color:"white", opacity:valid?1:0.5, fontFamily:"inherit" }}>
            {editing ? "✓ Salvar" : "➕ Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
