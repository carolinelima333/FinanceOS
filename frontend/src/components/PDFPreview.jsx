import { useEffect } from "react";
import { createPortal } from "react-dom";

const fR = n => `R$ ${Number(n).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const stLabel = { active:"Ativa", urgent:"Urgente", overdue:"Atrasada", negotiating:"Negociando", paused:"Pausada", paid:"Quitada" };
const stColor = { active:"#0EA5E9", urgent:"#EF4444", overdue:"#EF4444", negotiating:"#F59E0B", paused:"#8B5CF6", paid:"#10B981" };

export function PDFPreview({ debts, onClose, salary = 0 }) {
  const active = debts.filter(d => d.status !== "paid");
  const paid   = debts.filter(d => d.status === "paid");
  const totalD = active.reduce((s,d) => s + d.total,   0);
  const totalM = active.reduce((s,d) => s + d.monthly, 0);
  const date   = new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "pdf-print-css";
    s.textContent = `
      @media print {
        body > *:not(#pdf-root) { display: none !important; }
        #pdf-root { position: static !important; overflow: visible !important; height: auto !important; background: white !important; }
        #pdf-root .no-print { display: none !important; }
        #pdf-root .pdf-content { padding: 0 !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
    `;
    document.head.appendChild(s);
    return () => { document.getElementById("pdf-print-css")?.remove(); };
  }, []);

  const col = (bg, label, val) => (
    <div style={{ background:bg, border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 16px", flex:1 }}>
      <div style={{ fontSize:18, fontWeight:800, color:"#0f172a", marginBottom:2 }}>{val}</div>
      <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
    </div>
  );

  const content = (
    <div
      id="pdf-root"
      style={{ position:"fixed", inset:0, zIndex:3000, background:"white", overflow:"auto" }}
    >
      {/* Barra de ações — oculta na impressão */}
      <div className="no-print" style={{
        position:"sticky", top:0, background:"white", borderBottom:"2px solid #6366F1",
        padding:"12px 32px", display:"flex", alignItems:"center", justifyContent:"space-between",
        gap:12, zIndex:10,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {/* Ícone SVG inline da marca */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width={30} height={30} style={{ borderRadius:6 }}>
            <defs>
              <linearGradient id="pdfGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366F1"/><stop offset="100%" stopColor="#3730A3"/>
              </linearGradient>
            </defs>
            <rect width="128" height="128" rx="26" fill="url(#pdfGrad)"/>
            <rect x="22" y="84" width="14" height="22" rx="3" fill="white" opacity="0.55"/>
            <rect x="42" y="66" width="14" height="40" rx="3" fill="white" opacity="0.7"/>
            <rect x="62" y="50" width="14" height="56" rx="3" fill="white" opacity="0.85"/>
            <polyline points="29,78 49,60 69,46 95,26" fill="none" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="80,22 95,26 91,41" fill="none" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize:15, fontWeight:700, color:"#6366F1" }}>
            FinanceOS — Pré-visualização do PDF
          </span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => window.print()} style={{
            display:"flex", alignItems:"center", gap:8, padding:"10px 22px",
            borderRadius:9, border:"none", cursor:"pointer",
            background:"linear-gradient(135deg,#6366F1,#4F46E5)", color:"white",
            fontSize:13, fontWeight:700, fontFamily:"inherit",
            boxShadow:"0 4px 14px rgba(99,102,241,0.4)",
          }}>
            🖨️ Imprimir / Salvar PDF
          </button>
          <button onClick={onClose} style={{
            padding:"10px 18px", borderRadius:9, border:"1px solid #e2e8f0",
            cursor:"pointer", background:"white", color:"#64748b",
            fontSize:13, fontWeight:600, fontFamily:"inherit",
          }}>
            ✕ Fechar
          </button>
        </div>
      </div>

      {/* Conteúdo do relatório */}
      <div className="pdf-content" style={{
        maxWidth:860, margin:"0 auto", padding:"32px",
        fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
        color:"#0f172a",
      }}>

        {/* Cabeçalho */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, paddingBottom:18, borderBottom:"3px solid #6366F1" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width={44} height={44} style={{ borderRadius:10 }}>
              <defs>
                <linearGradient id="pdfGrad2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366F1"/><stop offset="100%" stopColor="#3730A3"/>
                </linearGradient>
              </defs>
              <rect width="128" height="128" rx="26" fill="url(#pdfGrad2)"/>
              <rect x="22" y="84" width="14" height="22" rx="3" fill="white" opacity="0.55"/>
              <rect x="42" y="66" width="14" height="40" rx="3" fill="white" opacity="0.7"/>
              <rect x="62" y="50" width="14" height="56" rx="3" fill="white" opacity="0.85"/>
              <polyline points="29,78 49,60 69,46 95,26" fill="none" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="80,22 95,26 91,41" fill="none" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px" }}>
                <span style={{ color:"#1e293b" }}>Finance</span>
                <span style={{ color:"#6366F1" }}>OS</span>
              </div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:2, textTransform:"uppercase", letterSpacing:"0.6px" }}>Sistema de Gestão Financeira</div>
            </div>
          </div>
          <div style={{ textAlign:"right", fontSize:12, color:"#64748b" }}>
            <div style={{ fontWeight:700, color:"#1e293b", marginBottom:2, fontSize:14 }}>Relatório Financeiro</div>
            <div>{date}</div>
            {salary > 0 && <div style={{ marginTop:3, color:"#6366F1", fontWeight:600 }}>Salário: {fR(salary)}</div>}
          </div>
        </div>

        {/* Cards de resumo */}
        <div style={{ display:"flex", gap:12, marginBottom:28 }}>
          {col("#fef2f2", "Total em dívidas",    fR(totalD))}
          {col("#fffbeb", "Parcelas mensais",     fR(totalM))}
          {col("#fffbeb", "Comprometimento",      salary > 0 ? Math.round(totalM/salary*100)+"%" : "—")}
          {col("#f0fdf4", "Dívidas quitadas",     paid.length+"x")}
        </div>

        {/* Tabela de dívidas ativas */}
        <div style={{ fontSize:13, fontWeight:700, color:"#1e293b", marginBottom:10, paddingBottom:8, borderBottom:"2px solid #e2e8f0" }}>
          Dívidas em aberto — {active.length} credores
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, marginBottom:28 }}>
          <thead>
            <tr>
              {["Credor / Categoria","Para","Parcela/mês","Total restante","Progresso","Vencimento","Status"].map(h => (
                <th key={h} style={{ background:"#6366F1", color:"white", padding:"9px 12px", textAlign:"left", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:"0.4px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.map((d, i) => {
              const instTotal = d.ti || (d.paid + d.rem);
              const pct = instTotal > 0 ? Math.round(d.paid / instTotal * 100) : 0;
              return (
                <tr key={d.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                  <td style={{ padding:"9px 12px", borderBottom:"1px solid #f1f5f9" }}>
                    <div style={{ fontWeight:600, color:"#0f172a" }}>{d.creditor}</div>
                    <div style={{ fontSize:10, color:"#64748b", marginTop:1 }}>{d.cat}{d.note ? ` · ${d.note}` : ""}</div>
                  </td>
                  <td style={{ padding:"9px 12px", borderBottom:"1px solid #f1f5f9", color:"#6366F1", fontWeight:600, fontSize:11 }}>{d.for_}</td>
                  <td style={{ padding:"9px 12px", borderBottom:"1px solid #f1f5f9", fontWeight:700 }}>{d.monthly > 0 ? fR(d.monthly) : "—"}</td>
                  <td style={{ padding:"9px 12px", borderBottom:"1px solid #f1f5f9", fontWeight:700, color:"#EF4444" }}>{fR(d.total)}</td>
                  <td style={{ padding:"9px 12px", borderBottom:"1px solid #f1f5f9" }}>
                    <div style={{ height:5, background:"#e2e8f0", borderRadius:99, overflow:"hidden", marginBottom:3 }}>
                      <div style={{ height:"100%", width:pct+"%", background:"#10B981", borderRadius:99 }}/>
                    </div>
                    <div style={{ fontSize:10, color:"#64748b" }}>{d.paid}/{instTotal} ({pct}%)</div>
                  </td>
                  <td style={{ padding:"9px 12px", borderBottom:"1px solid #f1f5f9", textAlign:"center", fontSize:11 }}>{d.due ? `Dia ${d.due}` : "—"}</td>
                  <td style={{ padding:"9px 12px", borderBottom:"1px solid #f1f5f9" }}>
                    <span style={{ fontSize:11, fontWeight:600, color:stColor[d.status] }}>{stLabel[d.status]}</span>
                  </td>
                </tr>
              );
            })}
            <tr style={{ background:"#eff6ff", borderTop:"2px solid #6366F1" }}>
              <td style={{ padding:"10px 12px" }} colSpan={2}><strong>TOTAL GERAL</strong></td>
              <td style={{ padding:"10px 12px", fontWeight:800 }}>{fR(totalM)}/mês</td>
              <td style={{ padding:"10px 12px", fontWeight:800, color:"#EF4444" }}>{fR(totalD)}</td>
              <td style={{ padding:"10px 12px", fontSize:11, color:"#64748b" }} colSpan={3}>{active.length} ativas · {paid.length} quitadas</td>
            </tr>
          </tbody>
        </table>

        {/* Dívidas quitadas */}
        {paid.length > 0 && (
          <>
            <div style={{ fontSize:13, fontWeight:700, color:"#1e293b", marginBottom:10, paddingBottom:8, borderBottom:"2px solid #e2e8f0" }}>
              ✅ Dívidas quitadas — {paid.length}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:28 }}>
              {paid.map(d => (
                <span key={d.id} style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#15803d", fontWeight:500 }}>
                  ✓ {d.creditor}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Rodapé */}
        <div style={{ marginTop:24, paddingTop:12, borderTop:"1px solid #e2e8f0", fontSize:10, color:"#94a3b8", textAlign:"center" }}>
          FinanceOS — Relatório gerado em {date} · Documento confidencial
        </div>

        {/* Dica — oculta na impressão */}
        <div className="no-print" style={{ marginTop:24, padding:"14px 20px", background:"#eff6ff", borderRadius:10, border:"1px solid #c7d2fe", textAlign:"center" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#6366F1", marginBottom:4 }}>Como salvar como PDF</div>
          <div style={{ fontSize:12, color:"#4338ca" }}>
            Clique em <strong>"Imprimir / Salvar PDF"</strong> → selecione <strong>"Salvar como PDF"</strong> como destino → clique em Salvar.
          </div>
        </div>

      </div>
    </div>
  );

  // Renderiza direto no body via portal — garante que o print CSS funcione
  return createPortal(content, document.body);
}
