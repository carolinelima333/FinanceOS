import { useState } from "react";
import { api } from "../lib/api.js";
import { STATUS_CFG, fmt, fmtK, PIE_COLORS } from "../constants.js";
import { Badge }        from "./shared/Badge.jsx";
import { PaymentHistory } from "./shared/PaymentHistory.jsx";
import { AddDebtModal } from "./modals/AddDebtModal.jsx";
import { PayModal }     from "./modals/PayModal.jsx";

export function Dividas({ debts, setDebts, t, showToast }) {
  const [filter,      setFilter]      = useState("all");
  const [filterFor,   setFilterFor]   = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear,  setFilterYear]  = useState("all");
  const [search,      setSearch]      = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [paying,  setPaying]  = useState(null);
  const [viewMode, setViewMode] = useState("list");

  const updateStatus = async (id, status) => {
    try {
      const updated = await api.updateDebt(id, { status });
      setDebts(p => p.map(d => d.id === id ? { ...d, ...updated } : d));
      if (status === "paid") showToast("🎉 Dívida quitada! Movida para o Arquivo.");
      else showToast(`Status: ${STATUS_CFG[status]?.label}`);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const payInstallment = async (debt) => {
    if (debt.rem <= 0) return;
    try {
      const { debt: updated, payment } = await api.payInstallment(debt.id);
      setDebts(p => p.map(d => d.id === debt.id ? { ...d, ...updated } : d));
      const when = new Date(payment.paid_at).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
      if (updated.status === "paid") showToast(`🎉 ${debt.creditor} QUITADA em ${when}! Movida para o Arquivo.`);
      else showToast(`✓ ${payment.installment_number}ª/${debt.ti || (debt.rem + debt.paid)} paga em ${when}! ${updated.rem} restantes`);
      setPaying(null);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const addDebt = async (data) => {
    try {
      const created = await api.createDebt(data);
      setDebts(p => [...p, created]);
      showToast("✓ Dívida adicionada!");
      setShowAdd(false);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const saveEdit = async (data) => {
    try {
      const updated = await api.updateDebt(editing.id, data);
      setDebts(p => p.map(d => d.id === editing.id ? { ...d, ...updated } : d));
      showToast("✓ Atualizada!");
      setEditing(null);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const del = async (id, name) => {
    if (!confirm(`Excluir "${name}"?`)) return;
    try {
      await api.deleteDebt(id);
      setDebts(p => p.filter(d => d.id !== id));
      showToast("Excluída", "info");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const forOptions = ["all", ...Array.from(new Set(debts.map(d => d.for_).filter(Boolean)))];

  // Gera lista de anos disponíveis (do ano mais antigo até o ano mais futuro das dívidas)
  const now = new Date();
  const yearSet = new Set([now.getFullYear()]);
  debts.forEach(d => {
    if (d.created_at) yearSet.add(new Date(d.created_at).getFullYear());
    if (d.created_at && d.ti) {
      const end = new Date(d.created_at);
      end.setMonth(end.getMonth() + Number(d.ti));
      yearSet.add(end.getFullYear());
    }
  });
  const yearOptions = Array.from(yearSet).sort((a, b) => a - b);

  const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  // Verifica se a dívida está ativa no mês/ano selecionado
  const activeInPeriod = (d, year, month) => {
    if (!d.created_at) return true;
    const created  = new Date(d.created_at);
    const start    = new Date(created.getFullYear(), created.getMonth(), 1);
    const ti       = Number(d.ti) || (Number(d.paid) + Number(d.rem));
    const end      = new Date(created.getFullYear(), created.getMonth() + (ti > 0 ? ti - 1 : 0), 1);
    const target   = new Date(year, month - 1, 1);
    return target >= start && target <= end;
  };

  const filtered = debts.filter(d => {
    if (d.status === "paid") return false;
    if (filter === "active"      && !["active","urgent"].includes(d.status)) return false;
    if (filter === "overdue"     && !["overdue","urgent"].includes(d.status)) return false;
    if (filter === "negotiating" && d.status !== "negotiating") return false;
    if (filterFor !== "all"      && d.for_ !== filterFor) return false;
    if (filterYear !== "all" && filterMonth !== "all" && !activeInPeriod(d, Number(filterYear), Number(filterMonth))) return false;
    if (filterYear !== "all" && filterMonth === "all") {
      const y = new Date(d.created_at || Date.now()).getFullYear();
      const endY = (() => { const e = new Date(d.created_at || Date.now()); e.setMonth(e.getMonth() + (Number(d.ti)||0)); return e.getFullYear(); })();
      if (y > Number(filterYear) || endY < Number(filterYear)) return false;
    }
    const q = search.toLowerCase();
    if (q && !d.creditor.toLowerCase().includes(q) && !d.cat.toLowerCase().includes(q)) return false;
    return true;
  });

  const totalVisible = filtered.reduce((s,d) => s + d.total, 0);

  return (
    <div>
      {(showAdd || editing) && (
        <AddDebtModal t={t}
          onSave={editing ? saveEdit : addDebt}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          editing={editing}
        />
      )}
      {paying && (
        <PayModal debt={paying} t={t}
          onPay={() => payInstallment(paying)}
          onClose={() => setPaying(null)}
        />
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, color:t.text, margin:0 }}>Gestão de Dívidas</h2>
          <p style={{ fontSize:13, color:t.muted, margin:"4px 0 0" }}>{filtered.length} dívidas · Total em aberto: {fmt(totalVisible)}</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
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
          <button onClick={() => setShowAdd(true)} style={{
            display:"flex", alignItems:"center", gap:9,
            padding:"12px 24px", borderRadius:12, border:"none", cursor:"pointer",
            background:"linear-gradient(135deg,#6366F1,#4F46E5)",
            color:"white", fontSize:14, fontWeight:700, fontFamily:"inherit",
            boxShadow:"0 4px 20px rgba(99,102,241,0.45)", flexShrink:0,
          }}>
            <span style={{ fontSize:22, lineHeight:1, fontWeight:300 }}>+</span>
            <span>Adicionar dívida</span>
          </button>
        </div>
      </div>

      <div className="filter-bar" style={{ display:"flex", gap:10, alignItems:"center", margin:"18px 0 10px", flexWrap:"wrap" }}>
        <div style={{ display:"flex", background:t.surface, borderRadius:10, padding:3, border:`1px solid ${t.border}` }}>
          {[{id:"all",l:"Todas"},{id:"active",l:"Em aberto"},{id:"overdue",l:"Em atraso"},{id:"negotiating",l:"Negociando"}].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer",
              fontSize:12, fontWeight: filter===f.id ? 600 : 400,
              background: filter===f.id ? t.primary : "transparent",
              color: filter===f.id ? "white" : t.muted,
              fontFamily:"inherit",
            }}>{f.l}</button>
          ))}
        </div>

        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{
          padding:"9px 12px", borderRadius:10, border:`1px solid ${filterMonth !== "all" ? t.primary : t.border}`,
          background: filterMonth !== "all" ? t.primaryDim : t.surface,
          color: filterMonth !== "all" ? t.primary : t.muted,
          fontSize:12, outline:"none", fontFamily:"inherit", cursor:"pointer",
          fontWeight: filterMonth !== "all" ? 600 : 400,
        }}>
          <option value="all">Mês</option>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>

        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{
          padding:"9px 12px", borderRadius:10, border:`1px solid ${filterYear !== "all" ? t.primary : t.border}`,
          background: filterYear !== "all" ? t.primaryDim : t.surface,
          color: filterYear !== "all" ? t.primary : t.muted,
          fontSize:12, outline:"none", fontFamily:"inherit", cursor:"pointer",
          fontWeight: filterYear !== "all" ? 600 : 400,
        }}>
          <option value="all">Ano</option>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {(filterMonth !== "all" || filterYear !== "all") && (
          <button onClick={() => { setFilterMonth("all"); setFilterYear("all"); }} style={{
            padding:"9px 12px", borderRadius:10, border:`1px solid ${t.border}`,
            background:"transparent", color:t.muted, fontSize:12, cursor:"pointer", fontFamily:"inherit",
          }}>✕ Limpar</button>
        )}

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Buscar credor ou categoria..."
          style={{ flex:1, padding:"9px 16px", borderRadius:10, border:`1px solid ${t.border}`, background:t.surface, color:t.text, fontSize:13, outline:"none", minWidth:180, fontFamily:"inherit" }}
        />
      </div>

      {forOptions.length > 2 && (
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:18, flexWrap:"wrap" }}>
          <span style={{ fontSize:11, color:t.muted, fontWeight:500, flexShrink:0 }}>Para quem:</span>
          {forOptions.map(f => {
            const active = f === "all"
              ? debts.filter(d => d.status !== "paid")
              : debts.filter(d => d.for_ === f && d.status !== "paid");
            const total = active.reduce((s, d) => s + (d.monthly || 0), 0);
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
                  {fmt(total)}<span style={{ fontSize:10, fontWeight:400 }}>/mês</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── LISTA ── */}
      {viewMode === "list" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(d => <DebtRow key={d.id} d={d} t={t} setEditing={setEditing} setPaying={setPaying} updateStatus={updateStatus} del={del}/>)}
          {filtered.length === 0 && <EmptyState t={t} onAdd={() => setShowAdd(true)}/>}
        </div>
      )}

      {/* ── CARDS POR PESSOA ── */}
      {viewMode === "group" && (
        <GroupedView filtered={filtered} t={t} setEditing={setEditing} setPaying={setPaying} updateStatus={updateStatus} del={del} onAdd={() => setShowAdd(true)}/>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sub-componente: linha da listagem tradicional
───────────────────────────────────────────────────────────────*/
function DebtRow({ d, t, setEditing, setPaying, updateStatus, del }) {
  const instTotal = d.ti || (d.paid + d.rem);
  const pctPaid   = instTotal > 0 ? Math.round(d.paid / instTotal * 100) : 0;
  const canPay    = d.rem > 0 && d.monthly > 0;
  const bColor    = ["overdue","urgent"].includes(d.status) ? "#EF4444"
                  : d.status === "negotiating" ? "#F59E0B"
                  : "#6366F1";
  return (
    <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:14, padding:"16px 20px", borderLeft:`3px solid ${bColor}` }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:16, alignItems:"start" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:14, fontWeight:700, color:t.text }}>{d.creditor}</span>
            <Badge status={d.status}/>
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:t.primaryDim, color:t.primary, fontWeight:600 }}>{d.for_}</span>
            {d.rem===1 && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:"rgba(16,185,129,0.12)", color:"#10B981", fontWeight:700 }}>Última! 🎉</span>}
          </div>
          <div style={{ fontSize:11, color:t.muted, marginBottom:10 }}>
            {d.cat}{d.due?` · Vence dia ${d.due}`:""}{d.note?` · ${d.note}`:""}
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
              <span style={{ fontSize:11, color:t.muted, fontWeight:500 }}>
                {d.paid} de {instTotal} parcelas pagas
                {d.rem > 0 && <span style={{ color:"#F59E0B", marginLeft:8 }}>· {d.rem} restantes</span>}
              </span>
              <span style={{ fontSize:12, fontWeight:700, color:pctPaid>70?"#10B981":pctPaid>30?"#F59E0B":t.muted }}>{pctPaid}%</span>
            </div>
            <div style={{ height:8, background:t.border, borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:pctPaid+"%", background:pctPaid>70?"#10B981":pctPaid>30?"#F59E0B":"#6366F1", borderRadius:99, transition:"width 0.5s ease" }}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {d.monthly > 0 && <div><div style={{ fontSize:10, color:t.muted }}>Parcela mensal</div><div style={{ fontSize:16, fontWeight:700, color:t.text }}>{fmt(d.monthly)}</div></div>}
            <div><div style={{ fontSize:10, color:t.muted }}>Total restante</div><div style={{ fontSize:16, fontWeight:700, color:"#EF4444" }}>{fmt(d.total)}</div></div>
            {d.paid > 0 && d.monthly > 0 && <div><div style={{ fontSize:10, color:t.muted }}>Já quitado</div><div style={{ fontSize:16, fontWeight:700, color:"#10B981" }}>{fmt(d.paid * d.monthly)}</div></div>}
          </div>
        </div>
        <div className="debt-actions" style={{ display:"flex", flexDirection:"column", gap:7, alignItems:"flex-end", flexShrink:0 }}>
          {canPay && (
            <button onClick={() => setPaying(d)} style={{ padding:"10px 18px", borderRadius:10, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#10B981,#059669)", color:"white", fontSize:13, fontWeight:700, fontFamily:"inherit", whiteSpace:"nowrap", boxShadow:"0 2px 14px rgba(16,185,129,0.3)" }}>
              💰 Pagar parcela
            </button>
          )}
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"flex-end" }}>
            <button onClick={() => setEditing(d)} style={{ padding:"5px 10px", borderRadius:7, border:`1px solid ${t.border}`, cursor:"pointer", fontSize:11, background:"transparent", color:t.muted, fontFamily:"inherit" }}>✏️ Editar</button>
            <button onClick={() => updateStatus(d.id,"negotiating")} style={{ padding:"5px 10px", borderRadius:7, border:"none", cursor:"pointer", fontSize:11, background:"rgba(245,158,11,0.1)", color:"#F59E0B", fontFamily:"inherit" }}>⟳ Negociar</button>
            <button onClick={() => updateStatus(d.id,"paid")} style={{ padding:"5px 10px", borderRadius:7, border:"none", cursor:"pointer", fontSize:11, background:"rgba(16,185,129,0.1)", color:"#10B981", fontFamily:"inherit" }}>✓ Quitar</button>
            <button onClick={() => del(d.id, d.creditor)} style={{ padding:"5px 10px", borderRadius:7, border:"none", cursor:"pointer", fontSize:11, background:"rgba(239,68,68,0.1)", color:"#EF4444", fontFamily:"inherit" }}>🗑</button>
          </div>
        </div>
      </div>
      {d.paid > 0 && (
        <div style={{ marginTop:12 }}>
          <PaymentHistory debtId={d.id} t={t} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sub-componente: estado vazio
───────────────────────────────────────────────────────────────*/
function EmptyState({ t, onAdd }) {
  return (
    <div style={{ padding:"48px", textAlign:"center", color:t.muted, fontSize:14, background:t.card, border:`1px solid ${t.border}`, borderRadius:14 }}>
      <div>Nenhuma dívida encontrada.</div>
      <button onClick={onAdd} style={{ marginTop:14, padding:"10px 20px", borderRadius:9, border:"none", cursor:"pointer", fontSize:13, fontWeight:700, background:"#6366F1", color:"white", fontFamily:"inherit" }}>＋ Adicionar dívida</button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sub-componente: visualização agrupada por pessoa
───────────────────────────────────────────────────────────────*/
const GROUP_COLORS = ["#6366F1","#10B981","#F59E0B","#0EA5E9","#EC4899","#8B5CF6","#EF4444"];

function GroupedView({ filtered, t, setEditing, setPaying, updateStatus, del, onAdd }) {
  if (filtered.length === 0) return <EmptyState t={t} onAdd={onAdd}/>;

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
        const items      = map[person];
        const accent     = GROUP_COLORS[gi % GROUP_COLORS.length];
        const monthlySum = items.reduce((s,d) => s + (d.monthly||0), 0);
        const totalSum   = items.reduce((s,d) => s + (d.total||0), 0);

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
                    {items.length} dívida{items.length!==1?"s":""}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:24 }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10, color:t.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.5px" }}>Parcela mensal</div>
                  <div style={{ fontSize:18, fontWeight:800, color:accent }}>{fmt(monthlySum)}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10, color:t.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.5px" }}>Total em aberto</div>
                  <div style={{ fontSize:18, fontWeight:800, color:"#EF4444" }}>{fmt(totalSum)}</div>
                </div>
              </div>
            </div>

            {/* Grid de cards de dívida */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:12 }}>
              {items.map(d => (
                <PersonDebtCard key={d.id} d={d} t={t} accent={accent}
                  setEditing={setEditing} setPaying={setPaying}
                  updateStatus={updateStatus} del={del}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sub-componente: card compact dentro do grupo
───────────────────────────────────────────────────────────────*/
function PersonDebtCard({ d, t, accent, setEditing, setPaying, updateStatus, del }) {
  const instTotal = d.ti || (d.paid + d.rem);
  const pctPaid   = instTotal > 0 ? Math.round(d.paid / instTotal * 100) : 0;
  const canPay    = d.rem > 0 && d.monthly > 0;
  const barColor  = pctPaid > 70 ? "#10B981" : pctPaid > 30 ? "#F59E0B" : accent;

  return (
    <div style={{
      background:t.card, border:`1px solid ${t.border}`,
      borderRadius:14, padding:"16px", display:"flex", flexDirection:"column", gap:12,
      borderTop:`3px solid ${["overdue","urgent"].includes(d.status) ? "#EF4444" : accent}`,
    }}>
      {/* Topo: nome + badges */}
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:4 }}>
          <span style={{ fontSize:14, fontWeight:700, color:t.text, flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {d.creditor}
          </span>
          <Badge status={d.status}/>
          {d.rem===1 && <span style={{ fontSize:10, padding:"2px 6px", borderRadius:20, background:"rgba(16,185,129,0.12)", color:"#10B981", fontWeight:700, flexShrink:0 }}>🎉 Última!</span>}
        </div>
        <div style={{ fontSize:11, color:t.muted }}>
          {d.cat}{d.due ? ` · Vence dia ${d.due}` : ""}{d.note ? ` · ${d.note}` : ""}
        </div>
      </div>

      {/* Barra de progresso */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:11, color:t.muted }}>
            {d.paid}/{instTotal} parcelas
            {d.rem > 0 && <span style={{ color:"#F59E0B", marginLeft:6 }}>· {d.rem} restantes</span>}
          </span>
          <span style={{ fontSize:11, fontWeight:700, color:barColor }}>{pctPaid}%</span>
        </div>
        <div style={{ height:7, background:t.border, borderRadius:99, overflow:"hidden" }}>
          <div style={{ height:"100%", width:pctPaid+"%", background:barColor, borderRadius:99, transition:"width 0.5s ease" }}/>
        </div>
      </div>

      {/* Valores */}
      <div style={{ display:"flex", gap:12 }}>
        {d.monthly > 0 && (
          <div style={{ flex:1, padding:"8px 10px", borderRadius:9, background:t.surface, border:`1px solid ${t.border}` }}>
            <div style={{ fontSize:9, color:t.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.4px" }}>Parcela</div>
            <div style={{ fontSize:14, fontWeight:700, color:t.text, marginTop:2 }}>{fmt(d.monthly)}</div>
          </div>
        )}
        <div style={{ flex:1, padding:"8px 10px", borderRadius:9, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.15)" }}>
          <div style={{ fontSize:9, color:t.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.4px" }}>Restante</div>
          <div style={{ fontSize:14, fontWeight:700, color:"#EF4444", marginTop:2 }}>{fmt(d.total)}</div>
        </div>
      </div>

      {/* Ações */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {canPay && (
          <button onClick={() => setPaying(d)} style={{ flex:1, padding:"8px 10px", borderRadius:9, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#10B981,#059669)", color:"white", fontSize:12, fontWeight:700, fontFamily:"inherit", whiteSpace:"nowrap", boxShadow:"0 2px 10px rgba(16,185,129,0.25)" }}>
            💰 Pagar
          </button>
        )}
        <button onClick={() => setEditing(d)} style={{ padding:"8px 10px", borderRadius:9, border:`1px solid ${t.border}`, cursor:"pointer", fontSize:12, background:"transparent", color:t.muted, fontFamily:"inherit" }}>✏️</button>
        <button onClick={() => updateStatus(d.id,"negotiating")} style={{ padding:"8px 10px", borderRadius:9, border:"none", cursor:"pointer", fontSize:12, background:"rgba(245,158,11,0.1)", color:"#F59E0B", fontFamily:"inherit" }}>⟳</button>
        <button onClick={() => updateStatus(d.id,"paid")} style={{ padding:"8px 10px", borderRadius:9, border:"none", cursor:"pointer", fontSize:12, background:"rgba(16,185,129,0.1)", color:"#10B981", fontFamily:"inherit" }}>✓</button>
        <button onClick={() => del(d.id, d.creditor)} style={{ padding:"8px 10px", borderRadius:9, border:"none", cursor:"pointer", fontSize:12, background:"rgba(239,68,68,0.1)", color:"#EF4444", fontFamily:"inherit" }}>🗑</button>
      </div>
    </div>
  );
}
