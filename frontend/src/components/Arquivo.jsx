import { useState } from "react";
import { api } from "../lib/api.js";
import { fmt } from "../constants.js";
import { Badge } from "./shared/Badge.jsx";
import { PaymentHistory } from "./shared/PaymentHistory.jsx";

export function Arquivo({ debts, setDebts, t, showToast }) {
  const [search, setSearch] = useState("");

  const archived = debts.filter(d => d.status === "paid");

  const filtered = archived.filter(d => {
    const q = search.toLowerCase();
    if (q && !d.creditor.toLowerCase().includes(q) && !d.cat.toLowerCase().includes(q)) return false;
    return true;
  });

  const totalQuitado = filtered.reduce((s, d) => s + (d.paid || 0) * (d.monthly || 0), 0);

  const reactivate = async (d) => {
    try {
      const updated = await api.updateDebt(d.id, { status: "active" });
      setDebts(p => p.map(x => x.id === d.id ? { ...x, ...updated } : x));
      showToast(`↩ ${d.creditor} reaberta na Gestão de Dívidas`, "info");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const del = async (id, name) => {
    if (!confirm(`Excluir definitivamente "${name}" do arquivo?`)) return;
    try {
      await api.deleteDebt(id);
      setDebts(p => p.filter(d => d.id !== id));
      showToast("Excluída", "info");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  return (
    <div>
      <div style={{ marginBottom:18 }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:t.text, margin:0 }}>Arquivo</h2>
        <p style={{ fontSize:13, color:t.muted, margin:"4px 0 0" }}>
          {filtered.length} dívida{filtered.length !== 1 ? "s" : ""} quitada{filtered.length !== 1 ? "s" : ""} · Total pago: {fmt(totalQuitado)}
        </p>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍  Buscar credor ou categoria..."
        style={{ width:"100%", padding:"9px 16px", borderRadius:10, border:`1px solid ${t.border}`, background:t.surface, color:t.text, fontSize:13, outline:"none", fontFamily:"inherit", marginBottom:16, boxSizing:"border-box" }}
      />

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map(d => <ArchivedRow key={d.id} d={d} t={t} reactivate={reactivate} del={del} />)}
        {filtered.length === 0 && (
          <div style={{ padding:"48px", textAlign:"center", color:t.muted, fontSize:14, background:t.card, border:`1px solid ${t.border}`, borderRadius:14 }}>
            Nenhuma dívida quitada até o momento.
          </div>
        )}
      </div>
    </div>
  );
}

function ArchivedRow({ d, t, reactivate, del }) {
  const instTotal = d.ti || (d.paid + d.rem);
  return (
    <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:14, padding:"16px 20px", borderLeft:"3px solid #10B981", opacity:0.85 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:16, alignItems:"start" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:14, fontWeight:700, color:t.muted, textDecoration:"line-through" }}>{d.creditor}</span>
            <Badge status={d.status}/>
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:t.primaryDim, color:t.primary, fontWeight:600 }}>{d.for_}</span>
          </div>
          <div style={{ fontSize:11, color:t.muted, marginBottom:10 }}>
            {d.cat}{d.note ? ` · ${d.note}` : ""}
          </div>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            <div><div style={{ fontSize:10, color:t.muted }}>Parcelas quitadas</div><div style={{ fontSize:16, fontWeight:700, color:t.text }}>{d.paid} de {instTotal}</div></div>
            {d.monthly > 0 && <div><div style={{ fontSize:10, color:t.muted }}>Valor da parcela</div><div style={{ fontSize:16, fontWeight:700, color:t.text }}>{fmt(d.monthly)}</div></div>}
            <div><div style={{ fontSize:10, color:t.muted }}>Total quitado</div><div style={{ fontSize:16, fontWeight:700, color:"#10B981" }}>{fmt((d.paid || 0) * (d.monthly || 0))}</div></div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          <button onClick={() => reactivate(d)} title="Reabrir na Gestão de Dívidas" style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${t.border}`, cursor:"pointer", fontSize:11, background:"transparent", color:t.muted, fontFamily:"inherit", whiteSpace:"nowrap" }}>↩ Reabrir</button>
          <button onClick={() => del(d.id, d.creditor)} style={{ padding:"7px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:11, background:"rgba(239,68,68,0.1)", color:"#EF4444", fontFamily:"inherit" }}>🗑</button>
        </div>
      </div>
      <div style={{ marginTop:12 }}>
        <PaymentHistory debtId={d.id} t={t} />
      </div>
    </div>
  );
}
