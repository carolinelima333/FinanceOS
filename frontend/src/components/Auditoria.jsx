import { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { SectionTitle } from "./shared/SectionTitle.jsx";

const ACTION_CFG = {
  CRIAR:   { icon:"➕", color:"#10B981", bg:"rgba(16,185,129,0.12)",  label:"Criado"    },
  EDITAR:  { icon:"✏️", color:"#6366F1", bg:"rgba(99,102,241,0.12)",  label:"Editado"   },
  EXCLUIR: { icon:"🗑️", color:"#EF4444", bg:"rgba(239,68,68,0.12)",   label:"Excluído"  },
  SALARIO: { icon:"💰", color:"#F59E0B", bg:"rgba(245,158,11,0.12)",  label:"Salário"   },
  RESERVA: { icon:"🏦", color:"#0EA5E9", bg:"rgba(14,165,233,0.12)",  label:"Reserva"   },
};

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

export function Auditoria({ t }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState("TODOS");

  useEffect(() => {
    api.getAudit(200)
      .then(setLogs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filters = ["TODOS","CRIAR","EDITAR","EXCLUIR","SALARIO","RESERVA"];
  const visible = filter === "TODOS" ? logs : logs.filter(l => l.action === filter);

  const counts = {};
  logs.forEach(l => { counts[l.action] = (counts[l.action] || 0) + 1; });

  return (
    <div>
      <SectionTitle title="Auditoria" sub="Histórico completo de todas as alterações" t={t} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:22 }}>
        {Object.entries(ACTION_CFG).map(([key, cfg]) => (
          <div key={key} style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:12, padding:"14px 16px", borderTop:`2px solid ${cfg.color}` }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{cfg.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color:cfg.color }}>{counts[key] || 0}</div>
            <div style={{ fontSize:11, color:t.muted }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:"7px 16px", borderRadius:20, border:`1px solid ${filter===f ? t.primary : t.border}`,
            background: filter===f ? t.primaryDim : "transparent",
            color: filter===f ? t.primary : t.muted,
            fontSize:12, fontWeight: filter===f ? 600 : 400,
            cursor:"pointer", fontFamily:"inherit",
          }}>
            {f === "TODOS" ? `Todos (${logs.length})` : `${ACTION_CFG[f]?.icon} ${ACTION_CFG[f]?.label} (${counts[f]||0})`}
          </button>
        ))}
      </div>

      <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:16, overflow:"hidden" }}>
        {loading && (
          <div style={{ padding:40, textAlign:"center", color:t.muted, fontSize:13 }}>Carregando histórico...</div>
        )}
        {error && (
          <div style={{ padding:40, textAlign:"center", color:"#EF4444", fontSize:13 }}>
            Erro ao carregar auditoria. Execute o SQL de migração no Supabase primeiro.
          </div>
        )}
        {!loading && !error && visible.length === 0 && (
          <div style={{ padding:40, textAlign:"center", color:t.muted, fontSize:13 }}>
            Nenhuma atividade registrada ainda.
          </div>
        )}
        {!loading && !error && visible.map((log, i) => {
          const cfg = ACTION_CFG[log.action] || { icon:"·", color:t.muted, bg:t.surface, label:log.action };
          return (
            <div key={log.id} style={{
              display:"flex", gap:14, padding:"14px 20px",
              borderBottom: i < visible.length - 1 ? `1px solid ${t.border}` : "none",
              alignItems:"flex-start",
            }}>
              <div style={{
                width:36, height:36, borderRadius:"50%", background:cfg.bg,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:16, flexShrink:0,
              }}>
                {cfg.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                  <div style={{ fontSize:13, color:t.text, fontWeight:500, lineHeight:1.4 }}>{log.description}</div>
                  <span style={{
                    fontSize:10, padding:"2px 8px", borderRadius:20,
                    background:cfg.bg, color:cfg.color, fontWeight:600,
                    whiteSpace:"nowrap", flexShrink:0,
                  }}>{cfg.label}</span>
                </div>
                <div style={{ fontSize:11, color:t.muted, marginTop:3 }}>{fmtDate(log.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
