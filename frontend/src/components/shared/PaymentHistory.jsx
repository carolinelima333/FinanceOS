import { useState } from "react";
import { api } from "../../lib/api.js";
import { fmt } from "../../constants.js";

const fmtWhen = iso => new Date(iso).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });

export function PaymentHistory({ debtId, t }) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [payments, setPayments] = useState(null);

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (payments !== null) return;
    setLoading(true);
    try {
      setPayments(await api.getDebtPayments(debtId));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={toggle} style={{
        padding:"5px 10px", borderRadius:7, border:`1px solid ${t.border}`, cursor:"pointer",
        fontSize:11, background:"transparent", color:t.muted, fontFamily:"inherit",
      }}>
        🕒 {open ? "Ocultar" : "Ver"} histórico de pagamentos
      </button>

      {open && (
        <div style={{ marginTop:10, background:t.surface, border:`1px solid ${t.border}`, borderRadius:10, padding:"10px 14px" }}>
          {loading && <div style={{ fontSize:12, color:t.muted }}>Carregando...</div>}
          {error && <div style={{ fontSize:12, color:"#EF4444" }}>{error}</div>}
          {!loading && !error && payments?.length === 0 && (
            <div style={{ fontSize:12, color:t.muted }}>Nenhuma parcela paga registrada ainda.</div>
          )}
          {!loading && !error && payments?.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {payments.map(p => (
                <div key={p.id} style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                  <span style={{ color:t.text }}>Parcela {p.installment_number}</span>
                  <span style={{ color:t.muted }}>{fmtWhen(p.paid_at)}</span>
                  <span style={{ color:"#10B981", fontWeight:600 }}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
