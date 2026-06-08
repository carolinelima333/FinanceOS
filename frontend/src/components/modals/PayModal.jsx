import { fmt } from "../../constants.js";

export function PayModal({ debt, t, onPay, onClose }) {
  const instTotal = debt.ti || (debt.paid + debt.rem);
  const nextNum   = debt.paid + 1;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:20, padding:"28px 32px", width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:44, marginBottom:10 }}>💰</div>
          <div style={{ fontSize:17, fontWeight:700, color:t.text, marginBottom:4 }}>Confirmar pagamento</div>
          <div style={{ fontSize:13, color:t.muted }}>Registrar {nextNum}ª de {instTotal} parcelas</div>
        </div>

        <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:13, padding:"16px 18px", marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:12 }}>{debt.creditor}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            <div style={{ textAlign:"center", background:t.card, borderRadius:9, padding:"11px" }}>
              <div style={{ fontSize:18, fontWeight:800, color:"#10B981" }}>{fmt(debt.monthly)}</div>
              <div style={{ fontSize:10, color:t.muted, marginTop:2 }}>Valor da parcela</div>
            </div>
            <div style={{ textAlign:"center", background:t.card, borderRadius:9, padding:"11px" }}>
              <div style={{ fontSize:18, fontWeight:800, color:t.text }}>{nextNum}ª/{instTotal}</div>
              <div style={{ fontSize:10, color:t.muted, marginTop:2 }}>Número da parcela</div>
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:t.muted, marginBottom:4 }}>
              <span>Progresso atual</span>
              <span>{debt.paid}/{instTotal} pagas ({Math.round(debt.paid/instTotal*100)}%)</span>
            </div>
            <div style={{ height:7, background:t.border, borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:Math.round(debt.paid/instTotal*100)+"%", background:"#10B981", borderRadius:99 }}/>
            </div>
          </div>
          <div style={{ paddingTop:10, borderTop:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, color:t.muted }}>Saldo após pagamento</span>
            <span style={{ fontSize:13, fontWeight:700, color:debt.rem<=1?"#10B981":"#EF4444" }}>
              {fmt(Math.max(0, debt.total - debt.monthly))}
            </span>
          </div>
        </div>

        {debt.rem === 1 && (
          <div style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:9, padding:"9px 14px", marginBottom:14, textAlign:"center" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#10B981" }}>🎉 Última parcela! A dívida será quitada.</div>
          </div>
        )}

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"11px", borderRadius:10, border:`1px solid ${t.border}`, cursor:"pointer", fontSize:13, fontWeight:600, background:"transparent", color:t.muted, fontFamily:"inherit" }}>Cancelar</button>
          <button onClick={onPay} style={{ flex:2, padding:"11px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:700, background:"linear-gradient(135deg,#10B981,#059669)", color:"white", fontFamily:"inherit" }}>
            ✓ Confirmar pagamento
          </button>
        </div>
      </div>
    </div>
  );
}
