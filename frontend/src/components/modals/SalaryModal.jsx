import { useState } from "react";
import { fmt } from "../../constants.js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function SalaryModal({ t, salary, cashBalance, effectiveDate, onSave, onClose }) {
  const [s,    setS]    = useState(salary || "");
  const [c,    setC]    = useState(cashBalance || "");
  const [date, setDate] = useState(effectiveDate || todayISO());

  const inpStyle = {
    width:"100%", padding:"12px 14px", borderRadius:10,
    border:`1px solid ${t.border}`, background:t.surface, color:t.text,
    fontSize:15, fontWeight:600, outline:"none", boxSizing:"border-box", fontFamily:"inherit",
  };

  const save = () => {
    onSave(Number(s) || 0, Number(c) || 0, date || todayISO());
  };

  const fmtDateBR = iso => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:20, padding:32, width:"100%", maxWidth:440, boxShadow:"0 24px 64px rgba(0,0,0,0.4)" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:t.text }}>Configurar valores</div>
            <div style={{ fontSize:12, color:t.muted, marginTop:2 }}>Salário, reserva e data de vigência</div>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:t.muted, fontSize:20, cursor:"pointer", lineHeight:1, padding:4 }}>×</button>
        </div>

        {/* Data de vigência */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:12, color:t.muted, marginBottom:6, fontWeight:500 }}>📅 Data de vigência</div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...inpStyle, fontSize:14, colorScheme: "dark" }}
          />
          <div style={{ fontSize:11, color:t.muted, marginTop:4 }}>A partir de quando esses valores são válidos</div>
        </div>

        {/* Salário */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:12, color:t.muted, marginBottom:6, fontWeight:500 }}>💰 Salário mensal líquido (R$)</div>
          <input
            type="number" min="0" step="0.01"
            value={s} onChange={e => setS(e.target.value)}
            placeholder="Ex: 4600"
            style={inpStyle}
          />
          <div style={{ fontSize:11, color:t.muted, marginTop:4 }}>Usado para calcular comprometimento de renda</div>
        </div>

        {/* Caixa */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, color:t.muted, marginBottom:6, fontWeight:500 }}>🏦 Valor em caixa / reserva (R$)</div>
          <input
            type="number" min="0" step="0.01"
            value={c} onChange={e => setC(e.target.value)}
            placeholder="Ex: 1500"
            style={inpStyle}
          />
          <div style={{ fontSize:11, color:t.muted, marginTop:4 }}>Saldo disponível atual (poupança, conta, etc.)</div>
        </div>

        {/* Preview */}
        {(Number(s) > 0 || Number(c) > 0) && (
          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 16px", marginBottom:20 }}>
            <div style={{ fontSize:11, color:t.muted, marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>Resumo</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 20px" }}>
              {date && <div style={{ fontSize:12, color:t.muted }}>Vigência: <strong style={{ color:t.text }}>{fmtDateBR(date)}</strong></div>}
              {Number(s) > 0 && <div style={{ fontSize:12, color:t.muted }}>Salário: <strong style={{ color:t.text }}>{fmt(Number(s))}</strong></div>}
              {Number(c) > 0 && <div style={{ fontSize:12, color:t.muted }}>Em caixa: <strong style={{ color:"#10B981" }}>{fmt(Number(c))}</strong></div>}
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"11px 0", borderRadius:10, border:`1px solid ${t.border}`, background:"transparent", color:t.muted, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            Cancelar
          </button>
          <button onClick={save} style={{ flex:2, padding:"11px 0", borderRadius:10, border:"none", background:t.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
