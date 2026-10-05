import { useState } from "react";
import { api } from "../lib/api.js";
import { fmt } from "../constants.js";
import { Badge } from "./shared/Badge.jsx";
import { PaymentHistory } from "./shared/PaymentHistory.jsx";

export function Arquivo({ debts, setDebts, t, showToast }) {
  const [search,    setSearch]    = useState("");
  const [filterFor, setFilterFor] = useState("all");
  const [viewMode,  setViewMode]  = useState("list");

  const archived   = debts.filter(d => d.status === "paid");
  const forOptions = ["all", ...Array.from(new Set(archived.map(d => d.for_).filter(Boolean)))];

  const filtered = archived.filter(d => {
    if (filterFor !== "all" && d.for_ !== filterFor) return false;
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
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, color:t.text, margin:0 }}>Arquivo</h2>
          <p style={{ fontSize:13, color:t.muted, margin:"4px 0 0" }}>
            {filtered.length} dívida{filtered.length !== 1 ? "s" : ""} quitada{filtered.length !== 1 ? "s" : ""} · Total pago: {fmt(totalQuitado)}
          </p>
        </div>
        <div style={{ display:"flex", background:t.surface, borderRadius:10, padding:3, border:`1px solid ${t.border}` }}>
          <button onClick={() => setViewMode("list")} title="Visualização em lista" style={{
            padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer",
            fontSize:13, fontWeight: viewMode==="list" ? 700 : 400,
            background: viewMode==="list" ? t.primary : "transparent",
            color: viewMode==="list" ? "white" : t.muted,
            fontFamily:"inherit", display:"flex", alignItems:"center", gap:5,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="1" width="14" height="2" rx="1"/><rect x="0" y="6" width="14" height="2" rx="1"/><rect x="0" y="11" width="14" height="2" rx="1"/></svg>
            Lista
          </button>
          <button onClick={() => setViewMode("group")} title="Visualização por pessoa" style={{
            padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer",
            fontSize:13, fontWeight: viewMode==="group" ? 700 : 400,
            background: viewMode==="group" ? t.primary : "transparent",
            color: viewMode==="group" ? "white" : t.muted,
            fontFamily:"inherit", display:"flex", alignItems:"center", gap:5,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="0" width="6" height="6" rx="1.5"/><rect x="8" y="0" width="6" height="6" rx="1.5"/><rect x="0" y="8" width="6" height="6" rx="1.5"/><rect x="8" y="8" width="6" height="6" rx="1.5"/></svg>
            Por pessoa
          </button>
        </div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍  Buscar credor ou categoria..."
        style={{ width:"100%", padding:"9px 16px", borderRadius:10, border:`1px solid ${t.border}`, background:t.surface, color:t.text, fontSize:13, outline:"none", fontFamily:"inherit", marginBottom:16, boxSizing:"border-box" }}
      />

      {forOptions.length > 2 && (
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:18, flexWrap:"wrap" }}>
          <span style={{ fontSize:11, color:t.muted, fontWeight:500, flexShrink:0 }}>Para quem:</span>
          {forOptions.map(f => {
            const items = f === "all" ? archived : archived.filter(d => d.for_ === f);
            const total = items.reduce((s, d) => s + (d.paid || 0) * (d.monthly || 0), 0);
            const isActive = filterFor === f;
            return (
              <button key={f} onClick={() => setFilterFor(f)} style={{
                padding:"6px 14px 7px", borderRadius:10,
                border:`1px solid ${isActive ? t.primary : t.border}`,
                background: isActive ? t.primaryDim : t.surface,
                color: isActive ? t.primary : t.muted,
                cursor:"pointer", fontFamily:"inherit",
                textAlign:"left", lineHeight:1.3,
              }}>
                <div style={{ fontSize:12, fontWeight: isActive ? 700 : 500 }}>
                  {f === "all" ? "Todos" : f}
                </div>
                <div style={{ fontSize:11, color: isActive ? t.primary : t.muted, fontWeight:600 }}>
                  {fmt(total)}<span style={{ fontSize:10, fontWeight:400 }}> pago</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding:"48px", textAlign:"center", color:t.muted, fontSize:14, background:t.card, border:`1px solid ${t.border}`, borderRadius:14 }}>
          Nenhuma dívida quitada até o momento.
        </div>
      ) : viewMode === "list" ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(d => <ArchivedRow key={d.id} d={d} t={t} reactivate={reactivate} del={del} />)}
        </div>
      ) : (
        <GroupedView filtered={filtered} t={t} reactivate={reactivate} del={del} />
      )}
    </div>
  );
}

function ArchivedRow({ d, t, reactivate, del }) {
  const instTotal = d.ti || (d.paid + d.rem);
  return (
    <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:14, padding:"16px 20px", borderLeft:"3px solid #10B981", opacity:0.85 }}>
      <div className="row-card-grid" style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:16, alignItems:"start" }}>
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

/* ─────────────────────────────────────────────────────────────
   Sub-componente: visualização agrupada por pessoa
───────────────────────────────────────────────────────────────*/
const GROUP_COLORS = ["#6366F1","#10B981","#F59E0B","#0EA5E9","#EC4899","#8B5CF6","#EF4444"];

function GroupedView({ filtered, t, reactivate, del }) {
  // Agrupa dívidas por titular (for_), mantendo a ordem de primeira aparição
  const order = [];
  const map = {};
  filtered.forEach(d => {
    const key = d.for_ || "Sem titular";
    if (!map[key]) { map[key] = []; order.push(key); }
    map[key].push(d);
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
      {order.map((person, gi) => {
        const items   = map[person];
        const accent  = GROUP_COLORS[gi % GROUP_COLORS.length];
        const instSum = items.reduce((s,d) => s + (d.paid||0), 0);
        const paidSum = items.reduce((s,d) => s + (d.paid||0) * (d.monthly||0), 0);

        return (
          <div key={person}>
            {/* Cabeçalho do grupo */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              flexWrap:"wrap", gap:10, marginBottom:14,
              padding:"14px 20px", borderRadius:14,
              background:`${accent}14`,
              border:`1px solid ${accent}30`,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{
                  width:38, height:38, borderRadius:"50%",
                  background:`${accent}22`, border:`2px solid ${accent}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:16, fontWeight:800, color:accent,
                }}>
                  {person.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:t.text }}>{person}</div>
                  <div style={{ fontSize:12, color:t.muted, marginTop:2 }}>
                    {items.length} dívida{items.length!==1?"s":""} quitada{items.length!==1?"s":""}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:24 }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10, color:t.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.5px" }}>Parcelas pagas</div>
                  <div style={{ fontSize:18, fontWeight:800, color:accent }}>{instSum}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10, color:t.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.5px" }}>Total quitado</div>
                  <div style={{ fontSize:18, fontWeight:800, color:"#10B981" }}>{fmt(paidSum)}</div>
                </div>
              </div>
            </div>

            {/* Grid de cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:12 }}>
              {items.map(d => (
                <PersonArchivedCard key={d.id} d={d} t={t} accent={accent} reactivate={reactivate} del={del} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sub-componente: card compacto dentro do grupo
───────────────────────────────────────────────────────────────*/
function PersonArchivedCard({ d, t, accent, reactivate, del }) {
  const instTotal = d.ti || (d.paid + d.rem);
  return (
    <div style={{
      background:t.card, border:`1px solid ${t.border}`,
      borderRadius:14, padding:"16px", display:"flex", flexDirection:"column", gap:12,
      borderTop:`3px solid ${accent}`, opacity:0.9,
    }}>
      {/* Topo: nome + badge */}
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:4 }}>
          <span style={{ fontSize:14, fontWeight:700, color:t.muted, textDecoration:"line-through", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {d.creditor}
          </span>
          <Badge status={d.status}/>
        </div>
        <div style={{ fontSize:11, color:t.muted }}>
          {d.cat}{d.note ? ` · ${d.note}` : ""}
        </div>
      </div>

      {/* Valores */}
      <div style={{ display:"flex", gap:12 }}>
        <div style={{ flex:1, padding:"8px 10px", borderRadius:9, background:t.surface, border:`1px solid ${t.border}` }}>
          <div style={{ fontSize:9, color:t.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.4px" }}>Parcelas</div>
          <div style={{ fontSize:14, fontWeight:700, color:t.text, marginTop:2 }}>{d.paid} de {instTotal}</div>
        </div>
        <div style={{ flex:1, padding:"8px 10px", borderRadius:9, background:"rgba(16,185,129,0.07)", border:"1px solid rgba(16,185,129,0.15)" }}>
          <div style={{ fontSize:9, color:t.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.4px" }}>Quitado</div>
          <div style={{ fontSize:14, fontWeight:700, color:"#10B981", marginTop:2 }}>{fmt((d.paid || 0) * (d.monthly || 0))}</div>
        </div>
      </div>

      {/* Ações */}
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={() => reactivate(d)} title="Reabrir na Gestão de Dívidas" style={{ flex:1, padding:"8px 10px", borderRadius:9, border:`1px solid ${t.border}`, cursor:"pointer", fontSize:12, background:"transparent", color:t.muted, fontFamily:"inherit", whiteSpace:"nowrap" }}>↩ Reabrir</button>
        <button onClick={() => del(d.id, d.creditor)} style={{ padding:"8px 10px", borderRadius:9, border:"none", cursor:"pointer", fontSize:12, background:"rgba(239,68,68,0.1)", color:"#EF4444", fontFamily:"inherit" }}>🗑</button>
      </div>

      <PaymentHistory debtId={d.id} t={t} />
    </div>
  );
}
